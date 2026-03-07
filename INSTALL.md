# Guia de Instalação do Fluxo Prod (Com Backup)

Este guia descreve o passo a passo para instalar e rodar a aplicação "Fluxo Prod" em uma máquina limpa, restaurando os dados do backup.

## Pré-requisitos

Antes de começar, certifique-se de que você tem instalado:

1.  **Node.js** (Versão 18 ou superior)
    *   Baixe e instale: [https://nodejs.org/](https://nodejs.org/)
2.  **Git**
    *   Baixe e instale: [https://git-scm.com/](https://git-scm.com/)
3.  **PostgreSQL** (Banco de Dados)
    *   Baixe e instale: [https://www.postgresql.org/download/windows/](https://www.postgresql.org/download/windows/)
    *   Anote a **senha** que você definiu para o usuário `postgres`.

---

## 1. Clonar o Projeto

Abra o terminal (PowerShell ou Git Bash) e clone o repositório:

```bash
git clone https://github.com/samukadias/fluxoProd.git
cd fluxoProd
```

---

## 2. Configurar o Banco de Dados (Restaurar Backup)

**IMPORTANTE**: Copie o arquivo `full_backup.sql` que foi gerado na máquina original para a pasta `fluxoProd` da nova máquina.

1.  Abra o **pgAdmin** ou terminal `psql`.
2.  Crie o banco de dados:
    ```sql
    CREATE DATABASE fluxo_prod;
    ```
3.  **Restaurar os dados**:
    *   No pgAdmin: Clique com botão direito no banco `fluxo_prod` > **Query Tool**.
    *   Clique em "Open File" (ícone de pasta), selecione o `full_backup.sql` e clique em "Execute" (ícone de Play).
    
    *ou via terminal:*
    ```bash
    psql -U postgres -d fluxo_prod -f full_backup.sql
    ```

Isso criará todas as tabelas e usuários automaticamente!

---

## 3. Configurar o Backend (Servidor)

1.  Navegue até a pasta do servidor:
    ```bash
    cd server
    ```
2.  Instale as dependências:
    ```bash
    npm install
    ```
3.  Crie o arquivo de configuração `.env` na pasta `server/`:
    ```env
    PORT=3000
    DB_USER=postgres
    DB_HOST=localhost
    DB_NAME=fluxo_prod
    DB_PASSWORD=sua_senha_do_postgres
    DB_PORT=5432
    ```
4.  Inicie o servidor:
    ```bash
    node index.js
    ```

---

## 4. Configurar o Frontend (Interface)

1.  Abra um **novo terminal** na raiz (`fluxoProd`).
2.  Instale e rode:
    ```bash
    npm install
    npm run dev
    ```

Agora acesse pelo navegador. Seus usuários e dados antigos já estarão lá!
