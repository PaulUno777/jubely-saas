package ports

import "context"

type DomainEvent interface {
	EventName() string
}

type EventHandler func(ctx context.Context, event DomainEvent) error

type EventBus interface {
	Publish(ctx context.Context, events ...DomainEvent) error
	Subscribe(eventName string, handler EventHandler)
}
