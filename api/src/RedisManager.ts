import { createClient } from "redis";
import { RedisClientType } from "@redis/client";

/**
 * Singleton class for managing Redis operations, specifically for publishing messages to Redis channels.
 */
export class RedisManager {
  private static instance: RedisManager; // Singleton instance of RedisManager
  private publisher: RedisClientType; // Redis client instance used for publishing messages

  /**
   * Private constructor to prevent direct instantiation. Initializes Redis client and connects it.
   */
  private constructor() {
    this.publisher = createClient(); // Create a new Redis client instance
    this.publisher.connect(); // Connect to Redis server
  }

  /**
   * Provides access to the singleton instance of RedisManager.
   *
   * @returns {RedisManager} - The single instance of RedisManager.
   */
  public static getInstance(): RedisManager {
    // Check if instance already exists
    if (!this.instance) {
      // Create a new instance if it does not exist
      return (this.instance = new RedisManager());
    }

    // Return the existing instance
    return this.instance;
  }

  /**
   * Publishes a message to a specific Redis channel with a given priority.
   *
   * @param {string} message - The message to be published.
   * @param {string} to - The recipient of the message.
   * @param {string} channel - The base channel name (e.g., "email", "sms", "whatsapp").
   * @param {number} priority - The priority level of the message (e.g., 1, 2, 3).
   *
   * @returns {Promise<void>} - A promise that resolves when the message has been published.
   */
  public async publishToQueue(
    message: string,
    to: string,
    channel: string,
    priority: number
  ): Promise<void> {
    // Construct the full channel name using channel and priority
    const fullChannel = `${channel}${priority}`;

    // Publish the message to the constructed channel
    await this.publisher.publish(
      fullChannel,
      JSON.stringify({ to, message }) // Serialize the message with recipient
    );
  }
}
