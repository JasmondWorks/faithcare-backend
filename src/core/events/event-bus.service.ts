import { Injectable } from '@nestjs/common';
import { DomainEvent } from './domain-event.interface';

type EventHandler = (payload: unknown) => void;

@Injectable()
export class EventBus {
  private handlers = new Map<string, EventHandler[]>();

  emit(event: DomainEvent) {
    const handlers = this.handlers.get(event.name) ?? [];
    handlers.forEach((handler) => handler(event.payload as unknown));
  }

  subscribe(eventName: string, handler: EventHandler) {
    const handlers = this.handlers.get(eventName) ?? [];
    handlers.push(handler);
    this.handlers.set(eventName, handlers);
  }
}
