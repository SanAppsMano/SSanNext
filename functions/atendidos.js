import "./initFetch.js";
import { Redis } from "@upstash/redis";

export async function handler(event) {
  const tenantId =
    (event.queryStringParameters && event.queryStringParameters.t) ||
    new URL(event.rawUrl || "https://dummy").searchParams.get("t");
  if (!tenantId) {
    return { statusCode: 400, body: "Missing tenantId" };
  }

  const redis  = Redis.fromEnv();
  const prefix = `tenant:${tenantId}:`;

  const [raw, attendedSet] = await Promise.all([
    redis.lrange(prefix + "log:attended", 0, 49),
    redis.smembers(prefix + "attendedSet"),
  ]);
  const list = raw.map(s => JSON.parse(s)).sort((a, b) => b.ts - a.ts);
  const nums = attendedSet.map(n => Number(n));

  return {
    statusCode: 200,
    body: JSON.stringify({ attended: list, numbers: nums, count: nums.length }),
  };
}
