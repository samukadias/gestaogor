import React, { useState } from 'react';
import { fluxoApi } from '@/api/fluxoClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit2, Trash2, Layers, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function CyclesTab() {
    const queryClient = useQueryClient();
    const [showForm, setShowForm] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [formData, setFormData] = useState({});

    // Query
    const { data: cycles = [], isLoading } = useQuery({
        queryKey: ['cycles'],
        queryFn: () => fluxoApi.entities.Cycle.list()
    });

    // Mutations
    const createMutation = useMutation({
        mutationFn: (data) => fluxoApi.entities.Cycle.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cycles'] });
            setShowForm(false);
            setFormData({});
            toast.success('Ciclo criado com sucesso!');
        },
        onError: (err) => toast.error("Erro ao criar: " + (err.response?.data?.error || err.message))
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => fluxoApi.entities.Cycle.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cycles'] });
            setShowForm(false);
            setEditItem(null);
            setFormData({});
            toast.success('Ciclo atualizado!');
        },
        onError: (err) => toast.error("Erro ao atualizar: " + (err.response?.data?.error || err.message))
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => fluxoApi.entities.Cycle.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cycles'] });
            toast.success('Ciclo excluído!');
        },
        onError: (err) => toast.error("Erro ao excluir: " + (err.response?.data?.error || err.message))
    });

    // Handlers
    const handleSave = () => {
        if (!formData.name) {
            toast.warning("Nome é obrigatório");
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
        setFormData(item || { active: true });
        setShowForm(true);
    };

    const handleDelete = (id) => {
        if (confirm('Deseja realmente excluir este ciclo?')) {
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

    return (
        <>
            <Card className="border-0 shadow-sm rounded-xl">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Layers className="w-5 h-5 text-indigo-600" />
                            Ciclos de Demanda
                        </CardTitle>
                        <CardDescription>
                            {cycles.length} registro(s) encontrado(s)
                        </CardDescription>
                    </div>
                    <Button onClick={() => openForm()} size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white">
                        <Plus className="w-4 h-4 mr-2" />
                        Adicionar
                    </Button>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="py-4">Nome</TableHead>
                                <TableHead className="py-4">Início</TableHead>
                                <TableHead className="py-4">Término</TableHead>
                                <TableHead className="py-4">Status</TableHead>
                                <TableHead className="py-4 w-24 text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-slate-400">
                                        <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                                    </TableCell>
                                </TableRow>
                            ) : cycles.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-slate-400">
                                        Nenhum ciclo cadastrado
                                    </TableCell>
                                </TableRow>
                            ) : (
                                cycles.map(cycle => (
                                    <TableRow key={cycle.id} className="hover:bg-slate-50">
                                        <TableCell className="py-3 font-medium">{cycle.name}</TableCell>
                                        <TableCell className="py-3">{formatDate(cycle.start_date)}</TableCell>
                                        <TableCell className="py-3">{formatDate(cycle.end_date)}</TableCell>
                                        <TableCell className="py-3">
                                            {cycle.active !== false
                                                ? <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-0">Ativo</Badge>
                                                : <Badge variant="secondary" className="text-slate-500">Inativo</Badge>
                                            }
                                        </TableCell>
                                        <TableCell className="py-3 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button variant="ghost" size="icon" onClick={() => openForm(cycle)} className="h-8 w-8">
                                                    <Edit2 className="w-4 h-4 text-slate-500" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDelete(cycle.id)}
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
                            {editItem ? 'Editar Ciclo' : 'Novo Ciclo'}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Nome do Ciclo *</Label>
                            <Input
                                value={formData.name || ''}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Ex: Ciclo 2024.1"
                                autoFocus
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Data Início</Label>
                                <Input
                                    type="date"
                                    value={formData.start_date || ''}
                                    onChange={e => setFormData({ ...formData, start_date: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Data Término</Label>
                                <Input
                                    type="date"
                                    value={formData.end_date || ''}
                                    onChange={e => setFormData({ ...formData, end_date: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-lg border border-slate-100">
                            <Switch
                                checked={formData.active !== false}
                                onCheckedChange={v => setFormData({ ...formData, active: v })}
                            />
                            <Label>Ciclo Ativo</Label>
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
