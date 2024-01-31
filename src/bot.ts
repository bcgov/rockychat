/*
Main function of the chatbot
*/
import { api, driver } from "@rocket.chat/sdk";
import dotenv from "dotenv";
import { CommandHandler } from "./commands/CommandHandler";
dotenv.config();

const {
  ROCKETCHAT_URL,
  ROCKETCHAT_USER,
  ROCKETCHAT_PASSWORD,
  ROCKETCHAT_USE_SSL,
  ROCKETCHAT_CHANNEL,
} = process.env;

if (!ROCKETCHAT_URL || !ROCKETCHAT_USER || !ROCKETCHAT_PASSWORD || !ROCKETCHAT_CHANNEL) {
  console.error("Missing required environment variables.");
  process.exit(1);
}

(async () => {
  const ssl = !!ROCKETCHAT_USE_SSL;
  console.log(ROCKETCHAT_USER);
  await driver.connect({ host: ROCKETCHAT_URL, useSsl: ssl });
  
  //driver.login connects your code to the bot account
  //api.login generates an API authorization token
  //   The SDK driver does not have full functionality, so some features may require an API call. The api method serves as a wrapper for that call.
  
  await driver.login({
      username: ROCKETCHAT_USER,
      password: ROCKETCHAT_PASSWORD,
    });

  // await api.login({
  //   username: ROCKETCHAT_USER,
  //   password: ROCKETCHAT_PASSWORD,
  // });

  await driver.joinRooms([ROCKETCHAT_CHANNEL]);
  await driver.subscribeToMessages();
  driver.reactToMessages(CommandHandler);
  // await driver.sendToRoom("I am alive!", ROCKETCHAT_CHANNEL);
})();