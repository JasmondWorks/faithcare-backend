import { Injectable } from '@nestjs/common';
import { DomainEvent } from './domain-event.interface';

@Injectable()
export class EventBus {
  private handlers = new Map();

  emit(event: DomainEvent) {
    const handlers = this.handlers.get(event.name) || [];

    handlers.forEach((handler) => handler(event.payload));
  }

  subscribe(eventName: string, handler: Function) {
    const handlers = this.handlers.get(eventName) || [];
    handlers.push(handler);

    this.handlers.set(eventName, handlers);
  }
}
