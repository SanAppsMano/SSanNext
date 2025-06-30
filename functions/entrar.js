import { v4 as uuidv4 } from 'uuid';
import faunadb from 'faunadb';
import Ably from '@ably/rest';

const { Client, query: q } = faunadb;
const fauna = new Client({ secret: process.env.FAUNA_SECRET });
const ably = new Ably.Rest(process.env.ABLY_API_KEY);

export async function handler(event) {
  const tenantId = event.queryStringParameters?.t;
  if (!tenantId) {
    return { statusCode: 400, body: 'missing tenant id' };
  }

  const clientId = uuidv4();
  const ts = Date.now();

  // increment counter atomically
  let counter;
  const counterMatch = q.Match(q.Index('counters_by_tenant'), tenantId);
  try {
    counter = await fauna.query(
      q.Let(
        { ref: q.Select('ref', q.Get(counterMatch)) },
        q.Update(q.Var('ref'), {
          data: { ticketCounter: q.Add(q.Select(['data', 'ticketCounter'], q.Get(q.Var('ref'))), 1) }
        })
      )
    );
  } catch (err) {
    counter = await fauna.query(
      q.Create(q.Collection('Counters'), { data: { tenantId, ticketCounter: 1 } })
    );
  }
  const ticketNumber = counter.data.ticketCounter;

  await fauna.query(
    q.Create(q.Collection('Tickets'), {
      data: { tenantId, ticketNumber, clientId, ts }
    })
  );

  const channel = ably.channels.get(`${process.env.ABLY_CHANNEL}:${tenantId}`);
  await channel.publish('queue', { type: 'enter', clientId, ticketNumber, ts });

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ clientId, ticketNumber, ts })
  };
}
