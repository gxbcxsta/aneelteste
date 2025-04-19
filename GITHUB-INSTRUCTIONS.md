# Guia para enviar o código para o GitHub

Este guia explica como enviar seu código para o GitHub e prepará-lo para deploy no Render.

## Pré-requisitos

1. Ter uma conta no GitHub (crie uma em [github.com](https://github.com/))
2. Ter o Git instalado na sua máquina local
3. Ter as chaves SSH configuradas (opcional, mas recomendado)

## Passo 1: Criar um novo repositório no GitHub

1. Faça login no GitHub
2. Clique no botão "+" no canto superior direito
3. Selecione "New repository"
4. Preencha as informações:
   - Nome do repositório: "icms-restituicao" (ou o nome que preferir)
   - Descrição: "Sistema de restituição ICMS com geolocalização"
   - Visibilidade: Público ou Privado
   - **Importante**: Não inicialize o repositório com README, .gitignore ou license
5. Clique em "Create repository"

## Passo 2: Exportar o código do Replit

Para trabalhar com seu código fora do Replit, você precisa exportá-lo:

1. No Replit, clique nos três pontos (...) ao lado do botão "Run"
2. Selecione "Download as zip"
3. Descompacte o arquivo zip em uma pasta local no seu computador

## Passo 3: Inicializar o Git e fazer o primeiro commit

Navegue até a pasta descompactada e abra um terminal (prompt de comando) nessa pasta. Em seguida:

```bash
# Inicializar o repositório Git
git init

# Adicionar todos os arquivos (exceto os ignorados pelo .gitignore)
git add .

# Fazer o primeiro commit
git commit -m "Versão inicial do Sistema de Restituição ICMS"
```

## Passo 4: Conectar e enviar para o GitHub

Agora conecte seu repositório local ao repositório do GitHub:

```bash
# Substituir USERNAME pelo seu nome de usuário e REPO pelo nome do repositório
git remote add origin https://github.com/USERNAME/REPO.git

# Renomear a branch para main (padrão atual do GitHub)
git branch -M main

# Enviar o código para o GitHub
git push -u origin main
```

Você precisará inserir suas credenciais do GitHub para concluir o push.

## Passo 5: Verificar se o código foi enviado

1. Volte ao navegador e atualize a página do seu repositório GitHub
2. Você deverá ver todos os arquivos do projeto listados
3. O README.md será exibido automaticamente na página inicial

## Próximos passos

Agora que seu código está no GitHub, você pode:

1. Seguir as instruções no arquivo README-RENDER.md para fazer o deploy no Render
2. Configurar integrações contínuas (CI/CD) para automatizar o processo de deploy
3. Compartilhar o repositório com colaboradores (se necessário)

## Dicas adicionais

- **Branches**: Use branches para desenvolver novas funcionalidades sem afetar o código principal
- **Pull Requests**: Para projetos com mais de um colaborador, use Pull Requests para revisar mudanças
- **Issues**: Use o sistema de Issues do GitHub para rastrear bugs e melhorias
- **Actions**: Configure GitHub Actions para automação de tarefas