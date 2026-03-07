export const createPageUrl = (path) => {
    // Simple helper to create page URLs. 
    // Modify this if you need to add a base path (e.g., /app/DemandDetail...)
    if (path.startsWith('/')) {
        return path;
    }
    return `/${path}`;
};

export const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(value);
};

export const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('pt-BR');
};
