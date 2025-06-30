import { Realtime } from '@ably/realtime';

const params = new URLSearchParams(window.location.search);
const tenantId = params.get('t');

const statusEl = document.getElementById('status');
const historyEl = document.getElementById('history');
const btn = document.getElementById('newTicket');

let ABLY_KEY;
let ABLY_CHANNEL;

async function init() {
  const envRes = await fetch('/functions/env');
  const env = await envRes.json();
  ABLY_KEY = env.ABLY_API_KEY;
  ABLY_CHANNEL = env.ABLY_CHANNEL;

  const ably = new Realtime({ key: ABLY_KEY });
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
    const res = await fetch(`/functions/entrar?t=${tenantId}`);
    const info = await res.json();
    addHistory(`Você recebeu ticket ${info.ticketNumber}`);
  });

  updateStatus();
}

async function updateStatus() {
  const res = await fetch(`/functions/status?t=${tenantId}`);
  const data = await res.json();
  statusEl.textContent = `Próximo: ${data.nextTicket || '-'} (esperando: ${data.waitingCount})`;
}

function addHistory(text) {
  const li = document.createElement('li');
  li.textContent = text;
  historyEl.prepend(li);
}

init();
