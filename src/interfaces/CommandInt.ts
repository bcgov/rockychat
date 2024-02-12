/*
Extended IMessage interface:
*/

import { IMessage } from "@rocket.chat/sdk/dist/config/messageInterfaces";

// extend the IMessage interface with more fields supported by API endpoint:
// https://developer.rocket.chat/reference/api/rest-api/endpoints/messaging/chat-endpoints/send-message#message-object
export interface ExtendedIMessage extends IMessage {
    tmid?: string;
    replies?: string[];
  }

export interface CommandInt {
    name: string;
    description: string;
    command: (message: ExtendedIMessage) => Promise<void>
}
