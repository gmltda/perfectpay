# 🌐 Hoje Hub — Central de Landing Pages & Vendas da Vaga Limitada

[![GitHub Pages](https://img.shields.io/badge/Deploy-GitHub%20Pages-blue?style=for-the-badge&logo=github)](https://hoje.vagalimitada.com)
[![Custom Domain](https://img.shields.io/badge/Domain-hoje.vagalimitada.com-coral?style=for-the-badge)](https://hoje.vagalimitada.com)
[![Analytics](https://img.shields.io/badge/Tracking-GTM%20&%20UTMify-green?style=for-the-badge&logo=google-analytics)](https://tagmanager.google.com)

Bem-vindo ao repositório **Hoje Hub** (`hoje.git`). Este repositório funciona como uma central de distribuição e hospedagem de **páginas de vendas (Landing Pages) estáticas de alta conversão** para infoprodutos e cursos digitais da empresa. 

A hospedagem é feita de forma ultra-otimizada e sem custos de servidor utilizando o **GitHub Pages**, centralizado sob o domínio customizado **`hoje.vagalimitada.com`**.

---

## 🛠️ Arquitetura e Roteamento Multicampanha

O projeto é estruturado de forma descentralizada. A raiz e cada subpasta correspondem a uma rota pública no domínio principal. Cada pasta contém um site estático completo (copiado e otimizado a partir de estruturas WordPress/Elementor) contendo os scripts de tracking, assets e botões de checkout específicos.

```
                         ┌─────────── [ hoje.vagalimitada.com ] ───────────┐
                         │                                                 │
      ┌──────────────────┼─────────────────┬─────────────────┬─────────────┴─────────────────┐
      ▼                  ▼                 ▼                 ▼                               ▼
   (Raiz)        /resina-artistica  /costura-criativa  /bolsas-de-croche-lucrativas  /moldes-de-costura-premium ...
 [Redireciona/   [Curso de Resina]  [Costura Criativa] [Bolsas de Crochê]            [Moldes de Costura]
   Encerrado]
```

---

## 📊 Catálogo de Rotas e Ofertas

Abaixo está o mapeamento completo das rotas disponíveis no repositório, seus respectivos infoprodutos, status de atividade e detalhes comerciais.

| Rota / Subdiretório | Infoproduto / Oferta | Status | Preço / Plano | Checkout (PerfectPay / App) | Observações |
| :--- | :--- | :---: | :--- | :--- | :--- |
| **`/` (Raiz)** | Página de Transição | ⛔ *Inativo* | - | - | Exibe o aviso **"Promoção Encerrada"** com GTM ativo. |
| **`/2500-modelos-de-croche`** | 2500 Modelos de Crochê | 🟢 **Ativo** | R$ 19,90 | Acessível diretamente via `/index.html` | Pacote massivo de receitas de crochê com gráficos e vídeo aulas. |
| **`/bolsas-de-croche-lucrativas`** | Bolsas de Crochê Lucrativas | 🟢 **Ativo** | R$ 19,90 | Acessível diretamente via `/index.html` | Inclui receitas de bolsas, suporte, e grupo exclusivo de alunas. |
| **`/costura-criativa`** | Curso de Confecção de Bolsas Passo a Passo | 🟢 **Ativo** | R$ 19,90 | Acessível diretamente via `/index.html` | Rota principal com design otimizado para vendas. |
| **`/criacao-de-camaroes`** | Curso de Criação de Camarões | 🟢 **Ativo** | R$ 10,00 | Acessível diretamente via `/index.html` | Guia prático de carcinicultura de água doce. |
| **`/croche-2500-modelos`** | Crochê 2500 Modelos | 🟢 **Ativo** | R$ 19,90 | Acessível diretamente via `/index.html` | Rota alternativa com gráficos e vídeos dinâmicos de crochê. |
| **`/moldes-de-costura-premium`** | Moldes de Costura Premium | 🟢 **Ativo** | R$ 10,00 | Acessível diretamente via `/index.html` | Pacote exclusivo de moldes premium prontos para imprimir. |
| **`/resina-artistica`** | Curso Resina Artística | 🟢 **Ativo** | **Master:** R$ 29,90 <br> **Básico:** R$ 10,00 | Master: [PPU38CPO858](https://go.perfectpay.com.br/PPU38CPO858) <br> Básico: [PPU38CPO85J](https://go.perfectpay.com.br/PPU38CPO85J) | Ensina a fabricar e vender joias, chaveiros, mesas e móveis de resina. Contém FAQ dinâmico e bônus. |

---

## 📈 Stack de Conversão & Ferramentas de Marketing

Todas as páginas contam com scripts nativos injetados de forma a rastrear, aquecer e converter os leads da forma mais transparente e rápida possível.

### 1. Rastreamento e Pixel (GTM)
Cada ponto de entrada de HTML carrega um container global do **Google Tag Manager** no início do `<head>` e do `<body>`:
* **ID do GTM:** `GTM-WWX5XB9`
* Responsável por gerenciar pixels do Facebook, Google Ads, TikTok e disparar eventos de PageView e cliques no checkout automaticamente.

### 2. Preservação de UTMs (UTMify)
Nas páginas de vendas ativas, há o script UTMify importado dinamicamente:
```html
<script src="scripts/utms/latest.js" data-utmify-prevent-xcod-sck="" data-utmify-prevent-subids="" async defer></script>
```
* **Função:** Captura os parâmetros UTM da URL (`utm_source`, `utm_medium`, `utm_campaign`, `src`, etc.) e os propaga de forma transparente para todos os links de checkout (` परफेक्टपे ` / ` PerfectPay `) presentes nos botões, evitando perda de rastreamento no momento da compra.

### 3. Gatilhos de Prova Social Real-Time (Notiflix / Custom Toast)
As ofertas integram notificações de prova social para simular compras em tempo real, gerando maior confiança e engajamento das visitantes:
```javascript
// Dispara popups simulando compras de alunas de forma orgânica
var compras = [
  { nome: "Vanessa R.", tempo: "45 minutos", pagamento: "cartão de crédito" },
  { nome: "Raquel Silveira", tempo: "22 minutos", pagamento: "cartão de crédito" }
];
```

### 4. Data e Urgência Dinâmica
Gatilhos dinâmicos inserem a data atual atualizada via JavaScript nas ofertas de urgência ("*PROMOÇÃO VÁLIDA SOMENTE HOJE*"), impedindo que a página pareça datada.

---

## 🔧 Guia de Manutenção e Operações

### Como reativar ou pausar uma oferta
Se um produto foi descontinuado ou a promoção terminou:
1. Copie a estrutura do arquivo `index.html` da raiz (o modelo de Promoção Encerrada).
2. Substitua o `index.html` do produto inativo por este template de redirecionamento.
3. Se quiser reativar, recupere a página de vendas original do histórico do Git ou use o arquivo `index-encerrada.html` se disponível na pasta da oferta.

### Atualizar Links de Checkout
Os links de pagamento estão vinculados a botões que direcionam para a **PerfectPay** ou **App Vaga Limitada**. Para alterar o recebedor ou mudar a oferta:
1. Abra o arquivo HTML de entrada da pasta desejada (ex: `/resina-artistica/index.html`).
2. Procure por `perfectpay.com.br` ou `app.vagalimitada.com` ou pelo ID da oferta (ex: `PPU38CPO858`).
3. Substitua pelo novo link desejado.

### Publicação (Deploy)
Toda alteração feita no branch principal (`main`) é sincronizada e publicada instantaneamente graças ao pipeline do **GitHub Pages**. Após dar o `git push`, as alterações estarão disponíveis em até 2 minutos no link correspondente.

---

## 💻 Requisitos para Visualização Local
Como as páginas são estáticas (HTML puro + CSS/JS hospedados localmente nas pastas `assets` ou remotamente em CDNs), você não precisa de nenhum compilador ou framework.

Para rodar localmente e testar alterações:
1. Abra a pasta do projeto no VS Code.
2. Inicie a extensão **Live Server** ou rode um servidor estático simples de sua preferência:
   * Exemplo via Python: `python -m http.server 8000`
   * Exemplo via Node.js: `npx serve .`
3. Acesse `http://localhost:8000` para navegar nas pastas e testar os checkouts.

---

⭐ **Desenvolvido e mantido pela equipe de marketing e tecnologia.** Todos os direitos de design e conteúdo são reservados.
