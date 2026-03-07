# Gestão GOR - Sistema de Gestão de Demandas

Sistema de gestão de demandas (CDPC/CVAC) com dashboard interativo, controle de etapas e SLA.

## 🚀 Tecnologias

- **Frontend**: React + Vite + TailwindCSS + Shadcn/ui
- **Backend**: Node.js + Express
- **Banco de Dados**: PostgreSQL

## 📋 Pré-requisitos

- Node.js (v18+)
- PostgreSQL (v14+)
- Git

## 🛠️ Instalação

1. **Clone o repositório**
   ```bash
   git clone https://github.com/samukadias/gestaogor.git
   cd gestaogor
   ```

2. **Instale as dependências**
   ```bash
   # Instalar dependências do Frontend (Raiz)
   npm install

   # Instalar dependências do Backend
   cd server
   npm install
   cd ..
   ```

## ⚙️ Configuração

1. **Banco de Dados**
   - Crie um banco de dados no PostgreSQL chamado `fluxo_prod` (ou outro nome de sua preferência).
   - O sistema cria as tabelas automaticamente na primeira execução, mas certifique-se que o banco existe.

2. **Variáveis de Ambiente**
   - Crie um arquivo `.env` dentro da pasta `server/` com o seguinte conteúdo:
     ```env
     DB_USER=seu_usuario_postgres
     DB_HOST=localhost
     DB_NAME=fluxo_prod
     DB_PASSWORD=sua_senha
     DB_PORT=5432
     PORT=3000
     NODE_ENV=development
     ```

## ▶️ Como Rodar

Você precisa rodar o Backend e o Frontend simultaneamente. Recomendo usar dois terminais.

**Terminal 1 (Backend - Servidor)**
```bash
cd server
npm start
# O servidor rodará em http://localhost:3000
```

**Terminal 2 (Frontend - Interface)**
```bash
npm run dev
# O frontend rodará em http://localhost:5173
```

## 🔒 Segurança e Features (P1-P3)

Este projeto implementa diversas melhorias de segurança e performance:
- **Proteção SQL Injection**: Whitelist de campos para ordenação.
- **Validação**: Middleware para validar paginação e JSON.
- **Transações**: Atualizações de demanda são atômicas (com rollback).
- **Sanitização de Erros**: Detalhes internos escondidos em produção.
- **Logs Limpos**: Debug logs apenas em ambiente de desenvolvimento.

## 📄 Estrutura

- `/src` - Código fonte do Frontend (React)
- `/server` - Código fonte do Backend (Express API)
- `/server/db.js` - Configuração de conexão com banco de dados
- `/server/index.js` - Rotas da API e lógica de negócio

---
Desenvolvido por Samuka Dias
