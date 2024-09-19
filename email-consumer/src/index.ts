import { createClient } from "redis";
import EmailEngine from "./email-engine";

const client = createClient();
const queue = "email";
async function main() {
  await client.connect();

  while (true) {
    const message = await client.rPop(queue);
    if (message) {
      console.log(`Processing message: ${message}`);
      const parsedMessage = JSON.parse(message);

      // process the message send notification

      const { to, message: msg } = parsedMessage;
      const emailObject = {
        subject: "Test Subject",
        htmlContent: msg,
        recipientName: "Rishi",
        recipientEmail: to,
      };
      try {
        EmailEngine.getInstance()
          .sendEmail(emailObject)
          .then(() => console.log("Email sent successfully"))
          .catch(() => {
            console.log("Failed to send email");
          });
      } catch (error) {
        console.log(error);
      }
    }
  }
}

main().catch((err) => console.log(err));
