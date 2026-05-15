package usecase

import (
	"context"
	"testing"
	"time"

	"github.com/PaulUno777/jubely-saas/backend/infrastructure/authtoken"
	"github.com/PaulUno777/jubely-saas/backend/infrastructure/memory"
)

func TestPublicCustomerOTP_verify_happy_path(t *testing.T) {
	t.Parallel()
	store := memory.NewPhoneOTPStore()
	signer := &authtoken.JWTSigner{Secret: []byte("01234567890123456789012345678901"), TTL: time.Minute}
	uc := &PublicCustomerOTP{Store: store, ProofSigner: signer, Clock: stubClock{t: time.Unix(1, 0)}}

	phone := "+237600000099"
	store.SetCode(phone, "424242", 10*time.Minute)

	out, err := uc.Verify(context.Background(), PublicCustomerOTPVerifyInput{PhoneE164: phone, Code: "424242"})
	if err != nil {
		t.Fatal(err)
	}
	if out.PhoneVerifyToken == "" {
		t.Fatal("expected token")
	}
	got, err := signer.ParsePhoneEnrollmentProof(context.Background(), out.PhoneVerifyToken)
	if err != nil || got != phone {
		t.Fatalf("proof: %q err=%v", got, err)
	}
}
