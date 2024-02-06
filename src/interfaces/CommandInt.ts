import { IMessage } from "@rocket.chat/sdk/dist/config/messageInterfaces";

// extend the IMessage interface with more fields supported by API endpoint:
export interface ExtendedIMessage extends IMessage {
    tmid?: string;
    replies?: string[];
  }

export interface CommandInt {
    name: string;
    description: string;
    command: (message: ExtendedIMessage) => Promise<void>
}
