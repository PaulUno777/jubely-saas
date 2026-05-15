package ports

import "context"

// PhoneEnrollmentProofParser validates JWTs issued after customer OTP verification.
type PhoneEnrollmentProofParser interface {
	ParsePhoneEnrollmentProof(ctx context.Context, token string) (phoneE164 string, err error)
}

// PhoneEnrollmentProofSigner issues short-lived JWTs bound to a verified phone (enrollment flow).
type PhoneEnrollmentProofSigner interface {
	SignPhoneEnrollmentProof(ctx context.Context, phoneE164 string) (token string, err error)
}
