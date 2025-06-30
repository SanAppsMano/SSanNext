// Ably and QRious are loaded locally

const params = new URLSearchParams(window.location.search);
const tenantId = params.get('t');

const statusEl = document.getElementById('status');
const historyEl = document.getElementById('history');
const btn = document.getElementById('newTicket');
const qrImg = document.getElementById('qr');

let ABLY_KEY;
let ABLY_CHANNEL;

const FUNCTIONS_BASE = '/.netlify/functions';

async function init() {
  const envRes = await fetch(`${FUNCTIONS_BASE}/env`);
  if (!envRes.ok) {
    throw new Error('Failed to load environment');
  }
  const env = await envRes.json();
  ABLY_KEY = env.ABLY_API_KEY;
  ABLY_CHANNEL = env.ABLY_CHANNEL;

  if (qrImg) {
    const url = `${window.location.origin}${window.location.pathname}?t=${tenantId}`;
    new QRious({ element: qrImg, value: url, size: 150 });
  }

  const ably = new Ably.Realtime({ key: ABLY_KEY });
  const channel = ably.channels.get(`${ABLY_CHANNEL}:${tenantId}`);

  channel.subscribe(msg => {
    const data = msg.data;
    switch (data.type) {
      case 'enter':
        addHistory(`Ticket ${data.ticketNumber} entrou`);
        break;
      case 'serve':
        addHistory(`Ticket ${data.ticketNumber} atendido`);
        break;
    }
    updateStatus();
  });

  btn.addEventListener('click', async () => {
    const res = await fetch(`${FUNCTIONS_BASE}/entrar?t=${tenantId}`);
    if (res.ok) {
      const info = await res.json();
      addHistory(`Você recebeu ticket ${info.ticketNumber}`);
    }
  });

  updateStatus();
}

async function updateStatus() {
  const res = await fetch(`${FUNCTIONS_BASE}/status?t=${tenantId}`);
  if (!res.ok) return;
  const data = await res.json();
  statusEl.textContent = `Próximo: ${data.nextTicket || '-'} (esperando: ${data.waitingCount})`;
}

function addHistory(text) {
  const li = document.createElement('li');
  li.textContent = text;
  historyEl.prepend(li);
}

init();
