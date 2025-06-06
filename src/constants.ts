/*
Import constants from .env
*/

import dotenv from 'dotenv';
dotenv.config();

export const {
  ROCKETCHAT_URL,
  ROCKETCHAT_USER,
  ROCKETCHAT_PASSWORD,
  ROCKETCHAT_USE_SSL,
  ROCKETCHAT_CHANNEL,
  REDIS_HOST,
  REDIS_PASSWORD,
  AZURE_API_KEY,
  AZURE_OPENAI_ENDPOINT,
  AZURE_SEARCH_KEY,
  AZURE_API_VERSION,
  AZURE_OPENAI_SEARCH_ENDPOINT,
  AZURE_DEPLOYMENT,
  AZURE_OPENAI_SEARCH_INDEX_NAME,
  AZURE_PROMPT_MSG,
} = process.env;
