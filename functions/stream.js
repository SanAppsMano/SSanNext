import Ably from '@ably/realtime';

const ably = new Ably.Realtime(process.env.ABLY_API_KEY);

export async function handler(event) {
  const tenantId = event.queryStringParameters?.t;
  if (!tenantId) {
    return { statusCode: 400, body: 'missing tenant id' };
  }

  const channel = ably.channels.get(`${process.env.ABLY_CHANNEL}:${tenantId}`);

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive'
    },
    body: new ReadableStream({
      start(controller) {
        const listener = msg => {
          controller.enqueue(`data: ${JSON.stringify(msg.data)}\n\n`);
        };
        channel.subscribe(listener);
        controller.enqueue(':ok\n\n');
        controller.closed.then(() => channel.unsubscribe(listener));
      }
    })
  };
}
