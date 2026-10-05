# Nexo Showcase App · Studio de Aplicações da Marca

Webapp exclusivo e independente para visualização, teste e personalização em alta fidelidade de todas as aplicações da marca Nexo.

Integrado ao banco de dados **Supabase passaporte-saude** (`https://vuikpnwtofcpohudmxmf.supabase.co`).

---

## 🚀 Como Executar o Webapp

### 1. Instalar as Dependências
Abra o terminal dentro desta pasta (`showcase-app`):

```bash
cd showcase-app
npm install
```

*(Ou você pode usar as dependências da raiz caso esteja em um monorepo).*

### 2. Rodar o Servidor de Desenvolvimento
```bash
npm run dev
```

O aplicativo iniciará em:
👉 **`http://localhost:3001`**

### 3. Build de Produção
```bash
npm run build
npm run start
```

---

## ☁️ Integração com Supabase (`passaporte-saude`)

Este webapp está conectado via MCP / REST API ao projeto **Supabase `passaporte-saude`**:

### Tabelas Criadas e Sincronizadas:
1. **`brand_custom_palettes`**: Armazena todas as paletas de cores personalizadas salvas pelo usuário (5 tons: primária, secundária, acento, fundo e texto).
2. **`brand_custom_symbols`**: Armazena todos os SVGs enviados (drag & drop, upload de arquivo ou código colado).
3. **`brand_choices`**: Armazena a direção de marca ativa selecionada (símbolo ativo, paleta ativa, tipografia, raio de cantos, wordmark, e listas de símbolos/paletas ocultados).

### Variáveis de Ambiente (`.env.local`):
```env
NEXT_PUBLIC_SUPABASE_URL=https://vuikpnwtofcpohudmxmf.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

---

## 🎨 Funcionalidades

* **iPhone 16 Pro Interativo:** Mockup ultra-realista com Notch dinâmico, feed de saúde, carteira de passaportes e vouchers ativos.
* **Cartão de Acesso 3D:** Cartão físico em PVC com efeito de flip 3D frente/verso, chip EMV dourado, tarja magnética e QR Code dinâmico.
* **Papelaria & Stationery:** Envelopes timbrados, pastas corporativas e bloco de notas institucional.
* **Voucher de Benefício & Validação:** Layout de voucher perfurado para clínicas com validação em tempo real.
* **Posts para Redes Sociais:** Formato quadrado (1:1) com tipografia editorial e gradientes da marca.
* **Sinalização & Merch:** Totem digital e ecobag institucional.
* **Estúdio de Cores & Paletas:** Criador de paletas de 5 tons, teste de contraste WCAG em tempo real e galeria de paletas salvas com exclusão em 1 clique.
* **Uploader & Gerenciador de SVG:** Suporte a arquivos `.svg`, código colado, modo monocromático ou cores nativas, e exclusão de qualquer SVG.
