package rules

import "strings"

// ValidateRuleConstraints returns constraint violations for a single rule draft.
func ValidateRuleConstraints(r Rule) []ConflictReport {
	out := make([]ConflictReport, 0)
	if strings.TrimSpace(r.Name) == "" {
		out = append(out, ConflictReport{
			Level: ConflictLevelError,
			Rules: []string{r.ID},
			Msg:   "Le nom de la règle est obligatoire.",
		})
	}
	if r.IsAdvanced() {
		if len(r.Actions) == 0 {
			out = append(out, ConflictReport{
				Level: ConflictLevelError,
				Rules: []string{r.ID},
				Msg:   "Une règle avancée doit avoir au moins une action.",
			})
		} else if err := validateAdvancedRule(r); err != nil {
			out = append(out, ConflictReport{
				Level: ConflictLevelError,
				Rules: []string{r.ID},
				Msg:   err.Error(),
			})
		}
	}
	return out
}

// HasBlockingConflicts is true when any report has error level.
func HasBlockingConflicts(reports []ConflictReport) bool {
	for _, r := range reports {
		if r.Level == ConflictLevelError {
			return true
		}
	}
	return false
}
