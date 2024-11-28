/*
Respond function of the chatbot:
- identify predefined commands
- connect to GenAI endpoint for response
- reply in a thread in the channel
*/

import { driver } from '@rocket.chat/sdk';
// import { CommandList } from './CommandList';
import { ExtendedIMessage } from '../interfaces/CommandInt';
import { 
  ROCKETCHAT_USER,
  ROCKETCHAT_CHANNEL,
  AZURE_OPENAI_ENDPOINT,
  AZURE_API_KEY,
  AZURE_API_VERSION,
  AZURE_OPENAI_SEARCH_ENDPOINT,
  AZURE_DEPLOYMENT,
  AZURE_OPENAI_SEARCH_INDEX_NAME,
  AZURE_PROMPT_MSG
} from '../constants';
import redisClient from '../services/redis';
import _ from 'lodash';
import "@azure/openai/types"; 
import { AzureOpenAI } from "openai";

// import { setLogLevel } from "@azure/logger";
// setLogLevel("info");

// Function to handle Azure OpenAI integration
async function handleOpenAiCommand(message: ExtendedIMessage, query: string) {
  // const scope = "https://rocky-test.openai.azure.com/.default";

  const deployment = AZURE_DEPLOYMENT;
  const apiVersion = AZURE_API_VERSION;
  const chatbotPrompt = AZURE_PROMPT_MSG || "You are an AI assistant that helps people find information, your name is Rocky, a GenAI chatbot developed by the Platform Services Team.";

  const client = new AzureOpenAI({ endpoint:AZURE_OPENAI_ENDPOINT, apiKey:AZURE_API_KEY, apiVersion, deployment});

  const events = await client.chat.completions.create({
    stream: false,
    messages: [
      {
        role: "system",
        content: chatbotPrompt,
      },
      {
        role: "user",
        content: query,
      },
    ],
    max_tokens: 800,
    model: "",
    data_sources: [
      {
        type: "azure_search",
        parameters: {
          endpoint: AZURE_OPENAI_SEARCH_ENDPOINT || '',
          index_name: AZURE_OPENAI_SEARCH_INDEX_NAME || '',
          authentication: {
            type: "system_assigned_managed_identity",
          },
          top_n_documents: 3,
        },
      },
    ],
  });

  let result = '';

  // this is for stream = false
  for (const choice of events.choices) {
    result = formatContentWithCitations(choice.message.content || '', choice.message.context?.citations || [])
  }

  // this is for stream = true
  // for await (const chunk of events) {
  //   const content = chunk.choices[0]?.delta?.content || '';
  //   result += content;  // Concatenate each piece of content to the full sentence
  // }

  await sendResponseToRocketChat(message, result);
}

function formatContentWithCitations(content: string, citations: any[]): string {
let usedCitations = new Set<number>(); // Set to track used citation indices

  // Replace placeholders with markdown citation links
  let formattedContent = content.replace(/\[doc(\d+)\]/g, (match, index) => {
    const citationIndex = parseInt(index) - 1;  // Adjust index because array is zero-based
    if (citations[citationIndex]) {
      usedCitations.add(citationIndex);  // Record that this citation is used
      return `[${citationIndex + 1}](${citations[citationIndex].url})  `;
    }
    return match;  // Return the original string if no citation found
  });

  // Append only used citation URLs at the end
  if (usedCitations.size > 0) {
    formattedContent += '\n\n';  // Ensure there are breaks before the citation list
    usedCitations.forEach(index => {
      formattedContent += `**${index + 1}**: [${citations[index].title}](${citations[index].url})\n`;
    });
  }
    return formattedContent
}

// Utility function to handle conversation session management
async function getOrSetSessionId(threadId: string, platformId: string): Promise<string> {
  let sessionId = await redisClient.hget(threadId, 'sessionId');
  if (!sessionId) {
    // No session ID exists, create a new one and store it
    sessionId = threadId;  // Using threadId as the session ID for simplicity
    await redisClient.hset(threadId, 'sessionId', sessionId);
    await redisClient.hset(threadId, 'platform', platformId);
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
  if (prefix.toLowerCase() === '!rocky') {
    // By default to OpenAI:
    handleOpenAiCommand(message, commandName);
  }
};

// Utility function to send response back to Rocket Chat
async function sendResponseToRocketChat(message: ExtendedIMessage, response: string) {
  const RCresponse: ExtendedIMessage = {
    msg: response,
    rid: message.rid,
    tmid: message.tmid || message._id,
  };
  await driver.sendMessage(RCresponse);
}
