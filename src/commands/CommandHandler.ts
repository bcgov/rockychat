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
// import redisClient from '../services/redis';

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
  // when calling rocky:
  if (prefix === '!Rocky') {
    // set thread for IMessage: threadID is tmid or _id if thread doesn't exist:
    if (!message.tmid) message.tmid = message._id;
    // check for predefined commands:
    for (const Command of CommandList) {
      if (commandName === Command.name) {
        
        await Command.command(message);
        return;
      }
    }

    const query = commandName;
    const languageCode = 'en'

    const client = new SessionsClient({apiEndpoint: `${LOCATION}-dialogflow.googleapis.com`})
    async function detectIntentText() {
      let responseMsg
      const sessionId = Math.random().toString(36).substring(7);
      const sessionPath = client.projectLocationAgentSessionPath(
        PROJECT_ID || '',
        LOCATION || '',
        AGENT_ID || '',
        sessionId
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
          console.log(`Agent Response: ${message.text.text}`);
          responseMsg = message.text.text || 'Default Message'
        }
      }
      if (response?.queryResult?.match?.intent) {
        console.log(`Matched Intent: ${response.queryResult.match.intent.displayName}`);
      }
      console.log(`Current Page: ${response?.queryResult?.currentPage?.displayName}`);


    const RCresponse: ExtendedIMessage = {
      msg: Array.isArray(responseMsg) ? responseMsg.join(' ') : (responseMsg || 'default msg'),
      rid: message.rid,
      tmid: message.tmid,
    };
    await driver.sendMessage(RCresponse);
    }

    detectIntentText();
// =======
    // // if not, intake question (Gen AI integration here)
    // const threadID = (message.tmid)? message.tmid : message._id;

    // let responseMsg = 'placeholder';

    // // 1. get the message ID and check for Gen AI conversation ID:
    // const convoId = await redisClient.get(threadID);

    // if (convoId) {
    //   console.log('conversation exist, pass along the question here');
    //   responseMsg = 'hi again, xxxx';
    // }
    // else {
    //   console.log('conversation not exist yet, create one here');
    //   const newConcoId = 'abc';
    //   await redisClient.setNX(message.tmid, newConcoId);
    //   responseMsg = 'hi again, xxxx';

    // }

    // 2. send question to Gen AI convo, create new if not yet exist

    // 3. pass the response back to chat:

  }
};
