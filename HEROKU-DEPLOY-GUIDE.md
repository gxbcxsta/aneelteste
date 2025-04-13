# Guia de Deploy no Heroku

Este guia fornece instruções detalhadas sobre como realizar o deploy desta aplicação no Heroku.

## Pré-requisitos

1. Ter uma conta no [Heroku](https://heroku.com/)
2. Ter o [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli) instalado
3. Ter o [Git](https://git-scm.com/) instalado

## Passos para Deploy

### 1. Login no Heroku

```bash
heroku login
```

### 2. Criar um novo app no Heroku

```bash
heroku create seu-app-name
```

Substitua `seu-app-name` pelo nome desejado para sua aplicação.

### 3. Adicionar o add-on de PostgreSQL

```bash
heroku addons:create heroku-postgresql:mini
```

Isso criará automaticamente a variável de ambiente `DATABASE_URL`.

### 4. Configurar as variáveis de ambiente

Configure as variáveis de ambiente necessárias:

```bash
heroku config:set FOR4PAYMENTS_SECRET_KEY=ad6ab253-8ae1-454c-91f3-8ccb18933065
heroku config:set FOR4PAYMENTS_PUBLIC_KEY=6d485c73-303b-466c-9344-d7b017dd1ecc
heroku config:set UTMIFY_API_TOKEN=XAo52G3UkJ6ePs7Aq3UqHs32hvDPZ8rjUog4
heroku config:set EXATO_API_TOKEN=268753a9b3a24819ae0f02159dee6724
heroku config:set NODE_ENV=production
heroku config:set API_TOKEN_RECEITA=268753a9b3a24819ae0f02159dee6724
```

### 5. Fazer deploy do código

Há duas formas de fazer o deploy:

#### Opção 1: Deploy direto do repositório Git

Se você já tem o projeto em um repositório Git:

```bash
# Adicione o remote do Heroku
git remote add heroku https://git.heroku.com/seu-app-name.git

# Faça o push para o Heroku
git push heroku main
```

#### Opção 2: Deploy do código atual

Se você quer fazer o deploy do código atual sem usar Git:

```bash
# Instalar o plugin Heroku Git
heroku plugins:install heroku-builds

# Fazer o deploy do diretório atual
heroku builds:create
```

### 6. Executar migrações do banco de dados

Após o deploy, execute as migrações do banco de dados:

```bash
heroku run npm run db:push
```

### 7. Verificar se a aplicação está rodando

Abra a aplicação no navegador:

```bash
heroku open
```

## Solução de Problemas

### Verificar logs

```bash
heroku logs --tail
```

### Reiniciar a aplicação

```bash
heroku restart
```

### Acessar o console do Heroku

```bash
heroku run bash
```

### Acessar o banco de dados

```bash
heroku pg:psql
```

## Notas Importantes

1. O Heroku usa a porta definida pela variável de ambiente `PORT`, que é configurada automaticamente.
2. O arquivo `Procfile` já está configurado com `web: node server.js`, que é o comando que o Heroku executará para iniciar a aplicação.
3. O arquivo `server.js` possui lógica para realizar o build da aplicação durante o deploy, se necessário.
4. O Heroku desliga aplicações que ficam inativas por muito tempo. Para manter sua aplicação sempre ativa, considere usar um serviço como o [Uptime Robot](https://uptimerobot.com/) para fazer ping periódico.

## Atualização da Aplicação

Para atualizar a aplicação após fazer mudanças:

```bash
git add .
git commit -m "Atualizações"
git push heroku main
```

Ou, se você não estiver usando Git:

```bash
heroku builds:create
```