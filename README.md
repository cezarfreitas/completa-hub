# Completa - Monolito Backend + Frontend

Projeto monolítico que replica o fluxo do n8n para verificação de cobertura Completa. **Suporta múltiplos clientes** com endpoints diferentes. **Clientes e logs armazenados em MongoDB.**

## MongoDB

- **Clientes**: cadastrados no banco, gerenciados em `/admin`
- **Logs de verificação**: cada requisição é registrada automaticamente

### Adicionar novo cliente

Acesse **/admin** e use o formulário, ou chame a API:

```bash
POST /api/integrations
{
  "slug": "cliente-abc",
  "name": "Nome do Cliente",
  "plan_id": 1234,
  "completa_api_url": "https://outro-endpoint.com/api/subscriptions",
  "completa_origin": "https://origem-permitida.com",
  "google_api_key": "opcional"
}
```

## Fluxo (equivalente ao n8n)

1. **Webhook** – Recebe POST com: `rua`, `numero`, `bairro`, `cidade`, `cep`, `nome`, `whatsapp`
2. **Google Geocode** – Obtém coordenadas e componentes do endereço
3. **Edit Fields** – Monta payload para a API Completa
4. **HTTP Request** – POST na URL configurada do cliente
5. **Response** – Retorna Cobertura, endereço normalizado e `id_conecteai`

## Configuração

1. Copie o arquivo de exemplo de variáveis de ambiente:

```bash
copy .env.local.example .env.local
```

2. Configure as variáveis no `.env.local`:

```
GOOGLE_GEOCODE_API_KEY=sua_chave_aqui
MONGODB_URI=mongodb://localhost:27017/completa
```

3. Execute o seed para criar o primeiro cliente (se o banco estiver vazio):

```bash
curl -X POST http://localhost:3000/api/seed
```

## Executar

```bash
npm install
npm run dev
```

Acesse: http://localhost:3000

## Deploy no EasyPanel (Docker)

O projeto está pronto para deploy via Docker no [EasyPanel](https://easypanel.io).

### 1. Criar projeto no EasyPanel

- Crie um novo projeto e adicione um serviço do tipo **App**
- Configure o repositório Git: `https://github.com/cezarfreitas/completa-hub.git`
- Em **Build**, selecione **Dockerfile** e use o caminho: `Dockerfile` (raiz do projeto)

### 2. Variáveis de ambiente

Configure no painel **Environment** do EasyPanel:

| Variável | Obrigatório | Descrição |
|----------|-------------|-----------|
| `GOOGLE_GEOCODE_API_KEY` | Sim | Chave da API Google Geocode |
| `MONGODB_URI` | Sim | URI do MongoDB (ex: `mongodb://host:27017/completa`) |
| `ADMIN_USER` | Não | Usuário do painel admin (padrão: `admin`) |
| `ADMIN_PASSWORD` | Sim | Senha do painel admin (**obrigatório em produção**) |

### 3. MongoDB

O app precisa de um MongoDB acessível. No EasyPanel você pode:

- Criar um serviço MongoDB no mesmo projeto
- Ou usar um MongoDB externo (Atlas, etc.) e definir `MONGODB_URI` com a URI de conexão

### 4. Deploy

Clique em **Deploy** para fazer o build e subir o container. A aplicação ficará disponível na porta 3000.

**Health check:** O endpoint `GET /api/health` retorna `{ status: "ok" }` e pode ser usado para verificação de disponibilidade.

## API

**GET** `/api/integrations` – Lista clientes disponíveis

**POST** `/api/{slug}` – Ex: `POST /api/completa-2025`

**Body (JSON):**
```json
{
  "rua": "Rua Exemplo",
  "numero": "100",
  "bairro": "Centro",
  "cidade": "São Paulo",
  "cep": "01000000",
  "nome": "João Silva",
  "whatsapp": "5511999999999"
}
```

**Resposta:**
```json
{
  "Cobertura": "Tem Cobertura",
  "rua": "...",
  "numero": "...",
  "bairro": "...",
  "cidade": "...",
  "estado": "...",
  "cep": "...",
  "latitude": -23.55,
  "longitude": -46.63,
  "id_conecteai": "..."
}
```
