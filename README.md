# Aplicação de Restituição ANEEL (ICMS)

Aplicação web para processamento de restituições de tributos em contas de energia elétrica para cidadãos brasileiros, oferecendo processamento rápido de 60 minutos com recursos avançados de experiência do usuário e recursos de segurança.

## Tecnologias Principais

- Frontend React TypeScript com Vite
- Biblioteca de componentes Shadcn/UI
- Banco de dados PostgreSQL
- Integração com API For4Payments
- Verificação SMS via IntegraFlux
- Serviço de rastreamento de eventos Utmify
- Validação de formulários com Zod
- Estilização com Tailwind CSS
- Segurança avançada com implementação mobile-first
- Deployment no Heroku com configuração alternativa de banco de dados

## Deploy no Heroku

### Pré-requisitos

- Conta no Heroku
- Heroku CLI instalado localmente
- Git

### Passos para o Deploy

1. Faça login no Heroku:
   ```
   heroku login
   ```

2. Crie uma aplicação no Heroku:
   ```
   heroku create sua-aplicacao
   ```

3. Adicione um banco de dados PostgreSQL:
   ```
   heroku addons:create heroku-postgresql:hobby-dev
   ```

4. Configure as variáveis de ambiente necessárias:
   ```
   heroku config:set NODE_ENV=production
   heroku config:set FOR4PAYMENTS_SECRET_KEY=ad6ab253-8ae1-454c-91f3-8ccb18933065
   heroku config:set FOR4PAYMENTS_PUBLIC_KEY=6d485c73-303b-466c-9344-d7b017dd1ecc
   heroku config:set UTMIFY_API_TOKEN=XAo52G3UkJ6ePs7Aq3UqHs32hvDPZ8rjUog4
   heroku config:set EXATO_API_TOKEN=268753a9b3a24819ae0f02159dee6724
   heroku config:set INTEGRAFLUX_API_TOKEN=sua-chave-sms-aqui
   ```

5. Faça push do código para o Heroku:
   ```
   git push heroku main
   ```

6. Execute as migrações do banco de dados:
   ```
   heroku run npm run db:push
   ```

7. Abra a aplicação:
   ```
   heroku open
   ```

## Variáveis de Ambiente Obrigatórias

Para executar esta aplicação, você precisará adicionar as seguintes variáveis de ambiente:

- `DATABASE_URL` - URL de conexão com o banco de dados PostgreSQL (configurado automaticamente pelo add-on do Heroku)
- `FOR4PAYMENTS_SECRET_KEY` - Chave secreta da API For4Payments para processamento de pagamentos
- `FOR4PAYMENTS_PUBLIC_KEY` - Chave pública da API For4Payments
- `UTMIFY_API_TOKEN` - Token de acesso para o serviço Utmify de rastreamento de eventos
- `EXATO_API_TOKEN` - Token para consulta de CPF via API Exato Digital (se estiver usando esta funcionalidade)
- `INTEGRAFLUX_API_TOKEN` - Token para envio de SMS pela API IntegraFlux

## Desenvolvimento Local

1. Clone o repositório
2. Instale as dependências:
   ```
   npm install
   ```
3. Crie um arquivo `.env` na raiz do projeto e configure as variáveis de ambiente necessárias
4. Execute o servidor de desenvolvimento:
   ```
   npm run dev
   ```

## Recursos Adicionais

- O frontend será servido na porta 5000
- API REST disponível em `/api`