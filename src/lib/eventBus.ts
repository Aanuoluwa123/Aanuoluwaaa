type EventCallback = (...args: any[]) => void;

interface EventMap {
    [eventName: string]: EventCallback[];
}

/**
 * Simple event bus for cross-component communication
 * Particularly useful for development mode when we don't have Supabase realtime
 */
class EventBus {
    private events: EventMap = {};

    /**
     * Subscribe to an event
     * @param event Event name
     * @param callback Callback function to execute when event is emitted
     * @returns Unsubscribe function
     */
    on(event: string, callback: EventCallback): () => void {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(callback);

        // Return unsubscribe function
        return () => {
            this.events[event] = this.events[event].filter(cb => cb !== callback);
        };
    }

    /**
     * Emit an event with optional arguments
     * @param event Event name
     * @param args Arguments to pass to the callback
     */
    emit(event: string, ...args: any[]): void {
        if (this.events[event]) {
            this.events[event].forEach(callback => {
                callback(...args);
            });
        }
    }

    /**
     * Remove all event listeners for a specific event
     * @param event Event name
     */
    off(event: string): void {
        delete this.events[event];
    }

    /**
     * Clear all event listeners
     */
    clear(): void {
        this.events = {};
    }
}

// Create and export a singleton instance
export const eventBus = new EventBus();

// Event name constants for better type safety
export const EVENTS = {
    CATEGORY_UPDATED: 'category:updated',
    CATEGORY_CREATED: 'category:created',
    CATEGORY_DELETED: 'category:deleted',
    TRANSACTION_CREATED: 'transaction:created',
    TRANSACTION_DELETED: 'transaction:deleted',
    DATA_REFRESH_NEEDED: 'data:refresh',
}; 