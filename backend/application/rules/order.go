package rules

import "sort"

// PriorityBand groups rules for canonical evaluation order.
const (
	PriorityBandRate = 100
	PriorityBandFlat = 200
	PriorityBandMult = 300
)

type ruleWithMeta struct {
	rule     Rule
	priority int
	id       string
	created  int64 // tie-break from index
}

// PriorityForRule returns the band base for a rule's action type.
func PriorityForRule(r Rule) int {
	if r.SchemaVersion >= 2 || r.EditorTier == "advanced" {
		// Advanced rules: use dominant action type in definition.
		for _, a := range r.Actions {
			switch a.Type {
			case "mult":
				return PriorityBandMult
			case "flat":
				return PriorityBandFlat
			}
		}
		if r.Trigger == "transaction" {
			return PriorityBandRate
		}
		return PriorityBandFlat
	}
	switch r.Action.Type {
	case "rate":
		return PriorityBandRate
	case "flat":
		return PriorityBandFlat
	case "mult":
		return PriorityBandMult
	default:
		return PriorityBandRate
	}
}

// RecomputeRulePriorities assigns stable priority values: rate → flat → mult.
func RecomputeRulePriorities(rules []Rule) map[string]int {
	type item struct {
		id       string
		band     int
		seq      int
		priority int
	}
	items := make([]item, 0, len(rules))
	for i, r := range rules {
		items = append(items, item{id: r.ID, band: PriorityForRule(r), seq: i})
	}
	sort.SliceStable(items, func(i, j int) bool {
		if items[i].band != items[j].band {
			return items[i].band < items[j].band
		}
		return items[i].seq < items[j].seq
	})
	out := make(map[string]int, len(items))
	for i, it := range items {
		out[it.id] = it.band + i
	}
	return out
}
