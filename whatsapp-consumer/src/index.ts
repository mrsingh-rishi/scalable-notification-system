import { createClient } from "redis";
import WhatsAppEngine from "./whatsapp-engine";

const client = createClient();
const queue = "whatsapp";
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
        await WhatsAppEngine.getInstance().sendWhatsAppMessage({ body, to });
      } catch (error) {
        console.log(error);
      }
    }
  }
}

main().catch((err) => console.log(err));
