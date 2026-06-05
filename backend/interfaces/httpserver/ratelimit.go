package httpserver

import (
	"net/http"
	"sync"
	"time"

	"github.com/PaulUno777/jubely-saas/backend/pkg/i18n"
	"github.com/gin-gonic/gin"
)

type ipWindowLimiter struct {
	mu  sync.Mutex
	m   map[string][]time.Time
	max int
	win time.Duration
}

func newIPWindowLimiter(max int, win time.Duration) *ipWindowLimiter {
	return &ipWindowLimiter{m: make(map[string][]time.Time), max: max, win: win}
}

func (w *ipWindowLimiter) allow(key string) bool {
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

// GinRateLimit returns middleware that returns 429 when an IP exceeds max hits per window.
func GinRateLimit(l *ipWindowLimiter) gin.HandlerFunc {
	return func(c *gin.Context) {
		if !l.allow(c.ClientIP()) {
			respondError(c, http.StatusTooManyRequests, i18n.CodeRateLimit, nil)
			c.Abort()
			return
		}
		c.Next()
	}
}

var (
	rateLimitBootstrap       = newIPWindowLimiter(10, time.Minute)
	rateLimitLogin           = newIPWindowLimiter(30, time.Minute)
	rateLimitPublicSignup    = newIPWindowLimiter(20, time.Minute)
	rateLimitPublicEnroll    = newIPWindowLimiter(40, time.Minute)
	rateLimitPublicTenant    = newIPWindowLimiter(120, time.Minute)
	rateLimitPublicOTPSend   = newIPWindowLimiter(10, time.Minute)
	rateLimitPublicOTPVerify = newIPWindowLimiter(30, time.Minute)
)
