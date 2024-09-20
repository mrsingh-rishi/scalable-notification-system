import { createClient } from "redis";

// Define types for the priority queues
type QueueNames = "email" | "sms" | "whatsapp";
type PriorityQueues = Record<QueueNames, string[]>;

const client = createClient();

// List of priority queues for each channel
const priorityQueues: PriorityQueues = {
  email: ["email1", "email2", "email3"],
  sms: ["sms1", "sms2", "sms3"],
  whatsapp: ["whatsapp1", "whatsapp2", "whatsapp3"],
};

const MAX_MESSAGES_PER_SECOND = 10; // Limit to 10 messages per second

/**
 * Main function that connects to Redis and processes messages.
 * It continually checks priority queues and pushes messages to the main queues.
 *
 * This function:
 * - Connects to the Redis client.
 * - Continuously loops through the priority queues for each base channel.
 * - Checks and processes messages based on priority.
 * - Enforces a rate limit on the number of messages pushed to the main queue per second.
 */
async function main() {
  await client.connect();

  let messageCount = 0; // Counter to track number of messages pushed in the current second
  let lastPushTime = Date.now(); // Timestamp of the last push

  while (true) {
    // Iterate over each base channel (email, sms, whatsapp) using for...in
    for (const baseChannel in priorityQueues) {
      // console.log("base channel: " + baseChannel);
      if (priorityQueues.hasOwnProperty(baseChannel)) {
        const queues = priorityQueues[baseChannel as QueueNames];
        const [priorityQueue, message] = await checkPriorityQueue(queues);
        if (priorityQueue) {
          console.log(
            "priorityQueue: " + priorityQueue + " and message is " + message
          );
          const currentTime = Date.now();
          const elapsedTime = (currentTime - lastPushTime) / 1000; // Convert to seconds
          console.log(
            "Received message from queue " +
              priorityQueue +
              " messages: " +
              message
          );
          // Reset message count if more than 1 second has passed
          if (elapsedTime >= 1) {
            messageCount = 0;
            lastPushTime = currentTime;
          }

          // Check if we can push more messages this second
          if (messageCount < MAX_MESSAGES_PER_SECOND) {
            console.log(
              `Pushing message from ${priorityQueue} to ${baseChannel} queue: ${message}`
            );
            await client.lPush(baseChannel, message); // Push to the left of the main queue
            console.log(
              "Pushed message from queue " +
                priorityQueue +
                " to " +
                baseChannel +
                " and the message is " +
                message
            );
            messageCount++; // Increment message count for this second
          } else {
            console.log(
              "Rate limit exceeded so blocking is the requested channel"
            );
            // If limit is reached, wait for the next second
            await new Promise((resolve) =>
              setTimeout(resolve, 5000 + (1000 - elapsedTime * 1000))
            );
          }
        }
      }
    }
  }
}

/**
 * Checks the priority queues and retrieves a message from the highest-priority queue.
 *
 * This function:
 * - Iterates through the provided queues, starting with the highest priority.
 * - Pops a message from the first queue that contains a message.
 * - Returns the queue name and message or null values if no message is found.
 *
 * @param {string[]} queues - Array of queue names ordered by priority (highest first).
 *
 * @returns {[string | null, string | null]} - A tuple where:
 *   - The first element is the name of the queue from which the message was retrieved, or null if no message was found.
 *   - The second element is the message retrieved from the queue, or null if no message was found.
 */
async function checkPriorityQueue(
  queues: string[]
): Promise<[string | null, string | null]> {
  for (const queue of queues) {
    // Try to pop a message from the highest-priority queue (right side)
    const message = await client.rPop(queue);
    if (message) {
      console.log(
        "Poped message from queue: " + message + " from queue: " + queue
      );
      return [queue, message]; // Return the queue and the message
    }
  }
  return [null, null]; // No messages in any priority queue
}

main().catch(console.error);
