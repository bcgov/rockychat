/*
Main function of the chatbot:
- Connect and authenticate the chatbot account
- Join the channel and listen for calls
*/
import { driver } from '@rocket.chat/sdk';
import { CommandHandler } from './commands/CommandHandler';
import {
  ROCKETCHAT_URL,
  ROCKETCHAT_USER,
  ROCKETCHAT_PASSWORD,
  ROCKETCHAT_CHANNEL,
  ROCKETCHAT_USE_SSL,
} from './constants';

if (
  !ROCKETCHAT_URL ||
  !ROCKETCHAT_USER ||
  !ROCKETCHAT_PASSWORD ||
  !ROCKETCHAT_CHANNEL
) {
  console.error('Missing required environment variables.');
  process.exit(1);
}

(async () => {
  const ssl = !!ROCKETCHAT_USE_SSL;
  console.log(ROCKETCHAT_USER);
  await driver.connect({ host: ROCKETCHAT_URL, useSsl: ssl });

  await driver.login({
    username: ROCKETCHAT_USER,
    password: ROCKETCHAT_PASSWORD,
  });

  await driver.joinRooms([ROCKETCHAT_CHANNEL]);
  await driver.subscribeToMessages();
  driver.reactToMessages(CommandHandler);
  // await driver.sendToRoom("I am alive!", ROCKETCHAT_CHANNEL);
})();
