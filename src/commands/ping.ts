/*
Ping command of the chatbot:
*/

import { driver } from "@rocket.chat/sdk";
import { CommandInt, ExtendedIMessage } from "../interfaces/CommandInt";

export const ping: CommandInt = {
  name: "ping",
  description: "Pings the bot.",
  command: async (message) => {
    const response: ExtendedIMessage = {
      msg: "Pong",
      rid: message.rid,
      tmid: message.tmid,
    };
    await driver.sendMessage(response);
  },
};
