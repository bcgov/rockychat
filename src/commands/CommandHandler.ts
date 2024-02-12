/*
Respond function of the chatbot:
- identify predefined commands
- connect to GenAI endpoint for response
- reply in a thread in the channel
*/

import { driver } from "@rocket.chat/sdk";
import { CommandList } from "./CommandList";
import { ExtendedIMessage } from "../interfaces/CommandInt";
import { ROCKETCHAT_USER, ROCKETCHAT_CHANNEL } from '../constants';


export const CommandHandler = async (
  err: unknown,
  message: ExtendedIMessage
): Promise<void> => {
  if (err) {
    console.error(err);
    return;
  }

  // it's just IMessage not IMessage[]
  // const message = messages[0];
  if (!message.msg || !message.rid || !message.u) {
    return;
  }

  /* ignore messages in the following situation:
  - not in rocky-chat channel
  - the posting user is Rocky itself
  - the message is the original post with a reply in the thread
  */
  if (message.rid !== ROCKETCHAT_CHANNEL || message.u.username === ROCKETCHAT_USER || message.replies) {
    return;
  }
  const [prefix, commandName] = message.msg.split(" ");
  // when calling rocky:
  if (prefix === "!Rocky") {
    // set thread for IMessage: threadID is tmid or _id if thread doesn't exist:
    if(!message.tmid) message.tmid = message._id;

    // check for predefined commands:
    for (const Command of CommandList) {
      if (commandName === Command.name) {
        await Command.command(message);
        return;
      }
    }

    // if not, intake question (Gen AI integration here):
    const response: ExtendedIMessage = {
      msg: "pretend to be some smart feedback from AI",
      rid: message.rid,
      tmid: message.tmid,
    };
    await driver.sendMessage(response);

  }
};
