import React, { useState } from 'react';
import { fluxoApi } from '@/api/fluxoClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Calendar, Plus, Edit2, Trash2, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function HolidaysTab() {
    const queryClient = useQueryClient();
    const [showForm, setShowForm] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [formData, setFormData] = useState({});
    const [importingInfo, setImportingInfo] = useState(false);

    // Lista de feriados 2025-2026
    const NATIONAL_HOLIDAYS = [
        // 2025
        { name: "Confraternização Universal", date: "2025-01-01" },
        { name: "Carnaval", date: "2025-03-03" },
        { name: "Carnaval", date: "2025-03-04" },
        { name: "Sexta-feira Santa", date: "2025-04-18" },
        { name: "Páscoa", date: "2025-04-20" },
        { name: "Tiradentes", date: "2025-04-21" },
        { name: "Dia do Trabalho", date: "2025-05-01" },
        { name: "Corpus Christi", date: "2025-06-19" },
        { name: "Independência do Brasil", date: "2025-09-07" },
        { name: "Nossa Senhora Aparecida", date: "2025-10-12" },
        { name: "Finados", date: "2025-11-02" },
        { name: "Proclamação da República", date: "2025-11-15" },
        { name: "Natal", date: "2025-12-25" },
        // 2026
        { name: "Confraternização Universal", date: "2026-01-01" },
        { name: "Carnaval", date: "2026-02-16" },
        { name: "Carnaval", date: "2026-02-17" },
        { name: "Sexta-feira Santa", date: "2026-04-03" },
        { name: "Tiradentes", date: "2026-04-21" },
        { name: "Dia do Trabalho", date: "2026-05-01" },
        { name: "Corpus Christi", date: "2026-06-04" },
        { name: "Independência do Brasil", date: "2026-09-07" },
        { name: "Nossa Senhora Aparecida", date: "2026-10-12" },
        { name: "Finados", date: "2026-11-02" },
        { name: "Proclamação da República", date: "2026-11-15" },
        { name: "Natal", date: "2026-12-25" },
    ];

    // Query
    const { data: holidays = [], isLoading } = useQuery({
        queryKey: ['holidays'],
        queryFn: () => fluxoApi.entities.Holiday.list()
    });

    // Mutations
    const createMutation = useMutation({
        mutationFn: (data) => fluxoApi.entities.Holiday.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['holidays'] });
            setShowForm(false);
            setFormData({});
            toast.success('Feriado criado com sucesso!');
        },
        onError: (err) => toast.error("Erro ao criar: " + (err.response?.data?.error || err.message))
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => fluxoApi.entities.Holiday.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['holidays'] });
            setShowForm(false);
            setEditItem(null);
            setFormData({});
            toast.success('Feriado atualizado!');
        },
        onError: (err) => toast.error("Erro ao atualizar: " + (err.response?.data?.error || err.message))
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => fluxoApi.entities.Holiday.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['holidays'] });
            toast.success('Feriado excluído!');
        },
        onError: (err) => toast.error("Erro ao excluir: " + (err.response?.data?.error || err.message))
    });

    // Handlers
    const handleSave = () => {
        if (!formData.name || !formData.date) {
            toast.warning("Nome e Data são obrigatórios");
            return;
        }

        if (editItem) {
            updateMutation.mutate({ id: editItem.id, data: formData });
        } else {
            createMutation.mutate(formData);
        }
    };

    const openForm = (item = null) => {
        setEditItem(item);
        setFormData(item || {});
        setShowForm(true);
    };

    const handleDelete = (id) => {
        if (confirm('Deseja realmente excluir este feriado?')) {
            deleteMutation.mutate(id);
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        try {
            return format(parseISO(dateStr), 'dd/MM/yyyy', { locale: ptBR });
        } catch (e) {
            return dateStr;
        }
    };

    const handleImportHolidays = async () => {
        setImportingInfo(true);
        let count = 0;
        try {
            for (const h of NATIONAL_HOLIDAYS) {
                // Verifica duplicidade baseada na data
                const exists = holidays.some(existing => existing.date && existing.date.startsWith(h.date));
                if (!exists) {
                    await fluxoApi.entities.Holiday.create(h);
                    count++;
                }
            }
            if (count > 0) {
                queryClient.invalidateQueries({ queryKey: ['holidays'] });
                toast.success(`${count} feriados nacionais importados!`);
            } else {
                toast.info("Todos os feriados nacionais já estão cadastrados.");
            }
        } catch (e) {
            toast.error("Erro ao importar feriados");
        } finally {
            setImportingInfo(false);
        }
    };

    return (
        <>
            <Card className="border-0 shadow-sm rounded-xl">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-indigo-600" />
                            Feriados
                        </CardTitle>
                        <CardDescription>
                            {holidays.length} registro(s) encontrado(s)
                        </CardDescription>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleImportHolidays}
                            disabled={importingInfo}
                        >
                            {importingInfo ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Calendar className="w-4 h-4 mr-2" />}
                            Carregar Brasil (25/26)
                        </Button>
                        <Button onClick={() => openForm()} size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white">
                            <Plus className="w-4 h-4 mr-2" />
                            Adicionar
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="py-4">Nome do Feriado</TableHead>
                                <TableHead className="py-4">Data</TableHead>
                                <TableHead className="py-4 w-24 text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center py-8 text-slate-400">
                                        <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                                    </TableCell>
                                </TableRow>
                            ) : holidays.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center py-8 text-slate-400">
                                        Nenhum feriado cadastrado
                                    </TableCell>
                                </TableRow>
                            ) : (
                                holidays.map(holiday => (
                                    <TableRow key={holiday.id} className="hover:bg-slate-50">
                                        <TableCell className="py-3 font-medium">{holiday.name}</TableCell>
                                        <TableCell className="py-3">{formatDate(holiday.date)}</TableCell>
                                        <TableCell className="py-3 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button variant="ghost" size="icon" onClick={() => openForm(holiday)} className="h-8 w-8">
                                                    <Edit2 className="w-4 h-4 text-slate-500" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDelete(holiday.id)}
                                                    className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={showForm} onOpenChange={setShowForm}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>
                            {editItem ? 'Editar Feriado' : 'Novo Feriado'}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Nome do Feriado *</Label>
                            <Input
                                value={formData.name || ''}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Ex: Natal"
                                autoFocus
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Data *</Label>
                            <Input
                                type="date"
                                value={formData.date || ''}
                                onChange={e => setFormData({ ...formData, date: e.target.value })}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowForm(false)}>
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={createMutation.isPending || updateMutation.isPending}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white"
                        >
                            {(createMutation.isPending || updateMutation.isPending) && (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            )}
                            <Save className="w-4 h-4 mr-2" />
                            Salvar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
