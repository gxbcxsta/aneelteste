# Sistema de Restituição ICMS

Aplicação web para cálculo e processamento de restituições de ICMS com geolocalização por IP.

## Recursos

- Verificação de CPF e cálculo preciso de restituição
- Detecção automática de localização via IP
- Integração com APIs de pagamento (For4Payments)
- Verificação de identidade por SMS (IntegraFlux)
- Rastreamento de visitantes e análise de tráfego
- Interface moderna e responsiva com React
- Banco de dados PostgreSQL com Drizzle ORM

## Tecnologias

- **Frontend**: React, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Node.js, Express
- **Banco de dados**: PostgreSQL
- **ORM**: Drizzle
- **Integrações**:
  - For4Payments (Pagamentos PIX)
  - IntegraFlux (Verificação SMS)
  - APIs de geolocalização
  - ViaCEP (Consulta de endereços)
  - Exato Digital (Verificação de CPF)

## Instalação e Configuração

### Pré-requisitos

- Node.js 18+
- PostgreSQL

### Instalação

1. Clone este repositório
2. Instale as dependências:
   ```
   npm install
   ```
3. Configure as variáveis de ambiente em um arquivo `.env`
4. Execute as migrações do banco de dados:
   ```
   npm run db:push
   ```
5. Inicie o servidor de desenvolvimento:
   ```
   npm run dev
   ```

## Variáveis de Ambiente

```
DATABASE_URL=postgresql://usuario:senha@localhost:5432/nome_do_banco
FOR4PAYMENTS_PUBLIC_KEY=chave_publica
FOR4PAYMENTS_SECRET_KEY=chave_secreta
EXATO_API_TOKEN=token_api
INTEGRAFLUX_API_TOKEN=token_api
UTMIFY_API_TOKEN=token_api
```

## Deploy

Este projeto está configurado para deploy no Render. Consulte o arquivo [README-RENDER.md](README-RENDER.md) para instruções detalhadas de deploy.