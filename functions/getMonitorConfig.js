import "./initFetch.js";
// functions/getMonitorConfig.js
import { Redis } from '@upstash/redis';

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Método não permitido' }) };
  }

  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    console.error('Missing Upstash Redis configuration');
    return { statusCode: 500, body: JSON.stringify({ error: 'Redis not configured' }) };
  }

  const redisClient = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN
  });

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'JSON inválido' }) };
  }

  const { token, senha } = body;
  if (!token || !senha) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Token ou senha ausente' }) };
  }

  let data;
  try {
    data = await redisClient.get(`monitor:${token}`);
  } catch (err) {
    console.error('Redis fetch error:', err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }

  if (!data) {
    return { statusCode: 404, body: JSON.stringify({ error: 'Configuração não encontrada' }) };
  }

  let stored;
  try {
    stored = JSON.parse(data);
  } catch {
    return { statusCode: 500, body: JSON.stringify({ error: 'Dados inválidos no Redis' }) };
  }

  if (stored.senha !== senha) {
    return { statusCode: 403, body: JSON.stringify({ error: 'Senha inválida' }) };
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ empresa: stored.empresa })
  };
}
export default handler;
