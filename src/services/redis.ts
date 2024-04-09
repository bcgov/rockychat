/*
Create Redis client to store Rocketchat to Gen AI conversation relationship:
*/
import Redis from 'ioredis';
import { REDIS_HOST } from '../constants';

// Setup redis client:
const redisClient = new Redis(`redis://${REDIS_HOST}`);

redisClient.on('connect', () => {
  console.log('Connected to Redis');
});

redisClient.on('error', (err: unknown) => {
  console.error('Redis Error:', err);
});

export default redisClient;
