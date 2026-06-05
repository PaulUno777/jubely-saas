package memory

import (
	"crypto/rand"
	"fmt"
	"sync"
	"time"
)

type PhoneOTPStore struct {
	mu      sync.Mutex
	entries map[string]otpEntry // phone_e164 -> pending code
}

type otpEntry struct {
	code    string
	expires time.Time
}

func NewPhoneOTPStore() *PhoneOTPStore {
	return &PhoneOTPStore{entries: make(map[string]otpEntry)}
}

func (s *PhoneOTPStore) SetCode(phone, code string, ttl time.Duration) {
	s.mu.Lock()
	defer s.mu.Unlock()
	if s.entries == nil {
		s.entries = make(map[string]otpEntry)
	}
	s.entries[phone] = otpEntry{code: code, expires: time.Now().Add(ttl)}
}

// TakeCode returns the code if it matches and removes the entry; otherwise returns false.
func (s *PhoneOTPStore) TakeCode(phone, code string) bool {
	s.mu.Lock()
	defer s.mu.Unlock()
	e, ok := s.entries[phone]
	if !ok || time.Now().After(e.expires) {
		delete(s.entries, phone)
		return false
	}
	if e.code != code {
		return false
	}
	delete(s.entries, phone)
	return true
}

// Random6Digit returns a decimal string of length 6.
func Random6Digit() (string, error) {
	var b [3]byte
	if _, err := rand.Read(b[:]); err != nil {
		return "", err
	}
	n := int(b[0])<<16 | int(b[1])<<8 | int(b[2])
	if n < 0 {
		n = -n
	}
	return fmt.Sprintf("%06d", n%1000000), nil
}
