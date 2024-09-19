import { createClient } from "redis";
import SMSEngine from "./sms-engine";

const client = createClient();
const queue = "sms";
async function main() {
  await client.connect();

  while (true) {
    const message = await client.rPop(queue);
    if (message) {
      console.log(`Processing message: ${message}`);
      const parsedMessage = JSON.parse(message);
      const { to, message: body } = parsedMessage;

      // process the message send notification
      try {
        await SMSEngine.getInstance().sendSMS({ body, to });
        console.log("SMS Message Sent Successfully");
      } catch (error) {
        console.log(error);
      }
    }
  }
}

main().catch((err) => console.log(err));
