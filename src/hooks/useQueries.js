/**
 * useQueries.js — Central React Query hooks for the FluxoProd application.
 *
 * Pattern:
 *  - useXxxQuery(params)   → read-only queries (useQuery)
 *  - useXxxMutation()      → write operations (useMutation) with cache invalidation
 *
 * Query Keys follow the format: [resource, params] — consistent across the app.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fluxoApi } from '@/api/fluxoClient';

// ============================================================
// QUERY KEY FACTORIES (prevents typos and aids invalidation)
// ============================================================
export const queryKeys = {
    demands: (params) => ['demands', params],
    demand: (id) => ['demands', id],
    clients: () => ['clients'],
    analysts: () => ['analysts'],
    cycles: () => ['cycles'],
    users: () => ['users'],
    notifications: (params) => ['notifications', params],
    cdpcMetrics: (params) => ['metrics', 'cdpc', params],
    cocrMetrics: () => ['metrics', 'cocr'],
    demandHistory: (id) => ['status_history', id],
    stageHistory: (id) => ['stage_history', id],
    reopenings: (id) => ['reopenings', id],
    activityLog: (params) => ['activity_log', params],
};

// ============================================================
// DEMANDS
// ============================================================

/** List demands with optional filters and pagination */
export function useDemandsQuery(params = {}) {
    return useQuery({
        queryKey: queryKeys.demands(params),
        queryFn: () => fluxoApi.entities.Demand.listPaginated(params),
    });
}

/** Single demand by id */
export function useDemandQuery(id) {
    return useQuery({
        queryKey: queryKeys.demand(id),
        queryFn: () => fluxoApi.entities.Demand.get(id),
        enabled: !!id,
    });
}

/** Create demand */
export function useCreateDemandMutation() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data) => fluxoApi.entities.Demand.create(data),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['demands'] }),
    });
}

/** Update demand */
export function useUpdateDemandMutation(id) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data) => fluxoApi.entities.Demand.update(id, data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: queryKeys.demand(id) });
            qc.invalidateQueries({ queryKey: ['demands'] });
        },
    });
}

/** Delete demand */
export function useDeleteDemandMutation() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id) => fluxoApi.entities.Demand.delete(id),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['demands'] }),
    });
}

// ============================================================
// REFERENCE DATA (long-lived, rarely changes)
// ============================================================

export function useClientsQuery() {
    return useQuery({
        queryKey: queryKeys.clients(),
        queryFn: () => fluxoApi.entities.Client.list(),
        staleTime: 15 * 60 * 1000, // 15 min — clients don't change often
    });
}

export function useAnalystsQuery() {
    return useQuery({
        queryKey: queryKeys.analysts(),
        queryFn: () => fluxoApi.entities.Analyst.list(),
        staleTime: 15 * 60 * 1000,
    });
}

export function useCyclesQuery() {
    return useQuery({
        queryKey: queryKeys.cycles(),
        queryFn: () => fluxoApi.entities.Cycle.listPaginated({ limit: 100 }).then(r => r.data),
        staleTime: 15 * 60 * 1000,
    });
}

export function useUsersQuery(params = {}) {
    return useQuery({
        queryKey: queryKeys.users(),
        queryFn: () => fluxoApi.entities.User.list(params),
        staleTime: 15 * 60 * 1000,
    });
}

// ============================================================
// METRICS (Dashboard Gerencial)
// ============================================================

export function useCdpcMetricsQuery(params = {}) {
    // Build clean params — remove empty keys to avoid backend confusion
    const cleanParams = Object.fromEntries(
        Object.entries(params).filter(([, v]) => v !== '' && v !== null && v !== undefined)
    );
    return useQuery({
        queryKey: queryKeys.cdpcMetrics(cleanParams),
        queryFn: () => fluxoApi.metrics.cdpc(cleanParams),
        staleTime: 2 * 60 * 1000, // 2 min — metrics change more often
    });
}

export function useCocrMetricsQuery() {
    return useQuery({
        queryKey: queryKeys.cocrMetrics(),
        queryFn: () => fluxoApi.metrics.cocr(),
        staleTime: 2 * 60 * 1000,
    });
}

// ============================================================
// DEMAND DETAIL — history and reopenings
// ============================================================

export function useStatusHistoryQuery(demandId) {
    return useQuery({
        queryKey: queryKeys.demandHistory(demandId),
        queryFn: () => fluxoApi.entities.StatusHistory.list({ demand_id: demandId }),
        enabled: !!demandId,
    });
}

export function useStageHistoryQuery(demandId) {
    return useQuery({
        queryKey: queryKeys.stageHistory(demandId),
        queryFn: () => fluxoApi.entities.StageHistory.list({ demand_id: demandId }),
        enabled: !!demandId,
    });
}

export function useReopeningsQuery(demandId) {
    return useQuery({
        queryKey: queryKeys.reopenings(demandId),
        queryFn: () => fluxoApi.demands.reopenings(demandId),
        enabled: !!demandId,
    });
}

// ============================================================
// NOTIFICATIONS
// ============================================================

export function useNotificationsQuery(params = {}) {
    return useQuery({
        queryKey: queryKeys.notifications(params),
        queryFn: () => fluxoApi.notifications.list(params),
        refetchInterval: 60 * 1000, // auto-refresh every 60s
    });
}

export function useMarkNotificationReadMutation() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id) => fluxoApi.notifications.markRead(id),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
    });
}

export function useMarkAllNotificationsReadMutation() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: () => fluxoApi.notifications.markAllRead(),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
    });
}

// ============================================================
// ACTIVITY LOG
// ============================================================

export function useActivityLogQuery(params = {}) {
    return useQuery({
        queryKey: queryKeys.activityLog(params),
        queryFn: () => fluxoApi.activity.list(params),
    });
}
