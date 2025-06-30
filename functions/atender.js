import faunadb from 'faunadb';
import Ably from '@ably/rest';

const { Client, query: q } = faunadb;
const fauna = new Client({ secret: process.env.FAUNA_SECRET });
const ably = new Ably.Rest(process.env.ABLY_API_KEY);

export async function handler(event) {
  const tenantId = event.queryStringParameters?.t;
  const ticketNumber = parseInt(event.queryStringParameters?.n, 10);
  if (!tenantId || isNaN(ticketNumber)) {
    return { statusCode: 400, body: 'missing parameters' };
  }

  const ts = Date.now();
  const match = q.Match(q.Index('ticket_by_tenant_number'), [tenantId, ticketNumber]);
  try {
    const ticketDoc = await fauna.query(q.Get(match));
    await fauna.query(q.Update(ticketDoc.ref, { data: { attendedTs: ts } }));
  } catch (err) {
    return { statusCode: 404, body: 'ticket not found' };
  }

  const channel = ably.channels.get(`${process.env.ABLY_CHANNEL}:${tenantId}`);
  await channel.publish('queue', { type: 'serve', ticketNumber, ts });

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ticketNumber, attendedTs: ts })
  };
}
