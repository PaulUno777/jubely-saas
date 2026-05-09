package domain

import (
	"encoding/json"
	"time"

	"github.com/google/uuid"
)

// User is an authenticated operator or end-user.
// Superadmin has TenantID=nil.
type User struct {
	ID                 uuid.UUID
	TenantID           *uuid.UUID
	Email              string
	PasswordHash       string
	Role               Role
	Permissions        json.RawMessage
	MustChangePassword bool
	CreatedAt          time.Time
}

func (u *User) IsSuperadmin() bool {
	return u.Role == RoleSuperadmin && u.TenantID == nil
}
