package i18n

import "strings"

// Locale is a supported API locale for backend-translated messages.
type Locale string

const (
	LocaleEN Locale = "en"
	LocaleFR Locale = "fr"
)

// ParseAcceptLanguage picks the first supported language from Accept-Language.
// Falls back to English when absent or unknown.
func ParseAcceptLanguage(header string) Locale {
	h := strings.TrimSpace(header)
	if h == "" {
		return LocaleEN
	}
	// Example: "fr-FR,fr;q=0.9,en;q=0.8"
	parts := strings.Split(h, ",")
	for _, p := range parts {
		tag := strings.TrimSpace(p)
		if tag == "" {
			continue
		}
		if semi := strings.Index(tag, ";"); semi >= 0 {
			tag = strings.TrimSpace(tag[:semi])
		}
		base := strings.ToLower(strings.TrimSpace(tag))
		if idx := strings.Index(base, "-"); idx > 0 {
			base = base[:idx]
		}
		switch base {
		case "fr":
			return LocaleFR
		case "en":
			return LocaleEN
		}
	}
	return LocaleEN
}
