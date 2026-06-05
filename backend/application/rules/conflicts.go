package rules

// ConflictLevel classifies rule validation findings.
type ConflictLevel string

const (
	ConflictLevelWarn  ConflictLevel = "warn"
	ConflictLevelError ConflictLevel = "error"
	ConflictLevelInfo  ConflictLevel = "info"
)

// ConflictReport is one overlap or configuration issue between active rules.
type ConflictReport struct {
	Level ConflictLevel `json:"level"`
	Rules []string      `json:"rules"`
	Msg   string        `json:"msg"`
}

// DetectConflicts mirrors admin-simulator.jsx detectConflicts(rules).
func DetectConflicts(rules []Rule) []ConflictReport {
	out := make([]ConflictReport, 0)
	active := filterOn(rules)
	txActive := make([]Rule, 0, len(active))
	for _, r := range active {
		if r.Trigger == "transaction" {
			txActive = append(txActive, r)
		}
	}

	mults := make([]Rule, 0)
	for _, r := range txActive {
		if r.Action.Type == "mult" {
			mults = append(mults, r)
		}
	}

	for i := 0; i < len(mults); i++ {
		for j := i + 1; j < len(mults); j++ {
			a, b := mults[i], mults[j]
			if !daysOverlap(a, b) || !hoursOverlap(a, b) {
				continue
			}
			out = append(out, ConflictReport{
				Level: ConflictLevelWarn,
				Rules: []string{a.Name, b.Name},
				Msg:   "« " + a.Name + " » et « " + b.Name + " » peuvent se cumuler le même jour — un client Or pourrait obtenir un multiplicateur ×4 involontaire.",
			})
		}
	}

	hasRate := false
	for _, r := range txActive {
		if r.Action.Type == "rate" {
			hasRate = true
			break
		}
	}
	if !hasRate {
		out = append(out, ConflictReport{
			Level: ConflictLevelError,
			Rules: nil,
			Msg:   "Aucune règle de base active : les achats ne génèrent aucun point par défaut.",
		})
	}

	for _, r := range rules {
		if !r.On && r.Tag == "Bonus" {
			out = append(out, ConflictReport{
				Level: ConflictLevelInfo,
				Rules: nil,
				Msg:   "Une règle bonus est désactivée — réactivez-la pour récompenser l'événement concerné.",
			})
			break
		}
	}

	return out
}

func daysOverlap(a, b Rule) bool {
	for _, d := range a.Cond.Days {
		for _, d2 := range b.Cond.Days {
			if d == d2 {
				return true
			}
		}
	}
	return false
}

func hoursOverlap(a, b Rule) bool {
	if len(a.Cond.Hours) < 2 || len(b.Cond.Hours) < 2 {
		return true
	}
	return a.Cond.Hours[0] < b.Cond.Hours[1] && b.Cond.Hours[0] < a.Cond.Hours[1]
}
