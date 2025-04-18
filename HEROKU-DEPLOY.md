# Instruções de Deploy no Heroku

Este documento fornece instruções detalhadas para implantar a aplicação de Restituição ANEEL no Heroku.

## Pré-requisitos

1. Conta no Heroku (https://signup.heroku.com/)
2. Heroku CLI instalada (https://devcenter.heroku.com/articles/heroku-cli)
3. Git instalado em sua máquina
4. Node.js e npm instalados

## Passos para o Deploy

### 1. Preparar o Repositório Git

Se você ainda não tem um repositório Git para este projeto:

```bash
git init
git add .
git commit -m "Preparando para deploy no Heroku"
```

### 2. Login no Heroku via CLI

```bash
heroku login
```

### 3. Criar uma Nova Aplicação no Heroku

```bash
heroku create nome-da-sua-aplicacao
```

Ou, sem especificar um nome (o Heroku gerará um nome aleatório):

```bash
heroku create
```

### 4. Adicionar o Add-on de PostgreSQL

```bash
heroku addons:create heroku-postgresql:hobby-dev
```

### 5. Configurar as Variáveis de Ambiente Necessárias

#### Variáveis de Ambiente Obrigatórias

Para executar esta aplicação no Heroku, você precisará configurar as seguintes variáveis de ambiente:

**Variáveis Configuradas Automaticamente**
- `DATABASE_URL` - URL de conexão com o banco de dados PostgreSQL (configurado automaticamente pelo add-on do Heroku)
- `PORT` - Porta em que o servidor será executado (configurado automaticamente pelo Heroku)

**Variáveis que Precisam ser Configuradas Manualmente**

*Serviço de Pagamentos For4Payments*
- `FOR4PAYMENTS_SECRET_KEY` - Chave secreta da API For4Payments (exemplo: ad6ab253-8ae1-454c-91f3-8ccb18933065)
- `FOR4PAYMENTS_PUBLIC_KEY` - Chave pública da API For4Payments (exemplo: 6d485c73-303b-466c-9344-d7b017dd1ecc)

*Serviço de Rastreamento Utmify*
- `UTMIFY_API_TOKEN` - Token de acesso para o serviço Utmify (exemplo: XAo52G3UkJ6ePs7Aq3UqHs32hvDPZ8rjUog4)

*Serviço de Consulta de CPF (Opcional)*
- `EXATO_API_TOKEN` - Token para consulta de CPF via API Exato Digital (exemplo: 268753a9b3a24819ae0f02159dee6724)

*Serviço de SMS IntegraFlux*
- `INTEGRAFLUX_API_TOKEN` - Token para envio de SMS pela API IntegraFlux

*Ambiente e Segurança*
- `NODE_ENV` - Ambiente de execução (deve ser "production" para Heroku)
- `SESSION_SECRET` - Chave secreta para criptografia das sessões (gere uma chave forte e única)

#### Configuração via CLI do Heroku

```bash
# Configuração básica
heroku config:set NODE_ENV=production
heroku config:set SESSION_SECRET=$(openssl rand -hex 32)

# For4Payments
heroku config:set FOR4PAYMENTS_SECRET_KEY=ad6ab253-8ae1-454c-91f3-8ccb18933065
heroku config:set FOR4PAYMENTS_PUBLIC_KEY=6d485c73-303b-466c-9344-d7b017dd1ecc

# Utmify
heroku config:set UTMIFY_API_TOKEN=XAo52G3UkJ6ePs7Aq3UqHs32hvDPZ8rjUog4

# Exato Digital (opcional)
heroku config:set EXATO_API_TOKEN=268753a9b3a24819ae0f02159dee6724

# IntegraFlux SMS
heroku config:set INTEGRAFLUX_API_TOKEN=seu-token-sms-aqui
```

#### Configuração via Dashboard do Heroku

Você também pode configurar estas variáveis pelo dashboard web do Heroku:

1. Acesse o Dashboard do Heroku
2. Selecione seu aplicativo
3. Vá para Settings > Config Vars > Reveal Config Vars
4. Adicione cada variável e seu valor correspondente

### 6. Fazer Deploy da Aplicação

```bash
git push heroku main
```

Se sua branch principal não for 'main', use:

```bash
git push heroku master
```

Ou, se estiver enviando de uma branch diferente:

```bash
git push heroku sua-branch:main
```

### 7. Executar as Migrações do Banco de Dados

Primeiro, adicione um novo script ao package.json:

```json
"scripts": {
  ...
  "heroku-db-setup": "node heroku-db-setup.js"
}
```

Em seguida, execute o script de configuração do banco de dados:

```bash
heroku run npm run heroku-db-setup
```

Alternativamente, se não quiser modificar o package.json, execute diretamente:

```bash
heroku run node heroku-db-setup.js
```

### 8. Verificar o Status da Aplicação

```bash
heroku logs --tail
```

### 9. Abrir a Aplicação no Navegador

```bash
heroku open
```

## Solução de Problemas Comuns

### Erro na Compilação do TypeScript

Se você encontrar erros de compilação TypeScript durante o deploy:

1. Verifique se todas as dependências necessárias estão instaladas como dependências principais (não devDependencies)
2. Certifique-se de que o TypeScript esteja instalado como uma dependência principal

```bash
heroku config:set NPM_CONFIG_PRODUCTION=false
```

### Problemas com o Banco de Dados

Se encontrar erros relacionados ao banco de dados:

1. Verifique se a URL do banco de dados está configurada corretamente:

```bash
heroku config | grep DATABASE_URL
```

2. Se necessário, reinicie o banco de dados:

```bash
heroku pg:reset DATABASE --confirm nome-da-sua-aplicacao
```

3. E execute as migrações novamente:

```bash
heroku run npm run db:push
```

### Verificar Logs

Para verificar os logs da aplicação no Heroku:

```bash
heroku logs --tail
```

## Manutenção e Atualização

### Atualizar a Aplicação Após Alterações

1. Commit suas alterações:

```bash
git add .
git commit -m "Descrição das alterações"
```

2. Fazer push para o Heroku:

```bash
git push heroku main
```

### Reiniciar a Aplicação

```bash
heroku restart
```

## Recursos Adicionais

- [Documentação do Heroku para Node.js](https://devcenter.heroku.com/categories/nodejs-support)
- [Heroku Postgres](https://devcenter.heroku.com/articles/heroku-postgresql)
- [Gerenciamento de Variáveis de Ambiente no Heroku](https://devcenter.heroku.com/articles/config-vars)