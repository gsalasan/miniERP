/**
 * Shared Event Bus for miniERP
 * 
 * Provides hybrid event bus (in-process + distributed via Redis)
 * for loosely coupled communication between microservices
 */

export { EventBus } from './EventBus';
export * from './events';

// Factory function to create event bus instance
import { EventBus } from './EventBus';
import dotenv from 'dotenv';

dotenv.config();

export function createEventBus(serviceName: string): EventBus {
  const redisUrl = process.env.REDIS_URL || process.env.REDISCLOUD_URL;
  const eventBus = new EventBus(serviceName, redisUrl);

  // Add default logging middleware
  eventBus.use((eventName, payload) => {
    console.log(`[EventBus:${serviceName}] Event: ${eventName}`, {
      eventId: payload.eventId,
      timestamp: payload.timestamp,
      source: payload.source,
    });
    return payload;
  });

  return eventBus;
}

