# 🎵 Randomify

**Randomify** é uma aplicação fullstack moderna para sortear músicas, álbuns de estúdio e singles/EPs aleatórios de artistas selecionados usando a API do Spotify.

---

## 🛠️ Stack Tecnológica

- **Monorepo:** `pnpm workspaces`
- **Frontend (`apps/web`):**
  - [Next.js](https://nextjs.org/) (App Router)
  - [Tailwind CSS](https://tailwindcss.com/)
  - [shadcn/ui](https://ui.shadcn.com/) (design system)
  - [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/)
  - [TanStack Query v5](https://tanstack.com/query)
  - [Lucide Icons](https://lucide.dev/)
- **Backend (`apps/api`):**
  - [Fastify](https://fastify.dev/)
  - [Prisma ORM](https://www.prisma.io/) (PostgreSQL)
  - [Zod](https://zod.dev/) + `fastify-type-provider-zod`
  - `@fastify/jwt` & `@fastify/cookie`
  - Spotify Web API (OAuth 2.0 Authorization Code Flow)
- **Compartilhado (`packages/shared`):**
  - Schemas Zod e tipos TypeScript compartilhados de ponta a ponta.

---

## 📁 Estrutura do Projeto

```
randomify/
├── apps/
│   ├── api/             # Servidor Fastify, Prisma & Spotify OAuth
│   └── web/             # Frontend Next.js com Tailwind & TanStack Query
├── packages/
│   └── shared/          # Schemas Zod e tipos TypeScript compartilhados
├── docker-compose.yml   # PostgreSQL 16 Alpine
├── pnpm-workspace.yaml  # Configuração do monorepo pnpm
└── README.md
```

---

## ⚡ Como Rodar o Projeto

### 1. Pré-requisitos
- [Node.js](https://nodejs.org/) v20+ ou v24+
- [pnpm](https://pnpm.io/) v11+
- [Docker](https://www.docker.com/) & Docker Compose

---

### 2. Configurar o Spotify Developer Dashboard

1. Acesse o [Spotify Developer Dashboard](https://developer.spotify.com/dashboard) e faça login.
2. Clique em **Create app**:
   - **App name:** `Randomify`
   - **App description:** `Spotify music randomizer`
   - **Redirect URI:** adicione exatamente:
     ```
     http://127.0.0.1:3333/auth/callback
     ```
   - Em **Which API/SDKs are you planning to use?**, selecione **Web API**.
   - Aceite os termos e salve.
3. Nas configurações (**Settings**) da aplicação criada:
   - Copie o **Client ID**.
   - Clique em **View client secret** e copie o **Client Secret**.

---

### 3. Configurar as Variáveis de Ambiente

Edite o arquivo `apps/api/.env` e insira suas credenciais do Spotify:

```env
PORT=3333
CLIENT_URL=http://localhost:3000
DATABASE_URL="postgresql://randomify:randomify_password@localhost:5432/randomify?schema=public"
JWT_SECRET="randomify_super_secret_jwt_key_1234567890_change_in_prod"

# Suas credenciais do Spotify:
SPOTIFY_CLIENT_ID="SEU_CLIENT_ID_AQUI"
SPOTIFY_CLIENT_SECRET="SEU_CLIENT_SECRET_AQUI"
SPOTIFY_REDIRECT_URI="http://127.0.0.1:3333/auth/callback"
```

---

### 4. Subir o Banco de Dados e Rodar Migrações

Suba o container do PostgreSQL via Docker Compose:

```bash
pnpm db:up
```

Em seguida, execute as migrações do Prisma para criar as tabelas no banco:

```bash
pnpm db:migrate
```

*(Opcional) Para visualizar o banco de dados graficamente:*
```bash
pnpm db:studio
```

---

### 5. Iniciar os Servidores em Desenvolvimento

Inicie o backend e o frontend simultaneamente:

```bash
pnpm dev
```

- **Frontend:** [http://localhost:3000](http://localhost:3000)
- **Backend API:** [http://localhost:3333](http://localhost:3333)
- **Health Check:** [http://localhost:3333/health](http://localhost:3333/health)

---

## 🎯 Funcionalidades

1. **Login com Spotify:**
   - Autenticação OAuth oficial com permissão para ler artistas seguidos e perfil.
2. **Seleção de Artistas:**
   - Visualização e seleção direta dos artistas que você segue.
   - Busca em tempo real de qualquer artista no catálogo mundial do Spotify.
   - Seleção múltipla com contadores e chips removíveis.
3. **Sorteador Personalizável:**
   - **Música:** Sorteia faixas de álbuns, singles ou top tracks do catálogo.
   - **Álbum:** Sorteia álbuns de estúdio completos.
   - **Single / EP:** Sorteia lançamentos compactos e singles.
4. **Player Integrado:**
   - Embed oficial do Spotify com áudio, capa e link direto para o app.
5. **Presets de Artistas:**
   - Salve listas personalizadas de artistas (ex: "Indie Rock", "Rap BR") salvas no PostgreSQL.
6. **Histórico de Sorteios:**
   - Registro automático dos sorteios realizados com data e hora.
