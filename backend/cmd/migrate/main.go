package main

import (
	"context"
	"log"
	"os"

	"github.com/PaulUno777/jubely-saas/backend/internal/migrate"
	"github.com/joho/godotenv"
)

func main() {
	_ = godotenv.Load()
	_ = godotenv.Load("backend/.env")
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		log.Fatal("DATABASE_URL is required")
	}
	ctx := context.Background()
	if len(os.Args) < 2 {
		log.Fatal("usage: migrate [up|down|status]")
	}
	var err error
	switch os.Args[1] {
	case "up":
		err = migrate.Up(ctx, dsn)
	case "down":
		err = migrate.Down(ctx, dsn)
	case "status":
		err = migrate.Status(ctx, dsn)
	default:
		log.Fatalf("unknown command %q", os.Args[1])
	}
	if err != nil {
		log.Fatal(err)
	}
	log.Println("ok")
}
