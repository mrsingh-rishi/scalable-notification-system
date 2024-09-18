import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import prisma from "./db";
import { RedisManager } from "./RedisManager";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
app.use(cors());
app.use(express.json());
let publisher: RedisManager;

app.post("/api/notifications", async (req: Request, res: Response) => {
  try {
    const { userId, message, type } = req.body;
    const user = await prisma.user.findFirst({
      where: {
        id: Number(userId),
      },
    });

    const notificationPreference =
      await prisma.notificationPreferences.findFirst({
        where: {
          userId: Number(userId),
        },
      });
    if (!user || !notificationPreference) {
      res
        .status(404)
        .json({ message: "User or notification preference not found" });
      return;
    }

    if (!publisher) {
      publisher = RedisManager.getInstance();
    }

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

    res.status(200).json({ message: "Notification sent successfully" });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ message: "Error while sending notification" });
  }
});

app.listen(port, () => console.log("Service listening on port: " + port));
