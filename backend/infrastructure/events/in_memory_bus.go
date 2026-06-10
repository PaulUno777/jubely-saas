package events

import (
	"context"
	"sync"

	"github.com/PaulUno777/jubely-saas/backend/application/ports"
)

type InMemoryBus struct {
	mu       sync.RWMutex
	handlers map[string][]ports.EventHandler
}

func NewInMemoryBus() *InMemoryBus {
	return &InMemoryBus{handlers: make(map[string][]ports.EventHandler)}
}

func (b *InMemoryBus) Subscribe(eventName string, handler ports.EventHandler) {
	b.mu.Lock()
	defer b.mu.Unlock()
	b.handlers[eventName] = append(b.handlers[eventName], handler)
}

func (b *InMemoryBus) Publish(ctx context.Context, events ...ports.DomainEvent) error {
	b.mu.RLock()
	defer b.mu.RUnlock()
	for _, ev := range events {
		for _, h := range b.handlers[ev.EventName()] {
			if err := h(ctx, ev); err != nil {
				return err
			}
		}
	}
	return nil
}
