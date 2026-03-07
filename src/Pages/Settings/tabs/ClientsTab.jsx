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
import { Plus, Edit2, Trash2, Building2, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function ClientsTab() {
    const queryClient = useQueryClient();
    const [showForm, setShowForm] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [formData, setFormData] = useState({});

    const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });

    // Query
    const { data: clients = [], isLoading } = useQuery({
        queryKey: ['clients'],
        queryFn: () => fluxoApi.entities.Client.list()
    });

    const sortedClients = React.useMemo(() => {
        if (!clients) return [];
        const sorted = [...clients];
        sorted.sort((a, b) => {
            const aValue = (a[sortConfig.key] || '').toString().toLowerCase();
            const bValue = (b[sortConfig.key] || '').toString().toLowerCase();

            if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
        return sorted;
    }, [clients, sortConfig]);

    const handleSort = (key) => {
        setSortConfig(current => ({
            key,
            direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const SortIcon = ({ columnKey }) => {
        if (sortConfig.key !== columnKey) return <div className="w-4 h-4" />;
        return sortConfig.direction === 'asc'
            ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
            : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>;
    };

    // Mutations
    const createMutation = useMutation({
        mutationFn: (data) => fluxoApi.entities.Client.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['clients'] });
            setShowForm(false);
            setFormData({});
            toast.success('Cliente cadastrado com sucesso!');
        },
        onError: (err) => toast.error("Erro ao criar: " + (err.response?.data?.error || err.message))
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => fluxoApi.entities.Client.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['clients'] });
            setShowForm(false);
            setEditItem(null);
            setFormData({});
            toast.success('Cliente atualizado!');
        },
        onError: (err) => toast.error("Erro ao atualizar: " + (err.response?.data?.error || err.message))
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => fluxoApi.entities.Client.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['clients'] });
            toast.success('Cliente excluído!');
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
        if (confirm('Deseja realmente excluir este cliente?')) {
            deleteMutation.mutate(id);
        }
    };

    return (
        <>
            <Card className="border-0 shadow-sm rounded-xl">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Building2 className="w-5 h-5 text-indigo-600" />
                            Clientes
                        </CardTitle>
                        <CardDescription>
                            {clients.length} registro(s) encontrado(s)
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
                                <TableHead
                                    className="py-4 cursor-pointer hover:bg-slate-50 transition-colors"
                                    onClick={() => handleSort('name')}
                                >
                                    <div className="flex items-center gap-2">
                                        Nome
                                        <SortIcon columnKey="name" />
                                    </div>
                                </TableHead>
                                <TableHead
                                    className="py-4 cursor-pointer hover:bg-slate-50 transition-colors"
                                    onClick={() => handleSort('sigla')}
                                >
                                    <div className="flex items-center gap-2">
                                        Sigla
                                        <SortIcon columnKey="sigla" />
                                    </div>
                                </TableHead>
                                <TableHead className="py-4">Status</TableHead>
                                <TableHead className="py-4 w-24 text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-8 text-slate-400">
                                        <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                                    </TableCell>
                                </TableRow>
                            ) : sortedClients.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-8 text-slate-400">
                                        Nenhum cliente cadastrado
                                    </TableCell>
                                </TableRow>
                            ) : (
                                sortedClients.map(client => (
                                    <TableRow key={client.id} className="hover:bg-slate-50">
                                        <TableCell className="py-3 font-medium">{client.name}</TableCell>
                                        <TableCell className="py-3 text-slate-500">{client.sigla || '-'}</TableCell>
                                        <TableCell className="py-3">
                                            {client.active !== false
                                                ? <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-0">Ativo</Badge>
                                                : <Badge variant="secondary" className="text-slate-500">Inativo</Badge>
                                            }
                                        </TableCell>
                                        <TableCell className="py-3 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button variant="ghost" size="icon" onClick={() => openForm(client)} className="h-8 w-8">
                                                    <Edit2 className="w-4 h-4 text-slate-500" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDelete(client.id)}
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
                            {editItem ? 'Editar Cliente' : 'Novo Cliente'}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Nome do Cliente *</Label>
                            <Input
                                value={formData.name || ''}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Nome da empresa"
                                autoFocus
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Sigla</Label>
                            <Input
                                value={formData.sigla || ''}
                                onChange={e => setFormData({ ...formData, sigla: e.target.value })}
                                placeholder="Ex: SP, RJ, MS..."
                            />
                        </div>
                        <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-lg border border-slate-100">
                            <Switch
                                checked={formData.active !== false}
                                onCheckedChange={v => setFormData({ ...formData, active: v })}
                            />
                            <Label>Cadastro Ativo</Label>
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
