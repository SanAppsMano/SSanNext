const params = new URLSearchParams(window.location.search);
const tenantId = params.get('t');

const infoEl = document.getElementById('info');
const historyEl = document.getElementById('history');
const btn = document.getElementById('next');

const FUNCTIONS_BASE = '/.netlify/functions';
let ABLY_KEY;
let ABLY_CHANNEL;

async function init() {
  const envRes = await fetch(`${FUNCTIONS_BASE}/env`);
  const env = await envRes.json();
  ABLY_KEY = env.ABLY_API_KEY;
  ABLY_CHANNEL = env.ABLY_CHANNEL;

  const ably = new Ably.Realtime({ key: ABLY_KEY });
  const channel = ably.channels.get(`${ABLY_CHANNEL}:${tenantId}`);

  channel.subscribe(msg => {
    const d = msg.data;
    addHistory(`${d.type} ${d.ticketNumber || ''}`);
    update();
  });

  btn.addEventListener('click', callNext);
  update();
}

async function callNext() {
  const stat = await fetch(`${FUNCTIONS_BASE}/status?t=${tenantId}`).then(r => r.json());
  if (!stat.nextTicket) return;
  await fetch(`${FUNCTIONS_BASE}/atender?t=${tenantId}&n=${stat.nextTicket}`);
}

async function update() {
  const res = await fetch(`${FUNCTIONS_BASE}/status?t=${tenantId}`);
  if (!res.ok) return;
  const data = await res.json();
  infoEl.textContent = `Próximo: ${data.nextTicket || '-'} | Esperando: ${data.waitingCount}`;
}

function addHistory(text) {
  const li = document.createElement('li');
  li.textContent = text;
  historyEl.prepend(li);
}

init();
