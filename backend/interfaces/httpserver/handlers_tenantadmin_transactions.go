package httpserver

import (
	"github.com/PaulUno777/jubely-saas/backend/application/usecase/loyalty"
	"encoding/json"
	"net/http"
	"strings"

	"github.com/PaulUno777/jubely-saas/backend/interfaces/http/presenter"
	"github.com/PaulUno777/jubely-saas/backend/pkg/i18n"
	"github.com/gin-gonic/gin"
)

func (s *Server) TenantListTransactions(c *gin.Context) {
	tenantID, ok := tenantIDFromScope(c)
	if !ok {
		respondError(c, http.StatusInternalServerError, i18n.CodeInternal, nil)
		return
	}
	dr, ok := parseTenantDateRangeQuery(c)
	if !ok {
		return
	}
	offset, limit := parsePageQuery(c)
	var eventType *string
	if v := strings.TrimSpace(c.Query("event_type")); v != "" {
		eventType = &v
	}
	out, err := s.ListStorePointEventsUC.Execute(c.Request.Context(), loyalty.ListStorePointEventsInput{
		TenantID:  tenantID,
		Offset:    offset,
		Limit:     limit,
		EventType: eventType,
		From:      &dr.From,
		To:        &dr.To,
	})
	if err != nil {
		respondMapped(c, mapTenantError(err))
		return
	}
	items := make([]gin.H, 0, len(out.Events))
	for _, e := range out.Events {
		item := gin.H{
			"event_id":   e.EventID.String(),
			"event_type": e.EventType,
			"delta":      e.Delta,
			"payload":    json.RawMessage(e.Payload),
			"created_at": e.CreatedAt,
		}
		if e.CustomerName != nil {
			item["customer_name"] = *e.CustomerName
		}
		if e.CustomerPhone != nil {
			item["customer_phone"] = *e.CustomerPhone
		}
		items = append(items, item)
	}
	respondPage(c, gin.H{
		"transactions": items,
		"period":       presenter.PeriodMeta(dr.From, dr.To, dr.Label),
	}, Pagination{Limit: out.Limit, Offset: out.Offset, Total: int(out.Total)})
}
