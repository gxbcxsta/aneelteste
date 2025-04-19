#!/usr/bin/env bash
# Script de build para o Render

# Instala todas as dependências, incluindo as de desenvolvimento
npm install --include=dev

# Executa o build
npm run build

# O código de saída deste script será usado pelo Render
exit 0