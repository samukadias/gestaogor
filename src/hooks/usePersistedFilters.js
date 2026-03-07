import { useState, useEffect } from 'react';

/**
 * Hook que mantém os filtros persistidos no sessionStorage.
 * Os filtros sobrevivem à navegação entre páginas, mas são limpos
 * quando o usuário fecha ou recarrega o browser.
 *
 * Parâmetros via URL (urlOverrides) sempre têm PRIORIDADE sobre
 * os valores salvos no sessionStorage. Isso garante que navegar
 * de um card do dashboard com ?vencimento=expiring aplique o filtro
 * correto, mesmo que o sessionStorage tenha um valor diferente salvo.
 *
 * @param {string} storageKey   - Chave única no sessionStorage (ex: "cocr_filters")
 * @param {object} defaultFilters - Valores padrão dos filtros
 * @param {object} [urlOverrides] - Filtros vindos da URL que prevalecem sobre sessionStorage
 * @returns {[object, function]} - [filters, setFilters] igual ao useState
 */
export function usePersistedFilters(storageKey, defaultFilters, urlOverrides = {}) {
    const [filters, setFilters] = useState(() => {
        // 1. Base: defaults
        let merged = { ...defaultFilters };

        // 2. Sobre os defaults, aplica o sessionStorage (se existir)
        try {
            const saved = sessionStorage.getItem(storageKey);
            if (saved) {
                merged = { ...merged, ...JSON.parse(saved) };
            }
        } catch {
            // sessionStorage indisponível ou JSON inválido → usa defaults
        }

        // 3. Por último, sobrescreve com os valores vindos da URL (máxima prioridade).
        //    Filtra apenas as chaves que têm valor real (não vazio/null).
        const validUrlOverrides = Object.fromEntries(
            Object.entries(urlOverrides).filter(([, v]) => v !== null && v !== undefined && v !== '')
        );
        merged = { ...merged, ...validUrlOverrides };

        return merged;
    });

    // Salva no sessionStorage sempre que os filtros mudarem
    useEffect(() => {
        try {
            sessionStorage.setItem(storageKey, JSON.stringify(filters));
        } catch {
            // sessionStorage pode estar indisponível (modo privado restrito, etc.)
        }
    }, [filters, storageKey]);

    return [filters, setFilters];
}
