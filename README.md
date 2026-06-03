# Formulário Vesti

Formulário conversacional (estilo chat / Typeform) para captura de leads das campanhas Vesti.
HTML + CSS + JS puro — sem build, sem dependências. Roda em qualquer servidor estático e pode ser embutido em outros sites via `<iframe>`.

---

## O que o formulário coleta

Campos preenchidos pelo lead:

- **Nome completo**
- **WhatsApp** (com máscara BR e validação de DDD)
- **E-mail**
- **Perfil:** fabricante / multimarca / cliente Vesti
- **Apenas se fabricante:** nome da marca, uso de ERP, nome do ERP, faixa de faturamento

Capturado automaticamente da URL e incluído no payload:

- `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`
- `gclid`, `fbclid`
- `submitted_at`, `page_url`, `user_agent`, `referrer`

---

## Onde editar (objeto `CONFIG` em `script.js`)

Tudo que muda com frequência está no topo de `script.js`, no objeto `CONFIG`:

| Campo                  | Para que serve |
|------------------------|----------------|
| `webhook.production`   | URL do webhook n8n em produção |
| `webhook.test`         | URL do webhook em modo teste |
| `webhook.active`       | `'production'` ou `'test'` — escolhe qual URL será usada |
| `avatarUrl`            | Foto da "atendente" exibida nos balões do bot |
| `timing`               | Delays de animação em ms (digitação, foco) |
| `intro`                | Mensagens iniciais do bot (array de strings) |
| `steps`                | Perguntas (ver formato abaixo) |
| `finalMessage`         | Título e corpo da tela final |

### Trocar o webhook entre produção e teste

```js
webhook: {
  production: '...',
  test:       '...',
  active: 'test' // ← muda aqui
}
```

### Adicionar uma pergunta nova

Inclua um objeto no array `steps`:

```js
{
  key: 'empresa',
  botMessage: 'Qual o nome da sua confecção?',
  label: 'EMPRESA',
  placeholder: 'Nome da empresa',
  type: 'text',
  validate: (v) => v.trim().length < 2 ? 'Campo obrigatório.' : null
}
```

Para a pergunta aparecer só em certos casos, use `condition`:

```js
condition: (data) => data.perfil === 'fabricante'
```

Tipos suportados: `'text'`, `'email'`, `'tel'`, `'choice'` (com `options: [{ value, label }]`).

---

## Rodar local

Na pasta do projeto:

```bash
python -m http.server 8000
```

Abre em http://localhost:8000

> Não abra direto pelo `file://` — o navegador bloqueia o `fetch` para o webhook.

---

## Publicar no GitHub Pages

1. No repositório, vá em **Settings → Pages**
2. **Source:** _Deploy from a branch_
3. **Branch:** `main` / `/ (root)`
4. Salvar e aguardar ~1 minuto

URL pública: `https://vesti-mobi.github.io/formulario/`

Links de campanha com UTM:

```
https://vesti-mobi.github.io/formulario/?utm_source=meta&utm_medium=paid&utm_campaign=junho2026
```

---

## Embutir em outro site (iframe)

Recomendado para WordPress, landing pages externas, ou qualquer site onde queira mostrar o formulário **sem mexer no código host**. O `<iframe>` isola o documento, então o CSS do site não vaza pro form (e vice-versa).

Exemplo de iframe responsivo:

```html
<div style="position:relative; width:100%; max-width:880px; margin:0 auto; min-height:640px; aspect-ratio: 9 / 16;">
  <iframe
    src="https://vesti-mobi.github.io/formulario/?utm_source=site&utm_medium=organic"
    title="Formulário Vesti"
    style="position:absolute; inset:0; width:100%; height:100%; border:0;"
    loading="lazy"
    allow="clipboard-write"
  ></iframe>
</div>
```

UTMs continuam funcionando: basta acrescentar à URL no `src`.

---

## Estrutura

```
formulario/
├── index.html   # Estrutura (single root: <main class="vf-app">)
├── style.css    # Estilos — todos escopados em .vf-app
├── script.js    # CONFIG + lógica do chat e do envio
└── README.md
```

---

## Payload enviado ao webhook

```json
{
  "nome": "Maria Laura",
  "whatsapp": "11999999999",
  "email": "maria@vesti.mobi",
  "perfil": "fabricante",
  "marca": "Vesti",
  "usa_erp": "sim",
  "erp_nome": "Bling",
  "faturamento": "btn_pro",
  "utm_source": "meta",
  "utm_medium": "paid",
  "utm_campaign": "junho2026",
  "submitted_at": "2026-06-02T19:25:12.988Z",
  "page_url": "https://vesti-mobi.github.io/formulario/?utm_source=meta&...",
  "user_agent": "Mozilla/5.0 ...",
  "referrer": null
}
```
