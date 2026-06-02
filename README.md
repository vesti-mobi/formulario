# Form Vesti — Formulário conversacional

Landing page com formulário em formato de chat (estilo Typeform/Viver de IA) para captura de leads.
HTML + CSS + JS puro. Sem build, sem dependências. Roda em qualquer servidor estático.

---

## Rodar local

Na pasta do projeto:

```bash
# Python 3
python -m http.server 8000
```

Abre: http://localhost:8000

Se não tiver Python, qualquer outro servidor estático serve (ex.: `npx serve`).

> **Não abra direto pelo `file://`** — o `fetch` para o webhook pode ser bloqueado pelo navegador.

---

## Editar perguntas, textos ou webhook

Tudo está em `script.js`, dentro do objeto `CONFIG` (no topo do arquivo):

- `webhookUrl` — URL do webhook n8n
- `intro` — array de mensagens iniciais do "bot"
- `steps` — perguntas (cada uma com label, placeholder, validação e máscara)
- `finalMessage` — texto da tela de agradecimento

### Adicionar uma pergunta nova

Inclua mais um objeto no array `steps`:

```js
{
  key: 'empresa',
  botMessage: 'Qual o nome da sua confecção?',
  label: 'EMPRESA',
  placeholder: 'Nome da empresa',
  type: 'text',
  validate: (v) => v.trim().length < 2 ? 'Campo obrigatório' : null
}
```

Lembre de atualizar os "dots" da barra de progresso no `index.html` (`.progress` — adicionar `<span class="dot"></span>` e um `<span class="bar"></span>` entre eles).

---

## Payload enviado ao webhook

```json
{
  "nome": "Maria Laura",
  "whatsapp": "11999999999",
  "email": "maria@vesti.mobi",
  "utm_source": "paidmedia",
  "utm_medium": "google_ads",
  "utm_campaign": "search",
  "utm_content": "navigation",
  "gclid": "Cj0KCQjw...",
  "submitted_at": "2026-06-02T16:43:00.000Z",
  "page_url": "https://.../?utm_source=...",
  "user_agent": "...",
  "referrer": ""
}
```

UTMs e `gclid`/`fbclid` são capturados automaticamente da URL.

---

## Publicar no GitHub Pages

1. Crie um repo (ex.: `vesti-mobi/form-lead`)
2. `git init && git add . && git commit -m "init"`
3. `git remote add origin <url>` e `git push -u origin main`
4. No GitHub: **Settings → Pages → Source: Deploy from branch → main / root**
5. URL: `https://vesti-mobi.github.io/form-lead/`

> Lembre: para o webhook funcionar em produção, o n8n precisa permitir CORS da origem do GitHub Pages (ou estar atrás de um proxy que adicione o header).

---

## Estrutura

```
form-vesti/
├── index.html   # Estrutura
├── style.css    # Visual Vesti (roxo + verde menta)
├── script.js    # Fluxo, validações, máscara, envio
└── README.md
```
