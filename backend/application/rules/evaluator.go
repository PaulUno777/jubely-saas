package rules

import (
	"encoding/json"
	"strconv"
	"time"
)

// Rule matches the admin simulator JSON (stored in points_rules.rule_json).
type Rule struct {
	ID            string        `json:"id"`
	Name          string        `json:"name"`
	Tag           string        `json:"tag,omitempty"`
	On            bool          `json:"on"`
	Trigger       string        `json:"trigger"`
	Cond          RuleCondition `json:"cond"`
	Action        RuleAction    `json:"action"`
	SchemaVersion int           `json:"schemaVersion,omitempty"`
	EditorTier    string        `json:"editorTier,omitempty"`
	Frozen        bool          `json:"frozen,omitempty"`
	FrozenReason  string        `json:"frozenReason,omitempty"`
	Logic         string        `json:"logic,omitempty"`
	Conditions    []AstCondition `json:"conditions,omitempty"`
	Actions       []AstAction    `json:"actions,omitempty"`
}

type AstCondition struct {
	Type  string   `json:"type"`
	Op    string   `json:"op,omitempty"`
	Value float64  `json:"value,omitempty"`
	Days  []int    `json:"days,omitempty"`
	From  int      `json:"from,omitempty"`
	To    int      `json:"to,omitempty"`
	Tiers []string `json:"tiers,omitempty"`
	Store string   `json:"store,omitempty"`
}

type AstAction struct {
	Type   string  `json:"type"`
	Factor float64 `json:"factor,omitempty"`
	Pts    int     `json:"pts,omitempty"`
	Via    string  `json:"via,omitempty"`
	Reward string  `json:"reward,omitempty"`
}

func (r Rule) IsAdvanced() bool {
	return r.SchemaVersion >= 2 || r.EditorTier == "advanced"
}

type RuleCondition struct {
	Days      []int  `json:"days"`
	Hours     []int  `json:"hours"`
	Tier      string `json:"tier"`
	MinAmount int64  `json:"minAmount"`
}

type RuleAction struct {
	Type   string  `json:"type"`
	Per    int64   `json:"per,omitempty"`
	Pts    int     `json:"pts,omitempty"`
	Factor float64 `json:"factor,omitempty"`
}

type EvalContext struct {
	AmountFcfa int64
	Day        int
	Hour       int
	Tier       string
	IsNew      bool
}

type TraceEntry struct {
	RuleID   string `json:"rule_id"`
	RuleName string `json:"rule_name"`
	Applied  bool   `json:"applied"`
	Pts      string `json:"pts,omitempty"`
	Detail   string `json:"detail,omitempty"`
	Reason   string `json:"reason,omitempty"`
}

type EvalResult struct {
	Trace  []TraceEntry `json:"trace"`
	Base   int          `json:"base"`
	Factor float64      `json:"factor"`
	Bonus  int          `json:"bonus"`
	Total  int          `json:"total"`
}

func WeekdayToSimDay(t time.Time) int {
	w := int(t.Weekday())
	return (w + 6) % 7
}

func ParseRules(raw []json.RawMessage) ([]Rule, error) {
	out := make([]Rule, 0, len(raw))
	for _, b := range raw {
		var r Rule
		if err := json.Unmarshal(b, &r); err != nil {
			return nil, err
		}
		out = append(out, r)
	}
	return out, nil
}

func EvaluateTransaction(rules []Rule, ctx EvalContext) EvalResult {
	trace := make([]TraceEntry, 0)
	base := 0
	total := 0
	active := filterOn(rules)

	// Advanced rules first pass (side effects on factor/total).
	factor := 1.0
	for _, r := range active {
		if !r.IsAdvanced() || r.Frozen {
			if r.IsAdvanced() && r.Frozen {
				trace = append(trace, TraceEntry{
					RuleID: r.ID, RuleName: r.Name, Applied: false,
					Reason: "Règle gelée (plan Standard)",
				})
			}
			continue
		}
		evaluateAdvancedRule(r, ctx, &base, &total, &factor, &trace)
	}

	for _, r := range active {
		if r.IsAdvanced() || r.Frozen {
			continue
		}
		if r.Action.Type != "rate" || r.Trigger != "transaction" {
			continue
		}
		entry := TraceEntry{RuleID: r.ID, RuleName: r.Name}
		if dayOK(r, ctx) && ctx.AmountFcfa >= r.Cond.MinAmount && r.Action.Per > 0 {
			pts := int(ctx.AmountFcfa/r.Action.Per) * r.Action.Pts
			base += pts
			total += pts
			entry.Applied = true
			entry.Pts = "+" + itoa(pts)
			entry.Detail = formatRateDetail(ctx.AmountFcfa, r.Action.Per, r.Action.Pts)
		} else {
			entry.Applied = false
			entry.Reason = "Hors conditions"
		}
		trace = append(trace, entry)
	}

	for _, r := range active {
		if r.IsAdvanced() || r.Frozen {
			continue
		}
		if r.Action.Type != "flat" {
			continue
		}
		entry := TraceEntry{RuleID: r.ID, RuleName: r.Name}
		tierOk := r.Cond.Tier == "all" || (r.Cond.Tier == "new" && ctx.IsNew)
		trigOk := r.Trigger == "transaction" || (r.Trigger == "enroll" && ctx.IsNew)
		if tierOk && trigOk && dayOK(r, ctx) {
			total += r.Action.Pts
			entry.Applied = true
			entry.Pts = "+" + itoa(r.Action.Pts)
			entry.Detail = "Bonus fixe"
		} else {
			entry.Applied = false
			if ctx.IsNew {
				entry.Reason = "Hors conditions"
			} else {
				entry.Reason = "Client existant"
			}
		}
		trace = append(trace, entry)
	}

	for _, r := range active {
		if r.IsAdvanced() || r.Frozen {
			continue
		}
		if r.Action.Type != "mult" || r.Trigger != "transaction" {
			continue
		}
		entry := TraceEntry{RuleID: r.ID, RuleName: r.Name}
		if dayOK(r, ctx) && hourOK(r, ctx) && tierOK(r, ctx) && ctx.AmountFcfa >= r.Cond.MinAmount {
			factor *= r.Action.Factor
			entry.Applied = true
			entry.Pts = "×" + formatFloat(r.Action.Factor)
			entry.Detail = "Multiplicateur"
		} else {
			entry.Applied = false
			entry.Reason = multRejectReason(r, ctx)
		}
		trace = append(trace, entry)
	}

	bonus := total - base
	final := int(float64(base)*factor) + bonus
	return EvalResult{Trace: trace, Base: base, Factor: factor, Bonus: bonus, Total: final}
}

// AppliedRuleIDs extracts rule IDs from a trace where the rule was applied.
func AppliedRuleIDs(trace []TraceEntry) []string {
	out := make([]string, 0, len(trace))
	for _, e := range trace {
		if e.Applied && e.RuleID != "" {
			out = append(out, e.RuleID)
		}
	}
	return out
}

func filterOn(rules []Rule) []Rule {
	var out []Rule
	for _, r := range rules {
		if r.On {
			out = append(out, r)
		}
	}
	return out
}

func dayOK(r Rule, ctx EvalContext) bool {
	for _, d := range r.Cond.Days {
		if d == ctx.Day {
			return true
		}
	}
	return false
}

func hourOK(r Rule, ctx EvalContext) bool {
	if len(r.Cond.Hours) < 2 {
		return true
	}
	return ctx.Hour >= r.Cond.Hours[0] && ctx.Hour < r.Cond.Hours[1]
}

func tierOK(r Rule, ctx EvalContext) bool {
	if r.Cond.Tier == "all" {
		return true
	}
	return r.Cond.Tier == ctx.Tier
}

func multRejectReason(r Rule, ctx EvalContext) string {
	if !dayOK(r, ctx) {
		return "Mauvais jour"
	}
	if !hourOK(r, ctx) {
		return "Hors plage horaire"
	}
	if !tierOK(r, ctx) {
		return "Palier non éligible"
	}
	return "Montant insuffisant"
}

func itoa(n int) string {
	if n == 0 {
		return "0"
	}
	neg := n < 0
	if neg {
		n = -n
	}
	var b [20]byte
	i := len(b)
	for n > 0 {
		i--
		b[i] = byte('0' + n%10)
		n /= 10
	}
	if neg {
		i--
		b[i] = '-'
	}
	return string(b[i:])
}

func formatFloat(f float64) string {
	return strconv.FormatFloat(f, 'f', -1, 64)
}

func formatRateDetail(amount, per int64, pts int) string {
	return itoa(int(amount)) + " F ÷ " + itoa(int(per)) + " × " + itoa(pts)
}

// DefaultPilotRules returns the design-aligned standard earn rule (1 pt / 100 FCFA).
func DefaultPilotRules() []Rule {
	return []Rule{
		{
			ID: "std", Name: "Achat standard", Tag: "Base", On: true, Trigger: "transaction",
			Cond: RuleCondition{Days: []int{0, 1, 2, 3, 4, 5, 6}, Tier: "all"},
			Action: RuleAction{Type: "rate", Per: 100, Pts: 1},
		},
	}
}
