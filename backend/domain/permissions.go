package domain

// Permission keys for Phase 2 RBAC (JWT claim "perms").
const (
	PermManageStaff       = "manage_staff"
	PermRecordTransaction = "record_transaction"
	PermEnrollCustomer    = "enroll_customer"
	PermApplyReward       = "apply_reward"
	PermManageRules       = "manage_rules"
	PermManageRewards     = "manage_rewards"
	PermViewAnalytics     = "view_analytics"
)

// DefaultPermissionsForRole returns baseline permissions embedded in access tokens.
// Empty slice for superadmin (not used on tenant routes). Old tokens without "perms"
// claim are treated as this set at middleware evaluation time when Permissions is nil.
func DefaultPermissionsForRole(role Role) []string {
	switch role {
	case RoleSuperadmin:
		return nil
	case RoleMerchantAdmin:
		return []string{
			PermManageStaff, PermRecordTransaction, PermEnrollCustomer, PermApplyReward,
			PermManageRules, PermManageRewards, PermViewAnalytics,
		}
	case RoleStaff:
		return []string{PermRecordTransaction, PermEnrollCustomer, PermApplyReward}
	default:
		return nil
	}
}

func HasPermission(granted []string, want string) bool {
	for _, p := range granted {
		if p == want {
			return true
		}
	}
	return false
}
