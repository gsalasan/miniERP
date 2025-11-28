import { EventEmitter } from 'events';
import { createClient, RedisClientType } from 'redis';
import {
  EventPayload,
  EventName,
  CustomerCreatedPayload,
  CustomerUpdatedPayload,
  ProjectStatusChangedPayload,
  EstimationApprovedPayload,
  InvoiceCreatedPayload,
} from './events';

type EventCallback<T extends EventPayload = EventPayload> = (payload: T) => void | Promise<void>;
type Middleware = (eventName: string, payload: EventPayload) => EventPayload | Promise<EventPayload>;

export class EventBus extends EventEmitter {
  private redisClient: RedisClientType | null = null;
  private redisSubscriber: RedisClientType | null = null;
  private subscribers: Map<string, Set<EventCallback>> = new Map();
  private middlewares: Middleware[] = [];
  private serviceName: string;
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 10;

  constructor(serviceName: string, redisUrl?: string) {
    super();
    this.serviceName = serviceName;

    if (redisUrl) {
      this.initializeRedis(redisUrl);
    }
  }

  /**
   * Initialize Redis connection for distributed events
   */
  private async initializeRedis(redisUrl: string): Promise<void> {
    try {
      // Create publisher client
      this.redisClient = createClient({
        url: redisUrl,
      });

      // Create subscriber client (separate connection required for pub/sub)
      this.redisSubscriber = createClient({
        url: redisUrl,
      });

      // Setup error handlers
      this.redisClient.on('error', (err) => {
        console.error(`[EventBus] Redis client error:`, err);
      });

      this.redisSubscriber.on('error', (err) => {
        console.error(`[EventBus] Redis subscriber error:`, err);
      });

      // Setup reconnection handlers
      this.redisClient.on('connect', () => {
        console.log(`[EventBus] Redis client connected`);
        this.isConnected = true;
        this.reconnectAttempts = 0;
      });

      this.redisSubscriber.on('connect', () => {
        console.log(`[EventBus] Redis subscriber connected`);
      });

      this.redisClient.on('reconnecting', () => {
        this.reconnectAttempts++;
        if (this.reconnectAttempts <= this.maxReconnectAttempts) {
          console.log(`[EventBus] Redis reconnecting... (attempt ${this.reconnectAttempts})`);
        } else {
          console.error(`[EventBus] Max reconnection attempts reached`);
        }
      });

      // Connect clients
      await this.redisClient.connect();
      await this.redisSubscriber.connect();

      // Setup message handler for Redis Pub/Sub (Redis v4+)
      // We'll set up handlers when subscribing to specific channels

      console.log(`[EventBus] Redis initialized for service: ${this.serviceName}`);
    } catch (error) {
      console.error(`[EventBus] Failed to initialize Redis:`, error);
      // Continue without Redis - will only use in-process events
    }
  }

  /**
   * Add middleware for event transformation
   */
  use(middleware: Middleware): void {
    this.middlewares.push(middleware);
  }

  /**
   * Apply all middlewares to event payload
   */
  private async applyMiddlewares(eventName: string, payload: EventPayload): Promise<EventPayload> {
    let result = payload;
    for (const middleware of this.middlewares) {
      result = await middleware(eventName, result);
    }
    return result;
  }

  /**
   * Subscribe to an event (in-process)
   */
  subscribe<T extends EventPayload = EventPayload>(
    eventName: EventName,
    callback: EventCallback<T>
  ): () => void {
    if (!this.subscribers.has(eventName)) {
      this.subscribers.set(eventName, new Set());
    }

    this.subscribers.get(eventName)!.add(callback as EventCallback);
    console.log(`[EventBus] Subscribed to event: ${eventName} (in-process)`);

    // Also subscribe to distributed events if Redis is available
    if (this.redisSubscriber && this.isConnected) {
      this.subscribeDistributed(eventName).catch((err) => {
        console.error(`[EventBus] Error subscribing to distributed event ${eventName}:`, err);
      });
    }

    // Return unsubscribe function
    return () => {
      this.unsubscribe(eventName, callback);
    };
  }

  /**
   * Unsubscribe from an event
   */
  unsubscribe<T extends EventPayload = EventPayload>(
    eventName: EventName,
    callback: EventCallback<T>
  ): void {
    const callbacks = this.subscribers.get(eventName);
    if (callbacks) {
      callbacks.delete(callback as EventCallback);
      console.log(`[EventBus] Unsubscribed from event: ${eventName}`);
    }
  }

  /**
   * Publish event (in-process and distributed)
   */
  async publish<T extends EventPayload>(eventName: EventName, data: T['data']): Promise<void> {
    const payload: T = {
      eventId: `${this.serviceName}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      source: this.serviceName,
      data,
    } as T;

    // Apply middlewares
    const processedPayload = await this.applyMiddlewares(eventName, payload);

    console.log(`[EventBus] Publishing event: ${eventName}`, {
      eventId: processedPayload.eventId,
      source: processedPayload.source,
    });

    // Publish in-process (EventEmitter)
    this.emit(eventName, processedPayload);

    // Publish to in-process subscribers
    const callbacks = this.subscribers.get(eventName);
    if (callbacks) {
      for (const callback of callbacks) {
        try {
          await callback(processedPayload);
        } catch (error) {
          console.error(`[EventBus] Error in callback for ${eventName}:`, error);
        }
      }
    }

    // Publish to Redis (distributed)
    if (this.redisClient && this.isConnected) {
      try {
        const channel = `minierp:events:${eventName}`;
        await this.redisClient.publish(channel, JSON.stringify(processedPayload));
      } catch (error) {
        console.error(`[EventBus] Error publishing to Redis:`, error);
      }
    }
  }

  /**
   * Handle distributed event from Redis
   */
  private async handleDistributedEvent(channel: string, payload: EventPayload): Promise<void> {
    // Extract event name from channel
    const eventName = channel.replace('minierp:events:', '') as EventName;

    console.log(`[EventBus] Received distributed event: ${eventName} from ${payload.source}`);

    // Emit in-process
    this.emit(eventName, payload);

    // Call subscribers
    const callbacks = this.subscribers.get(eventName);
    if (callbacks) {
      for (const callback of callbacks) {
        try {
          await callback(payload);
        } catch (error) {
          console.error(`[EventBus] Error in callback for ${eventName}:`, error);
        }
      }
    }
  }

  /**
   * Subscribe to distributed events via Redis
   */
  async subscribeDistributed(eventName: EventName): Promise<void> {
    if (!this.redisSubscriber || !this.isConnected) {
      console.warn(`[EventBus] Redis not available, cannot subscribe to distributed event: ${eventName}`);
      return;
    }

    const channel = `minierp:events:${eventName}`;
    try {
      // Subscribe to channel (Redis v4+ subscribe method with callback)
      await this.redisSubscriber.subscribe(channel, (message) => {
        try {
          const payload = JSON.parse(message) as EventPayload;
          // Only process if not from this service (avoid echo)
          if (payload.source !== this.serviceName) {
            this.handleDistributedEvent(channel, payload);
          }
        } catch (error) {
          console.error(`[EventBus] Error parsing Redis message:`, error);
        }
      });
      
      console.log(`[EventBus] Subscribed to distributed event: ${eventName}`);
    } catch (error) {
      console.error(`[EventBus] Error subscribing to distributed event ${eventName}:`, error);
    }
  }

  /**
   * Get subscriber count for an event
   */
  getSubscriberCount(eventName?: EventName): number {
    if (eventName) {
      return this.subscribers.get(eventName)?.size || 0;
    }
    return this.subscribers.size;
  }

  /**
   * Clear all subscribers
   */
  clear(): void {
    this.subscribers.clear();
    console.log(`[EventBus] All subscribers cleared`);
  }

  /**
   * Gracefully shutdown
   */
  async shutdown(): Promise<void> {
    if (this.redisClient) {
      await this.redisClient.quit();
    }
    if (this.redisSubscriber) {
      await this.redisSubscriber.quit();
    }
    this.clear();
    console.log(`[EventBus] Shutdown complete`);
  }
}

