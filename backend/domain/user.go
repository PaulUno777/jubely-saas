package domain

import (
	"encoding/json"
	"time"

	"github.com/google/uuid"
)

// User is the global person/account record used for authentication.
// Tenant-scoped worker access now lives in TenantMembership.
type User struct {
	ID                 uuid.UUID
	Email              string
	PasswordHash       string
	Role               Role
	Permissions        json.RawMessage
	MustChangePassword bool
	CreatedAt          time.Time
}

func (u *User) IsSuperadmin() bool {
	return u.Role == RoleSuperadmin
}
