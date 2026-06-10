package rules

// HasActiveBaseRule reports whether the loyalty program can award purchase points.
func HasActiveBaseRule(rules []Rule, activeFlags []bool) bool {
	for i, r := range rules {
		if i < len(activeFlags) && !activeFlags[i] {
			continue
		}
		if r.Frozen || !r.On {
			continue
		}
		if r.IsAdvanced() {
			continue
		}
		if r.Trigger == "transaction" && r.Action.Type == "rate" {
			return true
		}
	}
	return false
}
