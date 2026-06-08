package middleware

import (
	"net/http"
	"sync"
	"time"

	"github.com/PaulUno777/jubely-saas/backend/interfaces/http/response"
	"github.com/PaulUno777/jubely-saas/backend/pkg/i18n"
	"github.com/gin-gonic/gin"
)

type IPWindowLimiter struct {
	mu  sync.Mutex
	m   map[string][]time.Time
	max int
	win time.Duration
}

func NewIPWindowLimiter(max int, win time.Duration) *IPWindowLimiter {
	return &IPWindowLimiter{m: make(map[string][]time.Time), max: max, win: win}
}

func (w *IPWindowLimiter) allow(key string) bool {
	w.mu.Lock()
	defer w.mu.Unlock()
	now := time.Now()
	cut := now.Add(-w.win)
	prev := w.m[key]
	var keep []time.Time
	for _, t := range prev {
		if t.After(cut) {
			keep = append(keep, t)
		}
	}
	if len(keep) >= w.max {
		w.m[key] = keep
		return false
	}
	keep = append(keep, now)
	w.m[key] = keep
	return true
}

func RateLimit(l *IPWindowLimiter) gin.HandlerFunc {
	return func(c *gin.Context) {
		if !l.allow(c.ClientIP()) {
			response.Error(c, http.StatusTooManyRequests, i18n.CodeRateLimit, nil)
			c.Abort()
			return
		}
		c.Next()
	}
}

var (
	RateLimitBootstrap       = NewIPWindowLimiter(10, time.Minute)
	RateLimitLogin           = NewIPWindowLimiter(30, time.Minute)
	RateLimitPublicSignup    = NewIPWindowLimiter(20, time.Minute)
	RateLimitPublicEnroll    = NewIPWindowLimiter(40, time.Minute)
	RateLimitPublicTenant    = NewIPWindowLimiter(120, time.Minute)
	RateLimitPublicOTPSend   = NewIPWindowLimiter(10, time.Minute)
	RateLimitPublicOTPVerify = NewIPWindowLimiter(30, time.Minute)
)
