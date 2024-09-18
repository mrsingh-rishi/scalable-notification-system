import { createClient } from "redis";
import { RedisClientType } from "@redis/client";

export class RedisManager {
  private static instance: RedisManager;
  private publisher: RedisClientType;

  private constructor() {
    this.publisher = createClient();
    this.publisher.connect();
  }

  public static getInstance(): RedisManager {
    if (!this.instance) {
      return (this.instance = new RedisManager());
    }

    return this.instance;
  }

  public async publishToQueue(
    message: string,
    to: string,
    channel: string,
    priority: number
  ): Promise<void> {
    await this.publisher.publish(
      `${channel}${priority}`,
      JSON.stringify({ to, message })
    );
  }
}
