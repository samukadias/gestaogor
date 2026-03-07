# Arquitetura Unificada: Fluxo, Financeiro e Contratos

Este documento descreve a nova estrutura de dados implementada para unificar os três sistemas.

## 1. Visão Geral
A unificação é baseada em um banco de dados compartilhado, onde a entidade **Contrato** serve como a "Verdade Única". Todos os outros módulos (Financeiro, Fluxo de Demandas) orbitam em torno do Contrato.

## 2. Estrutura de Dados (Schema)

### Tabela Central: `contracts`
Armazena os dados imutáveis e compartilhados do contrato.
- `id`: Identificador único.
- `contract_number`: Número visível do contrato (ex: "CTR-2024/001").
- `object`: Descrição do objeto.
- `status`: Estado global (Ativo, Suspenso, Finalizado).
- `current_balance`: Saldo financeiro atualizado.

### Tabela Módulo Financeiro: `invoices`
Gerencia o faturamento.
- `contract_id`: Vínculo com a tabela central.
- `invoice_number`: Nota fiscal.
- `amount`: Valor faturado.

### Tabela Módulo Fluxo (Existente): `demands`
Gerencia as solicitações operacionais.
- `contract_id`: **(Novo)** Vínculo com a tabela central. Agora toda demanda pertence a um contrato.
- `support_analyst_id`: **(Novo)** Analista de apoio.

### Tabela de Usuários e Permissões Unificadas: `users`
- `role`: Papel principal (Gerente, Analista).
- `allowed_modules`: **(Novo)** Lista de módulos que o usuário pode acessar.
    - Ex: `['flow', 'finance']` permite ver Fluxo e Financeiro, mas esconde Contratos.

## 3. Fluxo de Autenticação
1. O usuário faz login (`/auth/login`).
2. O Backend retorna o objeto do usuário incluindo `allowed_modules`.
3. O Frontend lê essa lista e renderiza apenas os menus laterais correspondentes.

## 4. Próximos Passos (Frontend)
Para completar a integração, o Frontend React deve:
1. Ler `user.allowed_modules` após o login.
2. Criar rotas protegidas (ex: `<ProtectedRoute module="finance">`).
3. Criar a tela de "Detalhes do Contrato" que exibe abas baseadas nessas permissões.
