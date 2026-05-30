-- +goose Up
ALTER TABLE points_rules ADD COLUMN IF NOT EXISTS priority INT NOT NULL DEFAULT 0;

-- +goose Down
ALTER TABLE points_rules DROP COLUMN IF EXISTS priority;
