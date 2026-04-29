package domain

type Role string

const (
	RoleSuperadmin     Role = "superadmin"
	RoleMerchantAdmin  Role = "merchant_admin"
	RoleStaff          Role = "staff"
	RoleCustomer       Role = "customer"
)

func (r Role) String() string { return string(r) }
