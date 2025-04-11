# Aplicação de Restituição ICMS

Aplicação web para geração de simulações de restituição de impostos para cidadãos brasileiros, fornecendo uma interface intuitiva com aparência oficial para simulações de reembolso de impostos.

## Tecnologias Principais

- Frontend React TypeScript
- Biblioteca de componentes Shadcn/UI
- Validação de formulários com Zod
- Design responsivo com foco em mobile
- Princípios de design em estilo governamental (GovBR)

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
   ```

5. Faça push do código para o Heroku:
   ```
   git push heroku main
   ```

6. Execute as migrações do banco de dados (se necessário):
   ```
   heroku run npm run db:push
   ```

7. Abra a aplicação:
   ```
   heroku open
   ```

## Variáveis de Ambiente

Para executar esta aplicação, você precisará adicionar as seguintes variáveis de ambiente:

- `DATABASE_URL` - URL de conexão com o banco de dados PostgreSQL
- Adicione outras variáveis de ambiente necessárias, como chaves de API para serviços externos

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