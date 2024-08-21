/*
Respond function of the chatbot:
- identify predefined commands
- connect to GenAI endpoint for response
- reply in a thread in the channel
*/

import { driver } from '@rocket.chat/sdk';
import { CommandList } from './CommandList';
import { ExtendedIMessage } from '../interfaces/CommandInt';
import { 
  ROCKETCHAT_USER, 
  ROCKETCHAT_CHANNEL, 
  AGENT_ID, 
  LOCATION, 
  PROJECT_ID, 
  GCP_SERVICE_ACCOUNT_PRIVATE_KEY, 
  GCP_SERVICE_ACCOUNT_EMAIL,
  AZURE_OPENAI_ENDPOINT,
  AZURE_API_KEY,
  AZURE_SEARCH_KEY
} from '../constants';
import { SessionsClient } from '@google-cloud/dialogflow-cx';
import redisClient from '../services/redis';
import _ from 'lodash';
import "@azure/openai/types"; 
import { AzureOpenAI } from "openai";
// import * as OpenAIModule from "@azure/openai"; 

// import { OpenAIClient, AzureKeyCredential } from "@azure/openai";
import { DefaultAzureCredential, getBearerTokenProvider } from "@azure/identity";
import { setLogLevel } from "@azure/logger";
import "@azure/openai/types";

setLogLevel("info");

//  console.log("what this this library", OpenAIModule);
// Utility function to handle GCP Dialogflow session management
async function getOrSetSessionId(threadId: string): Promise<string> {
  let sessionId = await redisClient.hget(threadId, 'sessionId');
  if (!sessionId) {
    // No session ID exists, create a new one and store it
    sessionId = threadId;  // Using threadId as the session ID for simplicity
    await redisClient.hset(threadId, 'sessionId', sessionId);
    await redisClient.hset(threadId, 'platform', 'GCP'); // Assuming GCP as default platform
  }
  return sessionId;
}

// CommandHandler: Entry point for handling messages from Rocket Chat
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
  console.log('step 00000000000000000000')
  if (prefix === '!Rocky') {
    // Existing GCP logic
    handleGcpCommand(message, commandName);
  } else if (prefix === '!OpenAI') {
    // New OpenAI logic
    handleOpenAiCommand(message, commandName);
  }
};

// Function to handle GCP Dialogflow CX integration
async function handleGcpCommand(message: ExtendedIMessage, query: string) {
  const languageCode = 'en';
  const client = new SessionsClient({
    credentials: {
      private_key: GCP_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n'), 
      client_email: GCP_SERVICE_ACCOUNT_EMAIL 
    },
    apiEndpoint: `${LOCATION}-dialogflow.googleapis.com`
  });

  if (!message.tmid) message.tmid = message._id;
  const threadId = message.tmid || '';
  const GCPsessionId = await getOrSetSessionId(threadId);

  console.log(`Using session ID: ${GCPsessionId} for thread ID: ${threadId}`);

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

  const [response] = await client.detectIntent(request);
  const responseMsg = [];

  for (const message of response?.queryResult?.responseMessages || []) {
    if (message.text) {
      responseMsg.push(`${message.text.text}` || 'Default Message');
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
    if (message.payload?.fields?.richContent) {
      const richContents = _.get(message, 'payload.fields.richContent');
      const actionLink = _.get(richContents, 'listValue.values[0].listValue.values[0].structValue.fields.actionLink.stringValue');
      responseMsg.push(actionLink);
    }
  }

  await sendResponseToRocketChat(message, responseMsg.join(' '));
}

// Function to handle Azure OpenAI integration
async function handleOpenAiCommand(message: ExtendedIMessage, query: string) {
  const scope = "https://rocky-test.openai.azure.com/.default";
  // const azureADTokenProvider = getBearerTokenProvider(new DefaultAzureCredential(), scope);
  const deployment = "gpt-4";
  const apiVersion = "2024-07-01-preview";
  console.log('step 11111111')
const searchEndpoint = 'https://rockytest.search.windows.net'
//  const client = new AzureOpenAI({ azureADTokenProvider, deployment, apiVersion, endpoint });

  const client = new AzureOpenAI({ endpoint:AZURE_OPENAI_ENDPOINT, apiKey:AZURE_API_KEY, apiVersion, deployment});


  const result = await client.chat.completions.create({
    // stream: true,
    messages: [
      { role: "system", content: "You are a helpful assistant. You will talk like a pirate." },
      { role: "user", content: query },
    ],
    model: "",
    // data_sources:[
    //   {
    //     type: "azure_search",
    //     key: AZURE_SEARCH_KEY,
    //     parameters: {
    //       endpoint: searchEndpoint,
    //       index_name: 'rockytest',
          
    //     },
    //   },
    // ]
  });

    // ============================

    // const searchEndpoint = 'https://rockytest.search.windows.net'
    // const client = new OpenAIClient(endpoint, new AzureKeyCredential(apiKey));
    // const messages = [
    //     { role: "user", content: query },
    //   ];
    //   const events = await client.streamChatCompletions(deployment, messages, { 
    //     maxTokens: 128,
    //     azureExtensionOptions: {
    //       extensions: [
    //         {
    //           type: "AzureCognitiveSearch",
    //           endpoint: searchEndpoint,
    //           key: 'AZURE_SEARCH_KEY',
    //           indexName: 'rockytest',
    //         },
    //       ],
    //     },
    //   });
    //   let response = "";
    //   for await (const event of events) {
    //     for (const choice of event.choices) {
    //       const newText = choice.delta?.content;
    //       if (!!newText) {
    //         response += newText;
    //         // To see streaming results as they arrive, uncomment line below
    //         // console.log(newText);
    //       }
    //     }
    //   }
    //   console.log(response);
    // ============================

  const responseMessages = result.choices.map(choice => choice?.message?.content);
  console.log('let me see seee!  !!!!!!!',responseMessages);
  await sendResponseToRocketChat(message, responseMessages.join('\n'));
}

// Utility function to send response back to Rocket Chat
async function sendResponseToRocketChat(message: ExtendedIMessage, response: string) {
  const RCresponse: ExtendedIMessage = {
    msg: response,
    rid: message.rid,
    tmid: message.tmid || message._id,
  };
  await driver.sendMessage(RCresponse);
}
