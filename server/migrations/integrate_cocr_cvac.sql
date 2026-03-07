-- Função para atualizar o valor faturado no contrato quando uma atestação for inserida, atualizada ou excluída.
CREATE OR REPLACE FUNCTION function_update_contract_billed_amount() RETURNS TRIGGER AS $$ BEGIN IF (TG_OP = 'DELETE') THEN
UPDATE contracts
SET valor_faturado = (
        SELECT COALESCE(SUM(billed_amount), 0)
        FROM monthly_attestations
        WHERE contract_id = OLD.contract_id
    )
WHERE id = OLD.contract_id;
RETURN OLD;
ELSE
UPDATE contracts
SET valor_faturado = (
        SELECT COALESCE(SUM(billed_amount), 0)
        FROM monthly_attestations
        WHERE contract_id = NEW.contract_id
    )
WHERE id = NEW.contract_id;
RETURN NEW;
END IF;
END;
$$ LANGUAGE plpgsql;
-- Remove a trigger anterior (se existir) para evitar duplicação.
DROP TRIGGER IF EXISTS trigger_update_contract_billed_amount ON monthly_attestations;
-- Cria o gatilho.
CREATE TRIGGER trigger_update_contract_billed_amount
AFTER
INSERT
    OR
UPDATE
    OR DELETE ON monthly_attestations FOR EACH ROW EXECUTE FUNCTION function_update_contract_billed_amount();