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
  REDIS_PASSWORD
} = process.env;
