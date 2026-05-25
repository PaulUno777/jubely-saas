package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"github.com/PaulUno777/jubely-saas/backend/application/ports"
	"github.com/PaulUno777/jubely-saas/backend/application/usecase"
	"github.com/PaulUno777/jubely-saas/backend/domain"
	"github.com/PaulUno777/jubely-saas/backend/infrastructure/authtoken"
	"github.com/PaulUno777/jubely-saas/backend/infrastructure/memory"
	"github.com/PaulUno777/jubely-saas/backend/infrastructure/objectstorage"
	"github.com/PaulUno777/jubely-saas/backend/infrastructure/persistence/postgres"
	"github.com/PaulUno777/jubely-saas/backend/infrastructure/qr"
	"github.com/PaulUno777/jubely-saas/backend/infrastructure/security"
	"github.com/PaulUno777/jubely-saas/backend/infrastructure/timeutil"
	"github.com/PaulUno777/jubely-saas/backend/interfaces/httpserver"
	"github.com/PaulUno777/jubely-saas/backend/internal/config"
	"github.com/PaulUno777/jubely-saas/backend/internal/db"
	"github.com/PaulUno777/jubely-saas/backend/internal/migrate"
	"github.com/go-webauthn/webauthn/webauthn"
	"github.com/google/uuid"
)

func main() {
	ctx := context.Background()

	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("config: %v", err)
	}

	pool, err := db.NewPool(ctx, cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("db: %v", err)
	}
	defer pool.Close()

	if err := migrate.Up(ctx, cfg.DatabaseURL); err != nil {
		log.Fatalf("migrate: %v", err)
	}

	clock := timeutil.SystemClock{}
	hasher := security.BcryptHasher{}

	tenantRepo := &postgres.TenantRepository{Pool: pool}
	storeLoyaltyMetrics := &postgres.StoreLoyaltyMetrics{Pool: pool}
	storeCatalog := &postgres.StoreCatalog{Pool: pool}
	listStoreCustomers := &usecase.ListStoreCustomers{Catalog: storeCatalog}
	listStorePointEvents := &usecase.ListStorePointEvents{Catalog: storeCatalog}
	userRepo := &postgres.UserRepository{Pool: pool}
	invRepo := &postgres.InvitationRepository{Pool: pool}
	refreshRepo := &postgres.RefreshTokenRepository{Pool: pool}
	mfaRepo := &postgres.MFAFactorRepository{Pool: pool}
	waChallengeRepo := &postgres.WebAuthnChallengeRepository{Pool: pool}
	txManager := &postgres.TxManager{Pool: pool}
	customerRepo := &postgres.CustomerRepository{Pool: pool}
	enrollmentRepo := &postgres.EnrollmentRepository{Pool: pool}

	if cfg.BootstrapAutoSeed {
		n, err := userRepo.CountSuperadmins(ctx)
		if err != nil {
			log.Fatalf("bootstrap seed: %v", err)
		}
		if n == 0 {
			email := strings.TrimSpace(strings.ToLower(cfg.BootstrapSeedEmail))
			pass := cfg.BootstrapSeedPassword
			if email == "" || len(pass) < 8 {
				log.Fatalf("bootstrap seed: BOOTSTRAP_SUPERADMIN_EMAIL and BOOTSTRAP_SUPERADMIN_PASSWORD are required (min 8 chars)")
			}
			hash, err := hasher.Hash(pass)
			if err != nil {
				log.Fatalf("bootstrap seed: %v", err)
			}
			u := &domain.User{
				ID:                 uuid.New(),
				TenantID:           nil,
				Email:              email,
				PasswordHash:       hash,
				Role:               domain.RoleSuperadmin,
				MustChangePassword: true,
			}
			if err := userRepo.Create(ctx, u); err != nil {
				log.Fatalf("bootstrap seed: %v", err)
			}
			log.Printf("bootstrapped superadmin %s (must change password)", email)
		}
	}

	signer := &authtoken.JWTSigner{
		Secret: []byte(cfg.JWTSecret),
		TTL:    cfg.JWTAccessTTL,
	}
	qrCodec := &qr.HMACQRCodec{Secret: []byte(cfg.QRTokenSecret)}

	bootstrap := &usecase.BootstrapSuperadmin{
		Users:  userRepo,
		Hasher: hasher,
		Secret: cfg.BootstrapSecret,
	}
	login := &usecase.Login{
		Tenants:         tenantRepo,
		Users:           userRepo,
		Hasher:          hasher,
		Signer:          signer,
		RefreshTokens:   refreshRepo,
		Factors:         mfaRepo,
		Clock:           clock,
		RefreshTTL:      cfg.RefreshTokenTTL,
		MFAChallengeTTL: 5 * time.Minute,
		MFASigner:       signer,
	}
	refreshAuth := &usecase.RefreshAuth{
		Users:         userRepo,
		RefreshTokens: refreshRepo,
		Factors:       mfaRepo,
		Signer:        signer,
		Clock:         clock,
		TTL:           cfg.RefreshTokenTTL,
	}
	logout := &usecase.Logout{RefreshTokens: refreshRepo, Clock: clock}
	setupTOTP := &usecase.SetupTOTP{
		Factors: mfaRepo,
		Clock:   clock,
		Key:     cfg.MFAEncryptionKey,
		Issuer:  "Jubely",
	}
	confirmTOTP := &usecase.ConfirmTOTP{
		Factors: mfaRepo,
		Clock:   clock,
		Key:     cfg.MFAEncryptionKey,
	}

	wa, err := webauthn.New(&webauthn.Config{
		RPDisplayName: cfg.WebAuthnRPName,
		RPID:          cfg.WebAuthnRPID,
		RPOrigins:     []string{cfg.WebAuthnRPOrigin},
	})
	if err != nil {
		log.Fatalf("webauthn: %v", err)
	}
	beginPKReg := &usecase.BeginPasskeyRegistration{
		WebAuthn:     wa,
		Users:        userRepo,
		Factors:      mfaRepo,
		Challenges:   waChallengeRepo,
		Clock:        clock,
		ChallengeTTL: 5 * time.Minute,
	}
	finishPKReg := &usecase.FinishPasskeyRegistration{
		WebAuthn:   wa,
		Users:      userRepo,
		Factors:    mfaRepo,
		Challenges: waChallengeRepo,
		Clock:      clock,
	}
	beginPKAuth := &usecase.BeginPasskeyAuthentication{
		WebAuthn:     wa,
		Users:        userRepo,
		Factors:      mfaRepo,
		Challenges:   waChallengeRepo,
		Clock:        clock,
		ChallengeTTL: 5 * time.Minute,
	}
	finishPKAuth := &usecase.FinishPasskeyAuthentication{
		WebAuthn:   wa,
		Users:      userRepo,
		Factors:    mfaRepo,
		Challenges: waChallengeRepo,
		Clock:      clock,
	}

	verifyTOTPLogin := &usecase.VerifyLoginTOTP{
		Users:         userRepo,
		Factors:       mfaRepo,
		RefreshTokens: refreshRepo,
		Signer:        signer,
		MFASigner:     signer,
		Clock:         clock,
		RefreshTTL:    cfg.RefreshTokenTTL,
		Key:           cfg.MFAEncryptionKey,
	}

	finishPasskeyLogin := &usecase.FinishLoginPasskey{
		Users:         userRepo,
		Factors:       mfaRepo,
		RefreshTokens: refreshRepo,
		Signer:        signer,
		MFASigner:     signer,
		Clock:         clock,
		RefreshTTL:    cfg.RefreshTokenTTL,
		PasskeyAuth:   finishPKAuth,
	}
	changePassword := &usecase.ChangePassword{
		Users:  userRepo,
		Hasher: hasher,
	}
	createTenant := &usecase.CreateTenant{
		Tenants: tenantRepo,
		Clock:   clock,
	}
	listTenants := &usecase.ListTenants{Tenants: tenantRepo}
	updateTenant := &usecase.UpdateTenant{Tenants: tenantRepo, Clock: clock}
	listTenantUsers := &usecase.ListTenantUsers{Tenants: tenantRepo, Users: userRepo}
	inviteTTL := 7 * 24 * time.Hour
	createInvitation := &usecase.CreateMerchantInvitation{
		Tenants:     tenantRepo,
		Invitations: invRepo,
		Clock:       clock,
		TokenTTL:    inviteTTL,
		DefaultRole: domain.RoleMerchantAdmin,
	}
	acceptInvitation := &usecase.AcceptMerchantInvitation{
		Tx:          txManager,
		Users:       userRepo,
		Invitations: invRepo,
		Hasher:      hasher,
		Clock:       clock,
	}
	createTenantUser := &usecase.CreateTenantUser{
		Tenants: tenantRepo,
		Users:   userRepo,
		Hasher:  hasher,
	}
	superadminStats := &usecase.SuperadminStats{Tenants: tenantRepo}
	createCustomer := &usecase.CreateCustomerByStaff{
		Tx:          txManager,
		Customers:   customerRepo,
		Enrollments: enrollmentRepo,
		QRCodec:     qrCodec,
	}
	getPWAWallet := &usecase.GetPWAWallet{
		QRCodec:     qrCodec,
		Tenants:     tenantRepo,
		Enrollments: enrollmentRepo,
		Catalog:     storeCatalog,
	}
	enrollByStoreQR := &usecase.EnrollByStoreQR{
		Tx:                       txManager,
		Clock:                    clock,
		Tenants:                  tenantRepo,
		Customers:                customerRepo,
		Enrollments:              enrollmentRepo,
		QRCodec:                  qrCodec,
		PhoneProofParser:         signer,
		RequirePhoneVerification: cfg.PublicEnrollRequirePhoneVerify,
	}

	phoneOTPStore := memory.NewPhoneOTPStore()
	publicCustomerOTP := &usecase.PublicCustomerOTP{
		Store:       phoneOTPStore,
		ProofSigner: signer,
		Clock:       clock,
	}

	pointEvents := &postgres.PointEventRepository{Pool: pool}
	staffRecordPurchase := &usecase.StaffRecordPurchase{
		Tenants:     tenantRepo,
		Customers:   customerRepo,
		Enrollments: enrollmentRepo,
		Points:      pointEvents,
	}

	storeSignup := &usecase.StoreSignup{
		Tx:      txManager,
		Tenants: tenantRepo,
		Users:   userRepo,
		Hasher:  hasher,
		Signer:  signer,
		Clock:   clock,
	}

	var objStorage ports.ObjectStorage
	switch cfg.FileStorageDriver {
	case "r2":
		r2s, err := objectstorage.NewR2(objectstorage.R2Config{
			AccountID:       cfg.R2AccountID,
			AccessKeyID:     cfg.R2AccessKeyID,
			SecretAccessKey: cfg.R2SecretAccessKey,
			Bucket:          cfg.R2Bucket,
			PublicBaseURL:   cfg.PublicFileBaseURL,
		})
		if err != nil {
			log.Fatalf("file storage (r2): %v", err)
		}
		objStorage = r2s
	case "local":
		if cfg.AssetUploadDir == "" {
			log.Fatal("FILE_STORAGE_DRIVER=local requires ASSET_UPLOAD_DIR")
		}
		pub := cfg.PublicFileBaseURL
		if pub == "" {
			pub = "http://localhost:8080/v1/public/files"
			log.Printf("PUBLIC_FILE_BASE_URL not set; using %s for uploaded file URLs", pub)
		}
		objStorage = objectstorage.NewLocalFS(cfg.AssetUploadDir, pub)
	default:
		if cfg.AssetUploadDir != "" {
			pub := cfg.PublicFileBaseURL
			if pub == "" {
				pub = "http://localhost:8080/v1/public/files"
				log.Printf("PUBLIC_FILE_BASE_URL not set; using %s for uploaded file URLs", pub)
			}
			objStorage = objectstorage.NewLocalFS(cfg.AssetUploadDir, pub)
		}
	}

	var uploadTenantLogo *usecase.UploadTenantLogo
	if objStorage != nil {
		uploadTenantLogo = &usecase.UploadTenantLogo{Storage: objStorage, MaxBytes: 2 << 20}
	}

	srv := &httpserver.Server{
		BootstrapUC:           bootstrap,
		LoginUC:               login,
		RefreshUC:             refreshAuth,
		LogoutUC:              logout,
		SetupTOTPUC:           setupTOTP,
		ConfirmTOTPUC:         confirmTOTP,
		BeginPasskeyRegUC:     beginPKReg,
		FinishPasskeyRegUC:    finishPKReg,
		BeginPasskeyAuthUC:    beginPKAuth,
		FinishPasskeyAuthUC:   finishPKAuth,
		VerifyTOTPLoginUC:     verifyTOTPLogin,
		FinishPasskeyLoginUC:  finishPasskeyLogin,
		MFASigner:             signer,
		ChangePasswordUC:      changePassword,
		StoreSignupUC:         storeSignup,
		CreateTenantUC:        createTenant,
		ListTenantsUC:         listTenants,
		UpdateTenantUC:        updateTenant,
		ListTenantUsersUC:     listTenantUsers,
		CreateInvitationUC:    createInvitation,
		AcceptInvitationUC:    acceptInvitation,
		CreateTenantUserUC:    createTenantUser,
		SuperadminStatsUC:     superadminStats,
		CreateCustomerUC:      createCustomer,
		EnrollByStoreQRUC:     enrollByStoreQR,
		GetPWAWalletUC:        getPWAWallet,
		StaffRecordPurchaseUC:  staffRecordPurchase,
		ListStoreCustomersUC:   listStoreCustomers,
		ListStorePointEventsUC: listStorePointEvents,
		PublicCustomerOTP:     publicCustomerOTP,
		QRCodec:               qrCodec,
		Tenants:               tenantRepo,
		Users:                 userRepo,
		Invitations:           invRepo,
		CORSAllowAll:          cfg.CORSAllowAll,
		AssetUploadDir:        cfg.AssetUploadDir,
		UploadTenantLogoUC:    uploadTenantLogo,
		StoreMetrics:          storeLoyaltyMetrics,
		StoreCatalog:          storeCatalog,
	}

	engine := httpserver.NewRouter(signer, srv)

	httpServer := &http.Server{
		Addr:              ":" + cfg.HTTPPort,
		Handler:           engine,
		ReadHeaderTimeout: 5 * time.Second,
		ReadTimeout:       15 * time.Second,
		WriteTimeout:      30 * time.Second,
		IdleTimeout:       60 * time.Second,
	}

	go func() {
		log.Printf("listening on %s", httpServer.Addr)
		if err := httpServer.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("listen: %v", err)
		}
	}()

	stop := make(chan os.Signal, 1)
	signal.Notify(stop, syscall.SIGINT, syscall.SIGTERM)
	<-stop

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := httpServer.Shutdown(shutdownCtx); err != nil {
		log.Printf("shutdown: %v", err)
	}
	log.Println("bye")
}
