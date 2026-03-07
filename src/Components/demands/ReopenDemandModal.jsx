import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

const API_BASE = `${window.location.protocol}//${window.location.hostname}:3000`;

const fetchActiveReasons = async () => {
    const token = localStorage.getItem('fluxo_token');
    const res = await fetch(`${API_BASE}/reopening-reasons`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Erro ao carregar motivos');
    return res.json();
};

const postReopen = async ({ demandId, reason_id, detail }) => {
    const token = localStorage.getItem('fluxo_token');
    const res = await fetch(`${API_BASE}/demands/${demandId}/reopen`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ reason_id, detail })
    });
    if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'Erro ao reabrir demanda'); }
    return res.json();
};

/**
 * ReopenDemandModal
 * Props:
 *   open: boolean
 *   onOpenChange: (bool) => void
 *   demandId: string | number
 *   demandName: string
 *   onSuccess: () => void
 */
export default function ReopenDemandModal({ open, onOpenChange, demandId, demandName, onSuccess }) {
    const queryClient = useQueryClient();
    const [selectedReasonId, setSelectedReasonId] = useState('');
    const [detail, setDetail] = useState('');

    const { data: reasons = [], isLoading: loadingReasons } = useQuery({
        queryKey: ['reopening-reasons'],
        queryFn: fetchActiveReasons,
        enabled: open
    });

    const reopenMutation = useMutation({
        mutationFn: postReopen,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['demand', String(demandId)] });
            queryClient.invalidateQueries({ queryKey: ['history', String(demandId)] });
            queryClient.invalidateQueries({ queryKey: ['reopenings', String(demandId)] });
            queryClient.invalidateQueries({ queryKey: ['demands'] });
            toast.success('Demanda reaberta com sucesso!');
            setSelectedReasonId('');
            setDetail('');
            onOpenChange(false);
            if (onSuccess) onSuccess();
        },
        onError: (err) => toast.error(err.message)
    });

    const handleConfirm = () => {
        if (!selectedReasonId) return toast.error('Selecione um motivo de reabertura.');
        reopenMutation.mutate({ demandId, reason_id: parseInt(selectedReasonId), detail });
    };

    const handleClose = () => {
        if (reopenMutation.isPending) return;
        setSelectedReasonId('');
        setDetail('');
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-amber-700">
                        <RotateCcw className="w-5 h-5" />
                        Reabrir Demanda
                    </DialogTitle>
                    <DialogDescription>
                        <span className="font-medium text-slate-700">"{demandName}"</span>
                        <br />
                        O status será alterado para <span className="font-semibold text-amber-700">REABERTA</span>.
                        Informe o motivo abaixo.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    <div className="space-y-1.5">
                        <Label htmlFor="reason-select" className="text-sm font-medium text-slate-700">
                            Motivo da reabertura <span className="text-red-500">*</span>
                        </Label>
                        {loadingReasons ? (
                            <div className="flex items-center gap-2 text-sm text-slate-400 py-2">
                                <Loader2 className="w-4 h-4 animate-spin" /> Carregando motivos...
                            </div>
                        ) : (
                            <Select
                                value={selectedReasonId}
                                onValueChange={setSelectedReasonId}
                            >
                                <SelectTrigger id="reason-select" className="w-full">
                                    <SelectValue placeholder="Selecione um motivo..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {reasons.map((r) => (
                                        <SelectItem key={r.id} value={String(r.id)}>
                                            {r.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="reopen-detail" className="text-sm font-medium text-slate-700">
                            Observação <span className="text-slate-400 font-normal">(opcional)</span>
                        </Label>
                        <Textarea
                            id="reopen-detail"
                            placeholder="Descreva o problema ou o que precisa ser corrigido..."
                            value={detail}
                            onChange={(e) => setDetail(e.target.value)}
                            rows={3}
                            className="resize-none"
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={handleClose} disabled={reopenMutation.isPending}>
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        disabled={!selectedReasonId || reopenMutation.isPending}
                        className="bg-amber-600 hover:bg-amber-700 text-white"
                    >
                        {reopenMutation.isPending ? (
                            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Reabrindo...</>
                        ) : (
                            <><RotateCcw className="w-4 h-4 mr-2" /> Confirmar Reabertura</>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
