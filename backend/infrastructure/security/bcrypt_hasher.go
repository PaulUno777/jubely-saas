package security

import (
	"golang.org/x/crypto/bcrypt"
)

type BcryptHasher struct {
	Cost int
}

func (b BcryptHasher) Hash(password string) (string, error) {
	cost := b.Cost
	if cost == 0 {
		cost = bcrypt.DefaultCost
	}
	out, err := bcrypt.GenerateFromPassword([]byte(password), cost)
	if err != nil {
		return "", err
	}
	return string(out), nil
}

func (BcryptHasher) Compare(hash, password string) error {
	return bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
}
