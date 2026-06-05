// ============================================================
// Vesti — Formulário conversacional (versão embed)
// Auto-injeta lógica em todo elemento .vf-embed da página.
// Não polui escopo global. Não usa #id global.
// ============================================================
(function () {
  function init(root) {
    if (root.dataset.vfInited === '1') return;
    root.dataset.vfInited = '1';

    var CONFIG = {
      webhook: {
        production: 'https://marketing.oraculo.moda/webhook/a5eca436-375e-4d22-9bac-7ade2048944a',
        test:       'https://marketing.oraculo.moda/webhook-test/a5eca436-375e-4d22-9bac-7ade2048944a',
        active: 'production'
      },
      avatarUrl: 'https://cdn.jsdelivr.net/gh/vesti-mobi/formulario@main/avatar.jpg',
      timing: { intro: 600, question: 750, finalTitle: 600, focus: 100 },
      intro: [],
      steps: [
        { key: 'nome', botMessage: 'Pra começar, qual seu nome completo?', label: 'NOME COMPLETO',
          placeholder: 'Digite seu nome e sobrenome...', type: 'text',
          validate: function (v) { return v.trim().length < 2 ? 'Digite seu nome.' : null; },
          format:   function (v) { return v.trim().replace(/\s+/g, ' '); } },
        { key: 'whatsapp',
          botMessage: function (d) { return 'Prazer, ' + firstName(d.nome) + '! Qual seu WhatsApp?'; },
          label: 'WHATSAPP', placeholder: '(11) 99999-9999',
          type: 'tel', prefix: 'BR +55', mask: 'phoneBR',
          validate: function (v) { var d = v.replace(/\D/g, ''); return (d.length < 10 || d.length > 11) ? 'Telefone inválido. Use DDD + número.' : null; },
          format:   function (v) { return v.replace(/\D/g, ''); } },
        { key: 'perfil',
          botMessage: function (d) { return 'Olá ' + firstName(d.nome) + '! Para direcionar seu atendimento da melhor forma, me conta, você é:'; },
          label: 'PERFIL', type: 'choice',
          options: [
            { value: 'fabricante',    label: 'Fabricante' },
            { value: 'multimarca',    label: 'Multimarca' },
            { value: 'cliente_vesti', label: 'Já sou cliente da Vesti' }
          ]
        },
        { key: 'marca', botMessage: 'Show! E qual o nome da sua marca?', label: 'NOME DA MARCA',
          placeholder: 'Digite o nome da sua marca...', type: 'text',
          condition: function (d) { return d.perfil === 'fabricante' || d.perfil === 'cliente_vesti'; },
          validate:  function (v) { return v.trim().length < 2 ? 'Informe o nome da marca.' : null; },
          format:    function (v) { return v.trim(); } },
        { key: 'cliente_busca', botMessage: 'O que está buscando?', label: 'BUSCA', type: 'choice',
          condition: function (d) { return d.perfil === 'cliente_vesti'; },
          options: [
            { value: 'btn_suporte', label: 'Suporte' },
            { value: 'btn_cs',      label: 'Conhecer outro produto' }
          ]
        },
        { key: 'usa_erp', botMessage: 'Você utiliza algum ERP atualmente?', label: 'ERP', type: 'choice',
          condition: function (d) { return d.perfil === 'fabricante'; },
          options: [ { value: 'sim', label: 'Sim' }, { value: 'nao', label: 'Não' } ]
        },
        { key: 'erp_nome', botMessage: 'Qual ERP você utiliza?', label: 'NOME DO ERP',
          placeholder: 'Ex: Bling, Tiny, Linx...', type: 'text',
          condition: function (d) { return d.usa_erp === 'sim'; },
          validate:  function (v) { return v.trim().length < 2 ? 'Informe o nome do ERP.' : null; },
          format:    function (v) { return v.trim(); } },
        { key: 'faturamento', botMessage: 'Por último, qual a faixa de faturamento mensal?', label: 'FAIXA DE FATURAMENTO', type: 'choice',
          condition: function (d) { return d.perfil === 'fabricante'; },
          options: [
            { value: 'btn_starter',    label: 'Até R$ 200k' },
            { value: 'btn_pro',        label: 'R$ 200k - R$ 1M' },
            { value: 'btn_enterprise', label: 'Acima de R$ 1M' }
          ]
        }
      ],
      finalMessage: { title: 'Recebemos seu contato!', body: 'Um especialista da Vesti vai falar com você pelo WhatsApp.' },
      multimarcaMessage: 'A Vesti é focada no atacado de moda, conectando fabricantes e revendedores diretamente, por isso não atendemos o modelo multimarca.\n\nMas se quiser conhecer os fornecedores que usam a Vesti, vale baixar o Vestishop, nosso app com o catálogo completo das confecções parceiras: https://vestishop.vesti.mobi/app',
      clienteCSMessage: function (d) { return 'Obrigada, ' + firstName(d.nome) + '! A consultora responsável pela sua marca entrará em contato em breve.'; },
      clienteSuporteMessage: 'Clique abaixo para falar com nosso time de suporte:\n\n📲 wa.me/551132304077\n\nAtendemos de Seg. a Sex. (8h30 às 17h30) e Sáb. (9h às 13h).'
    };

    var state = { stepIndex: 0, data: {}, busy: false };

    function $(sel) { return root.querySelector('[data-vf="' + sel + '"]'); }
    function getActiveWebhookUrl() { return CONFIG.webhook[CONFIG.webhook.active] || CONFIG.webhook.production; }
    function firstName(full) { return (full || '').trim().split(/\s+/)[0] || ''; }
    function scrollChatToBottom() { var c = $('chat'); c.scrollTop = c.scrollHeight; }

    function getUtmsAndClickIds() {
      var params = new URLSearchParams(window.location.search);
      var keys = ['utm_source','utm_medium','utm_campaign','utm_content','utm_term','gclid','fbclid'];
      var out = {};
      keys.forEach(function (k) { var v = params.get(k); if (v) out[k] = v; });
      return out;
    }
    function applyPhoneMaskBR(value) {
      var d = value.replace(/\D/g, '').slice(0, 11);
      if (d.length === 0)  return '';
      if (d.length <= 2)   return '(' + d;
      if (d.length <= 6)   return '(' + d.slice(0,2) + ') ' + d.slice(2);
      if (d.length <= 10)  return '(' + d.slice(0,2) + ') ' + d.slice(2,6) + '-' + d.slice(6);
      return '(' + d.slice(0,2) + ') ' + d.slice(2,7) + '-' + d.slice(7,11);
    }
    function escapeHtml(s) {
      return String(s).replace(/[&<>"']/g, function (c) {
        return { '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c];
      });
    }
    function formatBubbleText(text) {
      var escaped = escapeHtml(text);
      var linkified = escaped.replace(/(https?:\/\/[^\s<]+|wa\.me\/[^\s<]+)/g, function (m) {
        var href = m.indexOf('http') === 0 ? m : 'https://' + m;
        return '<a href="' + href + '" target="_blank" rel="noopener">' + m + '</a>';
      });
      return linkified.replace(/\n/g, '<br>');
    }

    function appendBubble(side, text) {
      var row = document.createElement('div');
      row.className = 'row ' + side;
      if (side === 'bot') {
        row.innerHTML =
          '<div class="avatar" aria-hidden="true"><img src="' + CONFIG.avatarUrl + '" alt=""/></div>' +
          '<div class="bubble">' + formatBubbleText(text) + '</div>';
      } else {
        row.innerHTML = '<div class="bubble">' + formatBubbleText(text) + '</div>';
      }
      $('chat').appendChild(row);
      scrollChatToBottom();
    }
    function showTyping() {
      var row = document.createElement('div');
      row.className = 'row bot';
      row.setAttribute('data-vf-typing', '1');
      row.innerHTML =
        '<div class="avatar" aria-hidden="true"><img src="' + CONFIG.avatarUrl + '" alt=""/></div>' +
        '<div class="bubble"><span class="typing"><span></span><span></span><span></span></span></div>';
      $('chat').appendChild(row);
      scrollChatToBottom();
    }
    function hideTyping() {
      var t = root.querySelector('[data-vf-typing]');
      if (t) t.remove();
    }
    function botSay(text, delay) {
      delay = (typeof delay === 'number') ? delay : CONFIG.timing.question;
      return new Promise(function (resolve) {
        showTyping();
        setTimeout(function () { hideTyping(); appendBubble('bot', text); resolve(); }, delay);
      });
    }

    function getVisibleSteps() {
      return CONFIG.steps.filter(function (s) { return !s.condition || s.condition(state.data); });
    }
    function updateProgress() {
      var visible = getVisibleSteps();
      var currentKey = CONFIG.steps[state.stepIndex] && CONFIG.steps[state.stepIndex].key;
      var currentVisibleIndex = visible.findIndex(function (s) { return s.key === currentKey; });

      var progress = root.querySelector('.progress');
      progress.innerHTML = '';
      visible.forEach(function (_, i) {
        if (i > 0) {
          var bar = document.createElement('span'); bar.className = 'bar'; progress.appendChild(bar);
        }
        var dot = document.createElement('span'); dot.className = 'dot';
        if (currentVisibleIndex === -1)        dot.classList.add('done');
        else if (i <  currentVisibleIndex)     dot.classList.add('done');
        else if (i === currentVisibleIndex)    dot.classList.add('active');
        progress.appendChild(dot);
      });
      progress.setAttribute('aria-valuemax', String(visible.length));
      progress.setAttribute('aria-valuenow', String(Math.max(0, currentVisibleIndex)));
    }

    function renderInputForCurrentStep() {
      var step      = CONFIG.steps[state.stepIndex];
      var input     = $('input');
      var label     = $('fieldLabel');
      var prefix    = $('prefix');
      var inputWrap = $('inputWrap');
      var choices   = $('choices');

      label.textContent = step.label;
      $('error').textContent = '';

      if (step.type === 'choice') {
        inputWrap.hidden = true;
        choices.hidden = false;
        choices.innerHTML = '';
        step.options.forEach(function (opt) {
          var btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'choice-btn';
          btn.textContent = opt.label;
          btn.addEventListener('click', function () { onChoiceSelect(opt); });
          choices.appendChild(btn);
        });
        return;
      }

      inputWrap.hidden = false;
      choices.hidden = true;
      input.value = '';
      input.type = step.type || 'text';
      input.placeholder = step.placeholder || '';
      input.inputMode = step.type === 'tel' ? 'numeric' : step.type === 'email' ? 'email' : 'text';

      if (step.prefix) { prefix.textContent = step.prefix; prefix.hidden = false; }
      else             { prefix.hidden = true; prefix.textContent = ''; }

      setTimeout(function () { input.focus(); }, CONFIG.timing.focus);
    }

    function onChoiceSelect(opt) {
      if (state.busy) return;
      var step = CONFIG.steps[state.stepIndex];
      state.data[step.key] = opt.value;
      appendBubble('user', opt.label);
      nextStep();
    }

    async function nextStep() {
      state.busy = true;
      state.stepIndex += 1;
      while (state.stepIndex < CONFIG.steps.length) {
        var s = CONFIG.steps[state.stepIndex];
        if (s.condition && !s.condition(state.data)) state.stepIndex += 1;
        else break;
      }
      updateProgress();

      if (state.stepIndex >= CONFIG.steps.length) {
        await finish();
        state.busy = false;
        return;
      }

      var step = CONFIG.steps[state.stepIndex];
      var msg  = (typeof step.botMessage === 'function') ? step.botMessage(state.data) : step.botMessage;
      await botSay(msg, CONFIG.timing.question);
      renderInputForCurrentStep();
      state.busy = false;
    }

    async function finish() {
      $('composer').remove();

      var isMultimarca     = state.data.perfil === 'multimarca';
      var isClienteCS      = state.data.perfil === 'cliente_vesti' && state.data.cliente_busca === 'btn_cs';
      var isClienteSuporte = state.data.perfil === 'cliente_vesti' && state.data.cliente_busca === 'btn_suporte';

      if (isMultimarca)          await botSay(CONFIG.multimarcaMessage,            CONFIG.timing.finalTitle);
      else if (isClienteCS)      await botSay(CONFIG.clienteCSMessage(state.data), CONFIG.timing.finalTitle);
      else if (isClienteSuporte) await botSay(CONFIG.clienteSuporteMessage,        CONFIG.timing.finalTitle);
      else                       await botSay(CONFIG.finalMessage.title,           CONFIG.timing.finalTitle);

      var payload = Object.assign({}, state.data, getUtmsAndClickIds(), {
        submitted_at: new Date().toISOString(),
        page_url:     window.location.href,
        user_agent:   navigator.userAgent,
        referrer:     document.referrer || null
      });
      try {
        await fetch(getActiveWebhookUrl(), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } catch (err) {
        console.error('[Vesti Form] Erro ao enviar para o webhook:', err);
      }

      if (isMultimarca || isClienteCS || isClienteSuporte) return;

      var done = document.createElement('div');
      done.className = 'done-state';
      done.innerHTML =
        '<div class="check"><svg viewBox="0 0 24 24" aria-hidden="true">' +
        '<path d="M5 12l5 5L20 7" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>' +
        '</svg></div>' +
        '<h2>' + escapeHtml(CONFIG.finalMessage.title) + '</h2>' +
        '<p>' + escapeHtml(CONFIG.finalMessage.body) + '</p>';
      root.appendChild(done);
    }

    function onSubmit(e) {
      e.preventDefault();
      if (state.busy) return;
      var step = CONFIG.steps[state.stepIndex];
      if (!step || step.type === 'choice') return;
      var raw = $('input').value;
      var err = step.validate ? step.validate(raw) : null;
      if (err) { $('error').textContent = err; return; }
      var value = step.format ? step.format(raw) : raw.trim();
      state.data[step.key] = value;
      var displayValue = step.mask === 'phoneBR' ? applyPhoneMaskBR(value) : raw.trim();
      appendBubble('user', displayValue);
      $('input').value = '';
      nextStep();
    }
    function onInput(e) {
      var step = CONFIG.steps[state.stepIndex];
      if (step && step.mask === 'phoneBR') {
        var masked = applyPhoneMaskBR(e.target.value);
        if (masked !== e.target.value) e.target.value = masked;
      }
      $('error').textContent = '';
    }

    async function start() {
      updateProgress();
      for (var i = 0; i < CONFIG.intro.length; i++) {
        await botSay(CONFIG.intro[i], CONFIG.timing.intro);
      }
      var first = CONFIG.steps[0];
      var firstMsg = (typeof first.botMessage === 'function') ? first.botMessage(state.data) : first.botMessage;
      await botSay(firstMsg, CONFIG.timing.question);
      renderInputForCurrentStep();
    }

    $('composer').addEventListener('submit', onSubmit);
    $('input').addEventListener('input', onInput);
    start();
  }

  function bootAll() {
    var roots = document.querySelectorAll('.vf-embed');
    for (var i = 0; i < roots.length; i++) init(roots[i]);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootAll);
  } else {
    bootAll();
  }
})();
