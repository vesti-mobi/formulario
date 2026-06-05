// ============================================================
// Vesti — Formulário conversacional
// Tudo que se edita com frequência está no CONFIG abaixo.
// ============================================================

const CONFIG = {
  // === Webhook n8n =========================================
  // Para alternar entre produção e teste, mude `webhook.active`.
  // A URL de teste só recebe quando o workflow estiver em
  // "Listen for test event" no editor da n8n.
  webhook: {
    production: 'https://marketing.oraculo.moda/webhook/a5eca436-375e-4d22-9bac-7ade2048944a',
    test:       'https://marketing.oraculo.moda/webhook-test/a5eca436-375e-4d22-9bac-7ade2048944a',
    active: 'production' // 'production' | 'test'
  },

  // === Foto da "atendente" ================================
  avatarUrl: 'https://randomuser.me/api/portraits/women/79.jpg',

  // === Tempos de animação (ms) ============================
  timing: {
    intro:      600, // delay entre cada mensagem de boas-vindas
    question:   750, // delay antes de cada pergunta do bot
    finalTitle: 600, // delay antes do título da tela final
    focus:      100  // delay para focar o input após troca de etapa
  },

  // === Mensagens iniciais (antes da 1ª pergunta) ==========
  intro: [
    'A Vesti impulsiona as vendas Online da sua confecção, são quase mil confecções utilizando o ecossistema Vesti.'
  ],

  // === Etapas / perguntas =================================
  // Cada etapa aceita:
  //   key:         nome do campo no payload
  //   botMessage:  string OU função(data) => string
  //   label:       texto acima do input
  //   placeholder: texto interno do input
  //   type:        'text' | 'email' | 'tel' | 'choice'
  //   prefix:      string opcional exibida antes do input (ex.: 'BR +55')
  //   mask:        'phoneBR' para máscara de telefone brasileiro
  //   options:     [{ value, label }] (obrigatório quando type === 'choice')
  //   validate:    (raw) => string|null  (mensagem de erro ou null)
  //   format:      (raw) => valor final salvo no payload
  //   condition:   (data) => boolean — se false, etapa é pulada
  steps: [
    {
      key: 'nome',
      botMessage: 'Pra começar, qual seu nome completo?',
      label: 'NOME COMPLETO',
      placeholder: 'Digite seu nome e sobrenome...',
      type: 'text',
      validate: (v) => {
        const t = v.trim();
        if (t.length < 3) return 'Digite seu nome completo.';
        if (!t.includes(' ')) return 'Inclua o sobrenome também.';
        return null;
      },
      format: (v) => v.trim().replace(/\s+/g, ' ')
    },
    {
      key: 'whatsapp',
      botMessage: (data) => `Prazer, ${firstName(data.nome)}! Qual seu WhatsApp?`,
      label: 'WHATSAPP',
      placeholder: '(11) 99999-9999',
      type: 'tel',
      prefix: 'BR +55',
      mask: 'phoneBR',
      validate: (v) => {
        const digits = v.replace(/\D/g, '');
        if (digits.length < 10 || digits.length > 11) return 'Telefone inválido. Use DDD + número.';
        return null;
      },
      format: (v) => v.replace(/\D/g, '')
    },
    {
      key: 'email',
      botMessage: 'Qual seu melhor e-mail?',
      label: 'E-MAIL',
      placeholder: 'voce@email.com',
      type: 'email',
      validate: (v) => {
        const t = v.trim();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(t)) return 'E-mail inválido.';
        return null;
      },
      format: (v) => v.trim().toLowerCase()
    },
    {
      key: 'perfil',
      botMessage: 'Para que eu possa direcionar seu atendimento da melhor forma, em qual perfil você se encaixa: fabricante, multimarca ou já é cliente da Vesti?',
      label: 'PERFIL',
      type: 'choice',
      options: [
        { value: 'fabricante',    label: 'Fabricante' },
        { value: 'multimarca',    label: 'Multimarca' },
        { value: 'cliente_vesti', label: 'Já sou cliente da Vesti' }
      ]
    },
    {
      key: 'marca',
      botMessage: 'Show! E qual o nome da sua marca?',
      label: 'NOME DA MARCA',
      placeholder: 'Digite o nome da sua marca...',
      type: 'text',
      condition: (data) => data.perfil === 'fabricante',
      validate: (v) => v.trim().length < 2 ? 'Informe o nome da marca.' : null,
      format: (v) => v.trim()
    },
    {
      key: 'usa_erp',
      botMessage: 'Você utiliza algum ERP atualmente?',
      label: 'ERP',
      type: 'choice',
      condition: (data) => data.perfil === 'fabricante',
      options: [
        { value: 'sim', label: 'Sim' },
        { value: 'nao', label: 'Não' }
      ]
    },
    {
      key: 'erp_nome',
      botMessage: 'Qual ERP você utiliza?',
      label: 'NOME DO ERP',
      placeholder: 'Ex: Bling, Tiny, Linx...',
      type: 'text',
      condition: (data) => data.usa_erp === 'sim',
      validate: (v) => v.trim().length < 2 ? 'Informe o nome do ERP.' : null,
      format: (v) => v.trim()
    },
    {
      key: 'faturamento',
      botMessage: 'Por último, qual a faixa de faturamento mensal?',
      label: 'FAIXA DE FATURAMENTO',
      type: 'choice',
      condition: (data) => data.perfil === 'fabricante',
      options: [
        { value: 'btn_starter',    label: 'Até R$ 200k' },
        { value: 'btn_pro',        label: 'R$ 200k - R$ 1M' },
        { value: 'btn_enterprise', label: 'Acima de R$ 1M' }
      ]
    }
  ],

  // === Tela final =========================================
  finalMessage: {
    title: 'Recebemos seu contato!',
    body:  'Um especialista da Vesti vai falar com você em instantes pelo WhatsApp.'
  }
};

// ============================================================
// Estado interno
// ============================================================
const state = {
  stepIndex: 0,
  data: {}
};

// ============================================================
// Helpers gerais
// ============================================================
function getActiveWebhookUrl() {
  return CONFIG.webhook[CONFIG.webhook.active] || CONFIG.webhook.production;
}

function firstName(full) {
  return (full || '').trim().split(/\s+/)[0] || '';
}

function $(sel) {
  return document.querySelector(sel);
}

function scrollChatToBottom() {
  const chat = $('#chat');
  chat.scrollTop = chat.scrollHeight;
}

// Lê UTMs e click IDs (gclid/fbclid) da URL atual.
function getUtmsAndClickIds() {
  const params = new URLSearchParams(window.location.search);
  const keys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'gclid', 'fbclid'];
  const out = {};
  keys.forEach(k => {
    const v = params.get(k);
    if (v) out[k] = v;
  });
  return out;
}

// Máscara de telefone brasileiro: (XX) XXXXX-XXXX
function applyPhoneMaskBR(value) {
  const d = value.replace(/\D/g, '').slice(0, 11);
  if (d.length === 0)  return '';
  if (d.length <= 2)   return `(${d}`;
  if (d.length <= 6)   return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10)  return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7, 11)}`;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

// ============================================================
// UI: balões e indicador "digitando..."
// ============================================================
function appendBubble(side, text) {
  const row = document.createElement('div');
  row.className = `row ${side}`;
  if (side === 'bot') {
    row.innerHTML = `
      <div class="avatar" aria-hidden="true"><img src="${CONFIG.avatarUrl}" alt=""/></div>
      <div class="bubble">${escapeHtml(text)}</div>
    `;
  } else {
    row.innerHTML = `<div class="bubble">${escapeHtml(text)}</div>`;
  }
  $('#chat').appendChild(row);
  scrollChatToBottom();
}

function showTyping() {
  const row = document.createElement('div');
  row.className = 'row bot';
  row.id = 'typing-row';
  row.innerHTML = `
    <div class="avatar" aria-hidden="true"><img src="${CONFIG.avatarUrl}" alt=""/></div>
    <div class="bubble"><span class="typing"><span></span><span></span><span></span></span></div>
  `;
  $('#chat').appendChild(row);
  scrollChatToBottom();
}

function hideTyping() {
  const t = document.getElementById('typing-row');
  if (t) t.remove();
}

async function botSay(text, delay = CONFIG.timing.question) {
  showTyping();
  await new Promise(r => setTimeout(r, delay));
  hideTyping();
  appendBubble('bot', text);
}

// ============================================================
// Progresso dinâmico (considera etapas condicionais)
// ============================================================
function getVisibleSteps() {
  return CONFIG.steps.filter(s => !s.condition || s.condition(state.data));
}

function updateProgress() {
  const visible = getVisibleSteps();
  const currentKey = CONFIG.steps[state.stepIndex]?.key;
  const currentVisibleIndex = visible.findIndex(s => s.key === currentKey);

  const progress = $('.progress');
  progress.innerHTML = '';
  visible.forEach((_, i) => {
    if (i > 0) {
      const bar = document.createElement('span');
      bar.className = 'bar';
      progress.appendChild(bar);
    }
    const dot = document.createElement('span');
    dot.className = 'dot';
    if (currentVisibleIndex === -1) {
      dot.classList.add('done');
    } else if (i < currentVisibleIndex) {
      dot.classList.add('done');
    } else if (i === currentVisibleIndex) {
      dot.classList.add('active');
    }
    progress.appendChild(dot);
  });
  progress.setAttribute('aria-valuemax', String(visible.length));
  progress.setAttribute('aria-valuenow', String(Math.max(0, currentVisibleIndex)));
}

// ============================================================
// Renderização do input para a etapa atual
// ============================================================
function renderInputForCurrentStep() {
  const step      = CONFIG.steps[state.stepIndex];
  const input     = $('#input');
  const label     = $('#fieldLabel');
  const prefix    = $('#prefix');
  const inputWrap = $('#inputWrap');
  const choices   = $('#choices');

  label.textContent = step.label;
  $('#error').textContent = '';

  // Escolha múltipla: esconde input, mostra botões
  if (step.type === 'choice') {
    inputWrap.hidden = true;
    choices.hidden = false;
    choices.innerHTML = '';
    step.options.forEach(opt => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'choice-btn';
      btn.textContent = opt.label;
      btn.addEventListener('click', () => onChoiceSelect(opt));
      choices.appendChild(btn);
    });
    return;
  }

  // Texto/email/telefone
  inputWrap.hidden = false;
  choices.hidden = true;
  input.value = '';
  input.type = step.type || 'text';
  input.placeholder = step.placeholder || '';
  input.inputMode = step.type === 'tel' ? 'numeric'
                   : step.type === 'email' ? 'email'
                   : 'text';

  if (step.prefix) {
    prefix.textContent = step.prefix;
    prefix.hidden = false;
  } else {
    prefix.hidden = true;
    prefix.textContent = '';
  }

  setTimeout(() => input.focus(), CONFIG.timing.focus);
}

function onChoiceSelect(opt) {
  const step = CONFIG.steps[state.stepIndex];
  state.data[step.key] = opt.value;
  appendBubble('user', opt.label);
  nextStep();
}

// ============================================================
// Avanço de etapas (com salto condicional)
// ============================================================
async function nextStep() {
  state.stepIndex += 1;

  // Pula etapas cuja condição não for atendida
  while (state.stepIndex < CONFIG.steps.length) {
    const s = CONFIG.steps[state.stepIndex];
    if (s.condition && !s.condition(state.data)) {
      state.stepIndex += 1;
    } else {
      break;
    }
  }

  updateProgress();

  if (state.stepIndex >= CONFIG.steps.length) {
    await finish();
    return;
  }

  const step = CONFIG.steps[state.stepIndex];
  const msg  = typeof step.botMessage === 'function'
    ? step.botMessage(state.data)
    : step.botMessage;
  await botSay(msg, CONFIG.timing.question);
  renderInputForCurrentStep();
}

// ============================================================
// Submissão final ao webhook
// ============================================================
async function finish() {
  $('#composer').remove();
  await botSay(CONFIG.finalMessage.title, CONFIG.timing.finalTitle);

  const payload = {
    ...state.data,
    ...getUtmsAndClickIds(),
    submitted_at: new Date().toISOString(),
    page_url:     window.location.href,
    user_agent:   navigator.userAgent,
    referrer:     document.referrer || null
  };

  try {
    await fetch(getActiveWebhookUrl(), {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload)
    });
  } catch (err) {
    console.error('[Vesti Form] Erro ao enviar para o webhook:', err);
  }

  // Renderiza o cartão de "obrigado"
  const main = $('.vf-app');
  const done = document.createElement('div');
  done.className = 'done-state';
  done.innerHTML = `
    <div class="check">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5 12l5 5L20 7" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </div>
    <h2>${escapeHtml(CONFIG.finalMessage.title)}</h2>
    <p>${escapeHtml(CONFIG.finalMessage.body)}</p>
  `;
  main.appendChild(done);
}

// ============================================================
// Handlers de input
// ============================================================
function onSubmit(e) {
  e.preventDefault();
  const step = CONFIG.steps[state.stepIndex];
  const raw  = $('#input').value;

  const err = step.validate ? step.validate(raw) : null;
  if (err) {
    $('#error').textContent = err;
    return;
  }

  const value = step.format ? step.format(raw) : raw.trim();
  state.data[step.key] = value;

  const displayValue = step.mask === 'phoneBR' ? applyPhoneMaskBR(value) : raw.trim();
  appendBubble('user', displayValue);

  nextStep();
}

function onInput(e) {
  const step = CONFIG.steps[state.stepIndex];
  if (step && step.mask === 'phoneBR') {
    const masked = applyPhoneMaskBR(e.target.value);
    if (masked !== e.target.value) e.target.value = masked;
  }
  $('#error').textContent = '';
}

// ============================================================
// Inicialização
// ============================================================
async function init() {
  updateProgress();

  // Mensagens introdutórias
  for (const msg of CONFIG.intro) {
    await botSay(msg, CONFIG.timing.intro);
  }

  // Primeira pergunta
  const first    = CONFIG.steps[0];
  const firstMsg = typeof first.botMessage === 'function'
    ? first.botMessage(state.data)
    : first.botMessage;
  await botSay(firstMsg, CONFIG.timing.question);
  renderInputForCurrentStep();
}

$('#composer').addEventListener('submit', onSubmit);
$('#input').addEventListener('input',   onInput);

init();
