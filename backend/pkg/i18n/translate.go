package i18n

// Translate returns a backend-localized string for a stable API code.
func Translate(locale Locale, code string) string {
	if m, ok := backendMessages[locale]; ok {
		if s, ok2 := m[code]; ok2 {
			return s
		}
	}
	if m, ok := backendMessages[LocaleEN]; ok {
		if s, ok2 := m[code]; ok2 {
			return s
		}
	}
	return code
}
