import { driver } from "@rocket.chat/sdk";
import { IMessage } from "@rocket.chat/sdk/dist/config/messageInterfaces";
import { CommandList } from "./CommandList";

export const CommandHandler = async (
  err: unknown,
  message: IMessage
): Promise<void> => {
  if (err) {
    console.error(err);
    return;
  }

  // it's just IMessage not IMessage[]
  // const message = messages[0];
  if (!message.msg || !message.rid) {
    return;
  }

  // rid: room ID
  const roomName = await driver.getRoomName(message.rid);
  // check channel name
  if (roomName !== "rocky-chat") {
    return;
  }
  const [prefix, commandName] = message.msg.split(" ");

  if (prefix === "!Rocky") {
    for (const Command of CommandList) {
      if (commandName === Command.name) {
        await Command.command(message, roomName);
        return;
      }
    }
    await driver.sendToRoom(
      `I am sorry, but \`${commandName}\` is not a valid command.`,
      roomName
    );
  }
};
