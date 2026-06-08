package memory

import (
	"crypto/rand"
	"fmt"
	"sync"
	"time"

	"github.com/google/uuid"
)

type PhoneOTPStore struct {
	mu      sync.Mutex
	entries map[string]otpEntry // phone_e164 -> pending code (legacy lookup)
	byID    map[string]otpEntry // verification_id -> pending code
}

type otpEntry struct {
	phone   string
	code    string
	expires time.Time
}

func NewPhoneOTPStore() *PhoneOTPStore {
	return &PhoneOTPStore{
		entries: make(map[string]otpEntry),
		byID:    make(map[string]otpEntry),
	}
}

func (s *PhoneOTPStore) SetCode(phone, code string, ttl time.Duration) string {
	s.mu.Lock()
	defer s.mu.Unlock()
	if s.entries == nil {
		s.entries = make(map[string]otpEntry)
	}
	if s.byID == nil {
		s.byID = make(map[string]otpEntry)
	}
	expires := time.Now().Add(ttl)
	s.entries[phone] = otpEntry{phone: phone, code: code, expires: expires}
	id := uuid.NewString()
	s.byID[id] = otpEntry{phone: phone, code: code, expires: expires}
	return id
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
	for id, row := range s.byID {
		if row.phone == phone {
			delete(s.byID, id)
		}
	}
	return true
}

// TakeCodeByID verifies a code for a phone-verification resource id.
func (s *PhoneOTPStore) TakeCodeByID(id, code string) (phone string, ok bool) {
	s.mu.Lock()
	defer s.mu.Unlock()
	e, found := s.byID[id]
	if !found || time.Now().After(e.expires) {
		delete(s.byID, id)
		return "", false
	}
	if e.code != code {
		return "", false
	}
	delete(s.byID, id)
	delete(s.entries, e.phone)
	return e.phone, true
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
