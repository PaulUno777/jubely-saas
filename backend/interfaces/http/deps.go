package http

import "github.com/PaulUno777/jubely-saas/backend/interfaces/httpserver"

// HandlerBundle is the HTTP adapter composition root.
// Server holds all handler dependencies; HandlerBundle is the public transport type.
type HandlerBundle = httpserver.Server
