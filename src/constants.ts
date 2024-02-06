import dotenv from "dotenv";
dotenv.config();

export const {
  ROCKETCHAT_URL,
  ROCKETCHAT_USER,
  ROCKETCHAT_PASSWORD,
  ROCKETCHAT_USE_SSL,
  ROCKETCHAT_CHANNEL,
} = process.env;
