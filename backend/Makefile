.PHONY: migrate-up migrate-down migrate-status migrate-create

migrate-up:
	go run ./cmd/migrate up

migrate-down:
	go run ./cmd/migrate down

migrate-status:
	go run ./cmd/migrate status

# Create a new goose migration (requires goose CLI installed).
migrate-create:
	@test -n "$(NAME)" || (echo "usage: make migrate-create NAME=005_foo"; exit 1)
	goose -dir internal/migrate/migrations create $(NAME) sql
