import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
    return twMerge(clsx(inputs))
}

export const createPageUrl = (page) => {
    const routes = {
        "Dashboard": "/prazos",
        "Contracts": "/prazos/contratos",
        "NewContract": "/prazos/contratos/novo",
        "ViewContract": "/prazos/ver",
        "EditContract": "/prazos/contratos/editar",
        "Analysis": "/prazos/analise",
        "StageControl": "/prazos/etapas",
        "Search": "/prazos/contratos", // Fallback to list
        "DataManagement": "/prazos/gestao-dados",
        "Timeline": "/prazos", // Fallback
        "GestorDashboard": "/prazos",
        "TermosConfirmacao": "/prazos/contratos", // Not implemented yet separately
        "NewTC": "/prazos/contratos",
        "ViewTC": "/prazos/contratos",
        "EditTC": "/prazos/contratos",
        "Users": "/users",
        "UserManagement": "/users",
        "ClientDashboard": "/dashboard"
    };
    return routes[page] || "/";
};

export const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(value || 0);
};

export const formatCompactCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        notation: "compact",
        maximumFractionDigits: 2
    }).format(value || 0);
};
