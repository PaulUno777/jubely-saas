package presenter

import (
	"github.com/PaulUno777/jubely-saas/backend/domain"
	"github.com/gin-gonic/gin"
)

func Location(st domain.Store) gin.H {
	out := gin.H{
		"id":           st.ID.String(),
		"tenant_id":    st.TenantID.String(),
		"slug":         st.Slug,
		"name":         st.Name,
		"country_code": st.CountryCode,
		"city":         st.City,
		"address_line": st.AddressLine,
		"status":       string(st.Status),
		"is_hq":        st.IsHQ,
		"timezone":     st.Timezone,
	}
	if st.StateCode != "" {
		out["state_code"] = st.StateCode
	}
	if st.Lat != nil {
		out["lat"] = *st.Lat
	}
	if st.Lng != nil {
		out["lng"] = *st.Lng
	}
	return out
}
