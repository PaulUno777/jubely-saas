package httpserver

import (
	"errors"
	"net/http"

	"github.com/PaulUno777/jubely-saas/backend/domain"
	"github.com/PaulUno777/jubely-saas/backend/pkg/i18n"
	"github.com/gin-gonic/gin"
)

func respondError(c *gin.Context, httpStatus int, code string) {
	c.JSON(httpStatus, gin.H{"error": gin.H{"code": code}})
}

func mapBootstrapError(err error) (httpStatus int, code string) {
	switch {
	case errors.Is(err, domain.ErrForbidden):
		return http.StatusForbidden, i18n.CodeBootstrapForbidden
	case errors.Is(err, domain.ErrConflict):
		return http.StatusConflict, i18n.CodeBootstrapAlreadyCompleted
	case errors.Is(err, domain.ErrInvalid):
		return http.StatusBadRequest, i18n.CodeValidationInvalid
	default:
		return http.StatusInternalServerError, i18n.CodeInternal
	}
}

func mapLoginError(err error) (httpStatus int, code string) {
	switch {
	case errors.Is(err, domain.ErrInvalid):
		return http.StatusBadRequest, i18n.CodeValidationInvalid
	case errors.Is(err, domain.ErrNotFound), errors.Is(err, domain.ErrUnauthorized):
		return http.StatusUnauthorized, i18n.CodeAuthInvalidCredentials
	default:
		return http.StatusInternalServerError, i18n.CodeInternal
	}
}

func mapTenantError(err error) (httpStatus int, code string) {
	switch {
	case errors.Is(err, domain.ErrConflict):
		return http.StatusConflict, i18n.CodeTenantSlugTaken
	case errors.Is(err, domain.ErrInvalid):
		return http.StatusBadRequest, i18n.CodeValidationInvalid
	case errors.Is(err, domain.ErrNotFound):
		return http.StatusNotFound, i18n.CodeTenantNotFound
	default:
		return http.StatusInternalServerError, i18n.CodeInternal
	}
}

func mapPublicInvitationError(err error) (httpStatus int, code string) {
	switch {
	case errors.Is(err, domain.ErrNotFound):
		return http.StatusBadRequest, i18n.CodeInvitationInvalid
	case errors.Is(err, domain.ErrConflict):
		return http.StatusConflict, i18n.CodeInvitationAlreadyAccepted
	case errors.Is(err, domain.ErrEmailTaken):
		return http.StatusConflict, i18n.CodeUserEmailTaken
	case errors.Is(err, domain.ErrInvalid):
		return http.StatusBadRequest, i18n.CodeValidationInvalid
	case errors.Is(err, domain.ErrInvitationExpired):
		return http.StatusGone, i18n.CodeInvitationExpired
	default:
		return http.StatusInternalServerError, i18n.CodeInternal
	}
}
