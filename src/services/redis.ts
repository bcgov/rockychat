/*
Create Redis client to store Rocketchat to Gen AI conversation relationship:
*/
import Redis from 'ioredis';
import { REDIS_HOST, REDIS_PASSWORD  } from '../constants';

// Setup redis client:
const redisClient = new Redis({
    host: REDIS_HOST,
    port: 6379,
    password: REDIS_PASSWORD
});

redisClient.on('connect', () => {
  console.log('Connected to Redis');
});

redisClient.on('error', (err: unknown) => {
  console.error('Redis Error:', err);
});

export default redisClient;
