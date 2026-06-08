Recommandations de stack UI pour aller vite
shadcn/ui — le choix principal
C'est le meilleur choix pour Jubilee. Pas une lib à installer — c'est du code source que tu possèdes dans ton repo. Chaque composant copié dans src/components/ui/ est modifiable sans dépendance.
bashnpx shadcn@latest init
npx shadcn@latest add button input form dialog table tabs badge
Pour la phase 1 spécifiquement : Dialog pour le modal de création de tenant, Table pour la liste des tenants, Form avec react-hook-form + zod pour toute la validation, Badge pour les statuts pill.
Stack complète recommandée
BesoinOutilPourquoiComposants UIshadcn/ui + Radix UIAccessibilité out-of-the-box, customisableStylingTailwind CSS v4Coexiste parfaitement avec shadcnFormulairesreact-hook-form + zodValidation TypeScript-native, zéro re-render inutileState globalZustandLéger, pas de boilerplate ReduxFetchingTanStack Query v5Cache, loading states, mutations avec rollbackIcôneslucide-reactCohérent avec shadcn, tree-shakeableDatesdate-fnsLéger, pas de moment.jsQR codeqrcode.reactSimple, SVG/CanvasToastshadcn SonnerIntégré dans shadcnTablesTanStack Table v8Sorting, filtering, pagination — s'intègre avec shadcnChartsRechartsCompatible shadcn, exemples officiels disponibles
Pour le 2FA — librairies côté client
Pour les passkeys (WebAuthn) : @simplewebauthn/browser côté client, @simplewebauthn/server côté Go via un binding ou en implémentant la spec directement. La lib JS gère tout le flow navigator.credentials.create() et navigator.credentials.get().
Pour le TOTP (Google Auth, Authy) : côté client rien à installer — c'est juste un <input> de 6 chiffres. Côté Go, utilise github.com/pquerna/otp pour générer les secrets et valider les codes.
goimport "github.com/pquerna/otp/totp"

key, \_ := totp.Generate(totp.GenerateOpts{Issuer: "Jubilee", AccountName: email})
valid := totp.Validate(userCode, key.Secret())
Pour le QR de configuration TOTP (le QR que l'utilisateur scanne avec Google Auth) : key.URL() retourne l'URI otpauth:// — tu l'encodes en QR avec qrcode.react et tu l'affiches à l'écran au moment de la configuration.
Typographie cohérente avec les maquettes
css@import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@300;400;500&family=DM+Mono:wght@400;500&display=swap');

--font-display: 'Instrument Serif', serif; /_ titres de page, wordmark _/
--font-body: 'DM Sans', sans-serif; /_ tout le corps de texte _/
--font-mono: 'DM Mono', monospace; /_ slugs, codes, valeurs FCFA _/
Ce trio donne exactement l'identité des maquettes ci-dessus — raffinée, lisible, pas générique.
