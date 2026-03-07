import axios from 'axios';

// Dynamically determine the base URL based on the current hostname
const getBaseUrl = () => {
    // If explicitly set via environment variable, use it
    if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;

    // In browser context, always point to the same hostname that served the frontend, 
    // but on port 3000 where the backend runs.
    // This allows LAN access (e.g., 192.168.x.x) to work automatically without hardcoding IPs.
    if (typeof window !== 'undefined') {
        const hostname = window.location.hostname;
        return `${window.location.protocol}//${hostname}:3000`;
    }

    return 'http://localhost:3000';
};

export const fluxClient = axios.create({
    baseURL: getBaseUrl(),
    headers: {
        'Content-Type': 'application/json',
    },
});

// ========================================
// INTERCEPTORS
// ========================================

// Request interceptor: attach JWT token to all requests
fluxClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('fluxo_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor: handle 401 (expired/invalid token) and Network Errors (Offline/Down)
fluxClient.interceptors.response.use(
    (response) => response,
    (error) => {
        // Pass through silent ping requests without firing global disruption events
        if (error.config?._isPingRequest) {
            return Promise.reject(error);
        }

        // 1. Connection dropped entirely or server unresponsive (e.g. timeout, DNS failure)
        if (error.code === 'ERR_NETWORK' || error.message === 'Network Error' || error.message?.includes('timeout')) {
            window.dispatchEvent(new Event('system-offline'));
        }

        // 2. Server returned an error, check if it's a fatal gateway/server down error
        if (error.response) {
            const status = error.response.status;

            if (status === 502 || status === 503 || status === 504) {
                window.dispatchEvent(new Event('system-offline'));
            }

            if (status === 401) {
                // Token expired or invalid - clear session and redirect to login
                const currentPath = window.location.pathname;
                if (currentPath !== '/login' && currentPath !== '/') {
                    localStorage.removeItem('fluxo_token');
                    localStorage.removeItem('fluxo_user');
                    window.location.href = '/login';
                }
            }
        }
        return Promise.reject(error);
    }
);

// ========================================
// API CLIENT
// ========================================

const createCrud = (resource) => ({
    list: (args) => {
        const config = {};
        if (typeof args === 'string') {
            config.params = { sort: args };
        } else if (typeof args === 'object' && args !== null) {
            config.params = args;
        }
        return fluxClient.get(`/${resource}`, config).then(res => res.data);
    },
    listPaginated: (args) => {
        const config = {};
        if (typeof args === 'object') {
            config.params = args;
        }
        return fluxClient.get(`/${resource}`, config).then(res => ({
            data: res.data,
            total: parseInt(res.headers['x-total-count'] || 0)
        }));
    },
    get: (id) => fluxClient.get(`/${resource}/${id}`).then(res => res.data),
    create: (data) => fluxClient.post(`/${resource}`, data).then(res => res.data),
    update: (id, data) => fluxClient.put(`/${resource}/${id}`, data).then(res => res.data),
    delete: (id) => fluxClient.delete(`/${resource}/${id}`).then(res => res.data),
});

export const fluxoApi = {
    entities: {
        Demand: createCrud('demands'),
        StatusHistory: createCrud('status_history'),
        Holiday: createCrud('holidays'),
        Cycle: createCrud('cycles'),
        Requester: createCrud('requesters'),
        User: createCrud('users'),
        Contract: createCrud('contracts'),
        FinanceContract: {
            ...createCrud('finance_contracts'),
            generateSchedule: (id) => fluxClient.post(`/contracts/${id}/generate-attestations`).then(res => res.data)
        },
        DeadlineContract: createCrud('deadline_contracts'),
        Invoice: createCrud('invoices'),
        MonthlyAttestation: createCrud('attestations'),
        Client: createCrud('clients'),
        Analyst: createCrud('analysts'),
        TermoConfirmacao: createCrud('termos_confirmacao'),
        StageHistory: createCrud('stage_history'),
    },
    demands: {
        reopenings: (demandId) => fluxClient.get(`/demands/${demandId}/reopenings`).then(res => res.data),
        redeliver: (demandId) => fluxClient.post(`/demands/${demandId}/redeliver`).then(res => res.data),
        clearHistory: (demandId) => fluxClient.delete(`/demands/${demandId}/history`).then(res => res.data),
    },
    auth: {
        login: (email, password) => fluxClient.post('/auth/login', { email, password }).then(res => res.data),
        me: () => fluxClient.get('/auth/me').then(res => res.data),
    },
    notifications: {
        list: (params) => fluxClient.get('/notifications', { params }).then(res => res.data),
        unreadCount: () => fluxClient.get('/notifications/unread-count').then(res => res.data),
        markRead: (id) => fluxClient.put(`/notifications/${id}/read`).then(res => res.data),
        markAllRead: () => fluxClient.put('/notifications/mark-all-read').then(res => res.data),
    },
    activity: {
        list: (params) => fluxClient.get('/activity-log', { params }).then(res => res.data),
    },
    integrations: {
        Core: {
            SendEmail: (data) => fluxClient.post('/integrations/email', data).then(res => res.data),
        }
    },
    metrics: {
        cdpc: (params) => fluxClient.get('/metrics/cdpc', { params }).then(res => res.data),
        cocr: () => fluxClient.get('/metrics/cocr').then(res => res.data),
    }
};

export default fluxoApi;
