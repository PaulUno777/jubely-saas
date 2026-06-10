package rules

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"sync"
)

type compiledCache struct {
	mu    sync.RWMutex
	items map[string][]Rule
}

var tenantRulesCache compiledCache

func init() {
	tenantRulesCache.items = make(map[string][]Rule)
}

func rulesHash(raw []json.RawMessage) string {
	h := sha256.New()
	for _, b := range raw {
		h.Write(b)
	}
	return hex.EncodeToString(h.Sum(nil))
}

// GetCachedTenantRules returns parsed active rules when the tenant cache is warm.
func GetCachedTenantRules(tenantID string) ([]Rule, bool) {
	tenantRulesCache.mu.RLock()
	defer tenantRulesCache.mu.RUnlock()
	r, ok := tenantRulesCache.items[tenantID]
	return r, ok
}

// SetCachedTenantRules stores parsed active rules for a tenant.
func SetCachedTenantRules(tenantID string, parsed []Rule) {
	tenantRulesCache.mu.Lock()
	tenantRulesCache.items[tenantID] = parsed
	tenantRulesCache.mu.Unlock()
}

// InvalidateTenantRulesCache drops cached compiled rules for a tenant.
func InvalidateTenantRulesCache(tenantID string) {
	tenantRulesCache.mu.Lock()
	delete(tenantRulesCache.items, tenantID)
	tenantRulesCache.mu.Unlock()
}
