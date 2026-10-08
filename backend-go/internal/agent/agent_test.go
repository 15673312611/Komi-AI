package agent

import "testing"

func TestDatabaseEnumUsesSQLAlchemyEnumNames(t *testing.T) {
	for input, want := range map[string]string{
		"customer_support": "CUSTOMER_SUPPORT",
		"sales":            "SALES",
		"tech_support":     "TECH_SUPPORT",
		"general":          "GENERAL",
		"custom":           "CUSTOM",
	} {
		got, err := databaseEnum(input)
		if err != nil || got != want {
			t.Errorf("databaseEnum(%q) = %q, err=%v; want %q", input, got, err, want)
		}
	}
	if _, err := databaseEnum("unknown"); err == nil {
		t.Fatal("databaseEnum(unknown) should fail")
	}
}

func TestStringListPreservesLegacyPlainTextInstructions(t *testing.T) {
	got := stringList("single legacy instruction")
	if len(got) != 1 || got[0] != "single legacy instruction" {
		t.Fatalf("stringList() = %#v", got)
	}
	got = stringList(`["one", "two"]`)
	if len(got) != 2 || got[1] != "two" {
		t.Fatalf("stringList(JSON) = %#v", got)
	}
}
