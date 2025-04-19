# Deploy no Render

Este guia vai te ajudar a fazer o deploy do aplicativo de Restituição ICMS no Render.

## Passos para o Deploy

### 1. Crie uma conta no Render

- Acesse [render.com](https://render.com/) e crie uma conta
- Você pode se registrar usando sua conta do GitHub para facilitar o processo

### 2. Conecte seu repositório

- No Dashboard do Render, clique em "New" e selecione "Blueprint"
- Conecte ao seu repositório GitHub (ou GitLab)
- Selecione o repositório do projeto

### 3. Configure seu Blueprint

O arquivo `render.yaml` já foi configurado com as definições para o web service e o banco de dados PostgreSQL.

### 4. Configure as variáveis de ambiente

O Render irá criar automaticamente a variável `DATABASE_URL` com base no banco PostgreSQL conectado. 

Para as outras variáveis de ambiente, você precisará configurá-las manualmente:

- `FOR4PAYMENTS_PUBLIC_KEY`: 6d485c73-303b-466c-9344-d7b017dd1ecc
- `FOR4PAYMENTS_SECRET_KEY`: ad6ab253-8ae1-454c-91f3-8ccb18933065
- `EXATO_API_TOKEN`: 268753a9b3a24819ae0f02159dee6724
- `INTEGRAFLUX_API_TOKEN`: 01eb31cf-8692-4869-9843-860260706c27
- `UTMIFY_API_TOKEN`: XAo52G3UkJ6ePs7Aq3UqHs32hvDPZ8rjUog4

### 5. Confirme e implante

- Revise as configurações
- Clique em "Apply" para iniciar o processo de deploy

### 6. Migração do banco de dados

Após o deploy inicial ser concluído, você precisará executar a migração do banco de dados:

1. Vá para o painel do seu web service
2. Clique na aba "Shell"
3. Execute o comando:

```
npm run db:push
```

## Solução de problemas comuns

### Erro na conexão com o banco de dados

Se você encontrar erros relacionados à conexão com o banco de dados:

1. Verifique se o banco de dados PostgreSQL está ativo
2. Certifique-se de que a URL do banco de dados está correta
3. Verifique se as configurações SSL estão corretas (o código já está configurado para isso)

### Problemas com as APIs

Se alguma das APIs externas não estiver funcionando:

1. Verifique se as variáveis de ambiente foram configuradas corretamente
2. Teste as APIs separadamente para verificar se estão respondendo

## Monitoramento

O Render oferece logs em tempo real e métricas de desempenho para seu aplicativo:

1. Acesse o painel do seu web service
2. Clique na aba "Logs" para ver os logs em tempo real
3. Use a aba "Metrics" para monitorar o desempenho