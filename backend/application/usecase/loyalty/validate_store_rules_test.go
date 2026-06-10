package loyalty

import (
	"context"
	"testing"

	"github.com/PaulUno777/jubely-saas/backend/application/rules"
	"github.com/google/uuid"
)

func TestValidateStoreRules_draftMissingName(t *testing.T) {
	uc := &ValidateStoreRules{}
	out, err := uc.Execute(context.Background(), ValidateStoreRulesInput{
		TenantID: uuid.New(),
		DraftRules: []rules.Rule{{
			ID: "r1", Name: "", On: true, Trigger: "transaction",
			SchemaVersion: 2, EditorTier: "advanced",
			Actions:       []rules.AstAction{{Type: "mult", Factor: 2}},
		}},
	})
	if err != nil {
		t.Fatal(err)
	}
	if out.Valid {
		t.Fatal("expected invalid draft")
	}
	if len(out.Conflicts) == 0 {
		t.Fatal("expected constraint reports")
	}
}
