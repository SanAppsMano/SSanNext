import faunadb from 'faunadb';

const { Client, query: q } = faunadb;
const fauna = new Client({ secret: process.env.FAUNA_SECRET });

export async function handler(event) {
  const tenantId = event.queryStringParameters?.t;
  if (!tenantId) {
    return { statusCode: 400, body: 'missing tenant id' };
  }

  const pendingMatch = q.Match(q.Index('tickets_pending_by_tenant'), tenantId);
  const historyMatch = q.Match(q.Index('tickets_by_tenant_sorted'), tenantId);

  let nextTicket = null;
  let waitingCount = 0;
  let history = [];

  try {
    const pending = await fauna.query(
      q.Paginate(pendingMatch, { size: 1 })
    );
    if (pending.data.length) {
      const doc = await fauna.query(q.Get(pending.data[0]));
      nextTicket = doc.data.ticketNumber;
    }
    waitingCount = (await fauna.query(q.Count(pendingMatch))) || 0;
  } catch (err) {}

  try {
    const historyRes = await fauna.query(q.Paginate(historyMatch, { size: 10 }));
    history = await fauna.query(
      q.Map(historyRes.data, ref => q.Select(['data'], q.Get(ref)))
    );
  } catch (err) {}

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nextTicket, waitingCount, history })
  };
}
