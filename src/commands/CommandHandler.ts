/*
Respond function of the chatbot:
- identify predefined commands
- connect to GenAI endpoint for response
- reply in a thread in the channel
*/

import { driver } from '@rocket.chat/sdk';
import { CommandList } from './CommandList';
import { ExtendedIMessage } from '../interfaces/CommandInt';
import { ROCKETCHAT_USER, ROCKETCHAT_CHANNEL, AGENT_ID, LOCATION,PROJECT_ID } from '../constants';
import {SessionsClient} from '@google-cloud/dialogflow-cx';
import redisClient from '../services/redis';
import _ from 'lodash';
// import redisClient from '../services/redis';


async function getOrSetSessionId(threadId: string): Promise<string> {
  // Attempt to retrieve the existing session ID from Redis
  let sessionId = await redisClient.hget(threadId, 'sessionId');
  if (!sessionId) {
    // No session ID exists, create a new one and store it
    sessionId = threadId; // Using threadId as the session ID for simplicity
    await redisClient.hset(threadId, 'sessionId', sessionId);
    await redisClient.hset(threadId, 'platform', 'GCP'); // Assuming GCP as default platform
  }
  return sessionId;
}

export const CommandHandler = async (
  err: unknown,
  message: ExtendedIMessage,
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
  if (
    message.rid !== ROCKETCHAT_CHANNEL ||
    message.u.username === ROCKETCHAT_USER ||
    message.replies
  ) {
    return;
  }
  // const [prefix, commandName] = message.msg.split(' ');
  const splitPoint = message.msg.indexOf(' ') + 1;
  const prefix = message.msg.substring(0, splitPoint).trim();
  const commandName = message.msg.substring(splitPoint).trim();
  const client = new SessionsClient({apiEndpoint: `${LOCATION}-dialogflow.googleapis.com`})
  const query = commandName;
  const languageCode = 'en'

  // when calling rocky:
  if (prefix === '!Rocky') {
    // set thread for IMessage: threadID is tmid or _id if thread doesn't exist:
     if (!message.tmid) message.tmid = message._id;
    const threadId = message.tmid || '';
    const GCPsessionId = await getOrSetSessionId(threadId);
    // debug
    console.log(`Using session ID: ${GCPsessionId} for thread ID: ${threadId}`);
    // check for predefined commands:
    for (const Command of CommandList) {
      if (commandName === Command.name) {
        
        await Command.command(message);
        return;
      }
    }





    async function detectIntentText() {
      let responseMsg = []
      //  A session remains active and its data is stored for 30 minutes after the last request is sent for the session.
      // https://cloud.google.com/dialogflow/cx/docs/concept/session
      // https://googleapis.dev/nodejs/dialogflow-cx/latest/v3.SessionsClient.html
      // const sessionId = message.tmid || Math.random().toString(36).substring(7); //use tmid for sessionId so every thread use same session
      const sessionPath = client.projectLocationAgentSessionPath(
        PROJECT_ID || '',
        LOCATION || '',
        AGENT_ID || '',
        GCPsessionId 
      );
      const request = {
        session: sessionPath,
        queryInput: {
          text: {
            text: query,
          },
          languageCode,
        },
      };
      const [response] = await client.detectIntent(request)
      for (const message of response?.queryResult?.responseMessages || []) {
        if (message.text) {
          responseMsg.push (`${message.text.text}`|| 'Default Message')
        }
        // Assuming message.payload.fields is of type { [k: string]: IValue; } and IValue can be any type
        // EXAMPLE payload:
        // {
        //   "richContent": 
        //    [
        //     [
        //       {
        //         "actionLink": "",
        //         "type": "info",
        //         "subtitle": "",
        //         "title": ""
        //       }
        //     ]
        //   ]
        // }
        if(message.payload?.fields?.richContent) {
          const richContents = _.get(message, 'payload.fields.richContent');
          const actionLink = _.get(richContents, 'listValue.values[0].listValue.values[0].structValue.fields.actionLink.stringValue');
          responseMsg.push(actionLink);
        }
      }

    for ( const responseMessage of responseMsg ){
      const RCresponse: ExtendedIMessage = {
        msg: Array.isArray(responseMessage) ? responseMessage.join(' ') : (responseMessage || 'default msg'),
        rid: message.rid,
        tmid: threadId
      };
      await driver.sendMessage(RCresponse);
    }
    }

    detectIntentText();
  }
};
