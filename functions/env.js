export async function handler() {
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ABLY_API_KEY: process.env.ABLY_API_KEY,
      ABLY_CHANNEL: process.env.ABLY_CHANNEL
    })
  };
}
