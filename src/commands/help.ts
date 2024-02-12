/*
Help command of the chatbot:
*/

import { driver } from "@rocket.chat/sdk";
import { CommandInt, ExtendedIMessage } from "../interfaces/CommandInt";

export const help: CommandInt = {
  name: "help",
  description: "Rocky user manual.",
  command: async (message) => {
    const response: ExtendedIMessage = {
      msg: "You gotta call my name to talk to me!",
      rid: message.rid,
      tmid: message.tmid,
    };
    await driver.sendMessage(response);
  },
};
