import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import prisma from "./db";
import { RedisManager } from "./RedisManager";

// Load environment variables from .env file
dotenv.config();

const app = express();
const port = process.env.PORT || 3000; // Set port from environment variable or default to 3000

app.use(cors()); // Enable CORS to allow requests from other origins
app.use(express.json()); // Middleware to parse JSON request bodies

// Singleton instance of RedisManager
let publisher: RedisManager;

/**
 * API endpoint to handle notification requests.
 *
 * @route POST /api/notifications
 * @param {Request} req - Express request object containing notification details.
 * @param {Response} res - Express response object to send the response.
 *
 * @returns {Response} - JSON response indicating the status of the notification request.
 */
app.post("/api/notifications", async (req: Request, res: Response) => {
  try {
    const { userId, message, type } = req.body; // Destructure request body to get user ID, message, and type

    // Fetch user from the database by user ID
    const user = await prisma.user.findFirst({
      where: {
        id: Number(userId), // Ensure user ID is treated as a number
      },
    });

    // Fetch notification preferences for the user
    const notificationPreference =
      await prisma.notificationPreferences.findFirst({
        where: {
          userId: Number(userId), // Ensure user ID is treated as a number
        },
      });

    // Check if user and notification preferences exist
    if (!user || !notificationPreference) {
      res
        .status(404)
        .json({ message: "User or notification preference not found" });
      return;
    }

    // Initialize RedisManager singleton if not already initialized
    if (!publisher) {
      publisher = RedisManager.getInstance();
    }

    // Publish message to the appropriate queue based on user preferences
    if (notificationPreference.email) {
      await publisher.publishToQueue(message, user.email, "email", type);
      console.log("Pushed to email notification queue");
    }
    if (notificationPreference.sms) {
      await publisher.publishToQueue(message, user.mobileNumber, "sms", type);
      console.log("Pushed to sms notification queue");
    }
    if (notificationPreference.whatsapp) {
      await publisher.publishToQueue(
        message,
        user.mobileNumber,
        "whatsapp",
        type
      );
      console.log("Pushed to whatsapp notification queue");
    }

    // Send success response
    res.status(200).json({ message: "Notification sent successfully" });
  } catch (error) {
    console.log(error); // Log any errors that occur
    // Send error response
    return res
      .status(500)
      .json({ message: "Error while sending notification" });
  }
});

// Start the Express server
app.listen(port, () => console.log("Service listening on port: " + port));
