# Database Schema

## analysts

| Column | Type | Nullable |
| :--- | :--- | :--- |
| `id` | integer | NO |
| `name` | character varying(255) | YES |
| `email` | character varying(255) | YES |
| `created_at` | timestamp without time zone | YES |

## clients

| Column | Type | Nullable |
| :--- | :--- | :--- |
| `id` | integer | NO |
| `name` | character varying(255) | NO |
| `sigla` | character varying(50) | YES |
| `active` | boolean | YES |
| `created_at` | timestamp without time zone | YES |

## confirmation_terms

| Column | Type | Nullable |
| :--- | :--- | :--- |
| `id` | integer | NO |
| `contrato_associado_pd` | character varying(255) | YES |
| `valor_total` | numeric | YES |
| `created_at` | timestamp without time zone | YES |
| `updated_at` | timestamp without time zone | YES |

## contracts

| Column | Type | Nullable |
| :--- | :--- | :--- |
| `id` | integer | NO |
| `contract_number` | character varying(50) | YES |
| `object` | text | YES |
| `company_name` | character varying(255) | YES |
| `start_date` | timestamp without time zone | YES |
| `end_date` | timestamp without time zone | YES |
| `total_value` | numeric | YES |
| `current_balance` | numeric | YES |
| `status` | character varying(50) | YES |
| `analista_responsavel` | character varying(255) | YES |
| `cliente` | character varying(255) | YES |
| `grupo_cliente` | character varying(255) | YES |
| `contrato` | character varying(100) | YES |
| `termo` | character varying(100) | YES |
| `status_vencimento` | character varying(50) | YES |
| `data_inicio_efetividade` | timestamp without time zone | YES |
| `data_fim_efetividade` | timestamp without time zone | YES |
| `data_limite_andamento` | timestamp without time zone | YES |
| `valor_contrato` | numeric | YES |
| `valor_faturado` | numeric | YES |
| `valor_cancelado` | numeric | YES |
| `valor_a_faturar` | numeric | YES |
| `valor_novo_contrato` | numeric | YES |
| `tipo_tratativa` | character varying(100) | YES |
| `tipo_aditamento` | character varying(100) | YES |
| `etapa` | text | YES |
| `objeto` | text | YES |
| `secao_responsavel` | character varying(100) | YES |
| `observacao` | text | YES |
| `numero_processo_sei_nosso` | character varying(100) | YES |
| `numero_processo_sei_cliente` | character varying(100) | YES |
| `contrato_cliente` | character varying(100) | YES |
| `contrato_anterior` | character varying(100) | YES |
| `numero_pnpp_crm` | character varying(100) | YES |
| `sei` | character varying(100) | YES |
| `contrato_novo` | character varying(100) | YES |
| `termo_novo` | character varying(100) | YES |
| `created_by` | character varying(255) | YES |
| `client_name` | character varying(255) | YES |
| `responsible_analyst` | character varying(255) | YES |
| `pd_number` | character varying(50) | YES |
| `sei_process_number` | character varying(50) | YES |
| `sei_send_area` | character varying(100) | YES |
| `esps` | jsonb | YES |
| `created_at` | timestamp without time zone | YES |

## cycles

| Column | Type | Nullable |
| :--- | :--- | :--- |
| `id` | integer | NO |
| `name` | character varying(255) | YES |

## deadline_contracts

| Column | Type | Nullable |
| :--- | :--- | :--- |
| `id` | integer | NO |
| `analista_responsavel` | character varying(255) | YES |
| `cliente` | character varying(255) | YES |
| `grupo_cliente` | character varying(255) | YES |
| `contrato` | character varying(255) | YES |
| `termo` | character varying(255) | YES |
| `status` | character varying(50) | YES |
| `status_vencimento` | character varying(50) | YES |
| `data_inicio_efetividade` | timestamp without time zone | YES |
| `data_fim_efetividade` | timestamp without time zone | YES |
| `data_limite_andamento` | timestamp without time zone | YES |
| `valor_contrato` | numeric | YES |
| `valor_faturado` | numeric | YES |
| `valor_cancelado` | numeric | YES |
| `valor_a_faturar` | numeric | YES |
| `valor_novo_contrato` | numeric | YES |
| `objeto` | text | YES |
| `tipo_tratativa` | character varying(255) | YES |
| `tipo_aditamento` | character varying(255) | YES |
| `etapa` | text | YES |
| `secao_responsavel` | character varying(255) | YES |
| `observacao` | text | YES |
| `numero_processo_sei_nosso` | character varying(255) | YES |
| `numero_processo_sei_cliente` | character varying(255) | YES |
| `contrato_cliente` | character varying(255) | YES |
| `contrato_anterior` | character varying(255) | YES |
| `numero_pnpp_crm` | character varying(255) | YES |
| `sei` | character varying(255) | YES |
| `contrato_novo` | character varying(255) | YES |
| `termo_novo` | character varying(255) | YES |
| `created_by` | character varying(255) | YES |
| `created_at` | timestamp without time zone | YES |
| `updated_at` | timestamp without time zone | YES |

## demands

| Column | Type | Nullable |
| :--- | :--- | :--- |
| `id` | integer | NO |
| `product` | character varying(255) | YES |
| `demand_number` | character varying(50) | YES |
| `status` | character varying(50) | YES |
| `artifact` | character varying(255) | YES |
| `complexity` | character varying(50) | YES |
| `weight` | integer | YES |
| `client_id` | integer | YES |
| `analyst_id` | integer | YES |
| `cycle_id` | integer | YES |
| `requester_id` | integer | YES |
| `created_date` | timestamp without time zone | YES |
| `qualification_date` | timestamp without time zone | YES |
| `expected_delivery_date` | timestamp without time zone | YES |
| `delivery_date` | timestamp without time zone | YES |
| `observation` | text | YES |
| `frozen_time_minutes` | integer | YES |
| `last_frozen_at` | timestamp without time zone | YES |
| `support_analyst_id` | integer | YES |
| `delivery_date_change_reason` | text | YES |
| `contract_id` | integer | YES |
| `stage` | character varying(50) | YES |

## finance_contracts

| Column | Type | Nullable |
| :--- | :--- | :--- |
| `id` | integer | NO |
| `client_name` | character varying(255) | NO |
| `pd_number` | character varying(50) | NO |
| `responsible_analyst` | character varying(255) | YES |
| `sei_process_number` | character varying(50) | YES |
| `sei_send_area` | character varying(100) | YES |
| `esps` | jsonb | YES |
| `created_at` | timestamp without time zone | YES |
| `updated_at` | timestamp without time zone | YES |

## holidays

| Column | Type | Nullable |
| :--- | :--- | :--- |
| `id` | integer | NO |
| `date` | timestamp without time zone | YES |
| `name` | character varying(255) | YES |

## invoices

| Column | Type | Nullable |
| :--- | :--- | :--- |
| `id` | integer | NO |
| `contract_id` | integer | YES |
| `invoice_number` | character varying(50) | YES |
| `amount` | numeric | YES |
| `issue_date` | timestamp without time zone | YES |
| `status` | character varying(50) | YES |

## monthly_attestations

| Column | Type | Nullable |
| :--- | :--- | :--- |
| `id` | integer | NO |
| `contract_id` | integer | YES |
| `client_name` | character varying(255) | YES |
| `pd_number` | character varying(50) | YES |
| `responsible_analyst` | character varying(255) | YES |
| `esp_number` | character varying(50) | YES |
| `reference_month` | character varying(10) | YES |
| `report_generation_date` | date | YES |
| `report_send_date` | date | YES |
| `attestation_return_date` | date | YES |
| `invoice_send_to_client_date` | date | YES |
| `invoice_number` | character varying(50) | YES |
| `billed_amount` | numeric | YES |
| `paid_amount` | numeric | YES |
| `invoice_send_date` | date | YES |
| `observations` | text | YES |
| `created_at` | timestamp without time zone | YES |
| `sei_process_number` | character varying(50) | YES |
| `sei_send_area` | character varying(100) | YES |

## requesters

| Column | Type | Nullable |
| :--- | :--- | :--- |
| `id` | integer | NO |
| `name` | character varying(255) | YES |
| `email` | character varying(255) | YES |

## stage_history

| Column | Type | Nullable |
| :--- | :--- | :--- |
| `id` | integer | NO |
| `demand_id` | integer | YES |
| `stage` | character varying(50) | YES |
| `entered_at` | timestamp without time zone | YES |
| `exited_at` | timestamp without time zone | YES |
| `duration_minutes` | integer | YES |
| `changed_by` | character varying(255) | YES |

## status_history

| Column | Type | Nullable |
| :--- | :--- | :--- |
| `id` | integer | NO |
| `demand_id` | integer | YES |
| `from_status` | character varying(50) | YES |
| `to_status` | character varying(50) | YES |
| `changed_at` | timestamp without time zone | YES |
| `time_in_previous_status_minutes` | integer | YES |
| `changed_by` | character varying(255) | YES |

## termos_confirmacao

| Column | Type | Nullable |
| :--- | :--- | :--- |
| `id` | integer | NO |
| `numero_tc` | character varying(50) | YES |
| `contrato_associado_pd` | character varying(50) | YES |
| `numero_processo` | character varying(50) | YES |
| `data_inicio_vigencia` | timestamp without time zone | YES |
| `data_fim_vigencia` | timestamp without time zone | YES |
| `valor_total` | numeric | YES |
| `objeto` | text | YES |
| `area_demandante` | character varying(100) | YES |
| `fiscal_contrato` | character varying(255) | YES |
| `gestor_contrato` | character varying(255) | YES |
| `created_by` | character varying(255) | YES |
| `created_at` | timestamp without time zone | YES |
| `updated_at` | timestamp without time zone | YES |

## users

| Column | Type | Nullable |
| :--- | :--- | :--- |
| `id` | integer | NO |
| `name` | character varying(255) | YES |
| `email` | character varying(255) | YES |
| `password` | character varying(255) | YES |
| `role` | character varying(50) | YES |
| `department` | character varying(50) | YES |
| `allowed_modules` | ARRAY | YES |
| `profile_type` | character varying(50) | YES |

