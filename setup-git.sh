#!/bin/bash

# Inicializar repositório Git
git init

# Adicionar todos os arquivos ao Git (exceto os que estão no .gitignore)
git add .

# Fazer o primeiro commit
git commit -m "Versão inicial do Sistema de Restituição ICMS"

# Configurar o repositório remoto (substitua a URL pelo seu repositório GitHub)
echo "Agora você precisa criar um repositório no GitHub e executar o comando abaixo:"
echo "git remote add origin https://github.com/SEU-USUARIO/SEU-REPOSITORIO.git"
echo "git branch -M main"
echo "git push -u origin main"