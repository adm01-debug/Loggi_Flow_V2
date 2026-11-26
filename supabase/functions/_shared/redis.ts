import { Redis } from "https://esm.sh/@upstash/redis@1.25.0";
import { log } from "../_shared/logger.ts";
import { isSecretConfigured } from "../_shared/secretConfig.ts";

const UPSTASH_REDIS_REST_URL = Deno.env.get("UPSTASH_REDIS_REST_URL");
const UPSTASH_REDIS_REST_TOKEN = Deno.env.get("UPSTASH_REDIS_REST_TOKEN");

let redisClient: Redis | null = null;

export const getRedisClient = () => {
  if (
    !isSecretConfigured(UPSTASH_REDIS_REST_URL) ||
    !isSecretConfigured(UPSTASH_REDIS_REST_TOKEN)
  ) {
    log.warn("Redis credentials not configured. Cache will be disabled.");
    return null;
  }

  if (!redisClient) {
    redisClient = new Redis({
      url: UPSTASH_REDIS_REST_URL,
      token: UPSTASH_REDIS_REST_TOKEN,
    });
  }

  return redisClient;
};
