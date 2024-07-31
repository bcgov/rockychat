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
  PROJECT_ID,
  LOCATION,
  AGENT_ID,
  GCP_SERVICE_ACCOUNT_PRIVATE_KEY,
  GCP_SERVICE_ACCOUNT_EMAIL
} = process.env;
