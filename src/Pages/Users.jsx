import React, { useState } from 'react';
import { fluxoApi } from '@/api/fluxoClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Card, CardContent
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from "@/components/ui/dialog";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Loader2, Plus, Edit, Trash2, UserCog
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const MODULES = [
    { id: 'flow', label: 'Fluxo (Demandas)' },
    { id: 'finance', label: 'Financeiro' },
    { id: 'contracts', label: 'Contratos/Prazos' }
];

const DEPARTMENTS = [
    { value: 'GOR', label: 'GOR (Gerência Geral)' },
    { value: 'COCR', label: 'COCR (Contratos e Clientes)' },
    { value: 'CDPC', label: 'CDPC (Ciclo de Demandas)' },
    { value: 'CVAC', label: 'CVAC (Financeiro)' }
];

const ROLES = [
    { value: 'manager', label: 'Gestor' },
    { value: 'general_manager', label: 'Gerente' },
    { value: 'admin', label: 'Administrador' },
    { value: 'analyst', label: 'Analista' },
    { value: 'requester', label: 'Solicitante' },
    { value: 'client', label: 'Cliente' },
    { value: 'viewer', label: 'Visualizador Global (Somente Leitura)' }
];

export default function UserManagement({ isEmbedded = false }) {
    const queryClient = useQueryClient();
    const [showForm, setShowForm] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [activeTab, setActiveTab] = useState('CDPC');

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'analyst',
        department: 'CDPC',
        allowed_modules: ['flow']
    });

    // Auto-select modules based on Department
    const handleDepartmentChange = (dept) => {
        let modules = [];
        let defaultRole = 'analyst';

        switch (dept) {
            case 'GOR':
                modules = ['flow', 'finance', 'contracts'];
                defaultRole = 'manager';
                break;
            case 'COCR':
                modules = ['contracts'];
                break;
            case 'CDPC':
                modules = ['flow'];
                break;
            case 'CVAC':
                modules = ['finance'];
                break;
            default:
                modules = [];
        }

        setFormData(prev => ({
            ...prev,
            department: dept,
            allowed_modules: modules,
            role: defaultRole
        }));
    };

    const { data: users = [], isLoading } = useQuery({
        queryKey: ['users'],
        queryFn: () => fluxoApi.entities.User.list('-id')
    });

    const createMutation = useMutation({
        mutationFn: (data) => fluxoApi.entities.User.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            setShowForm(false);
            resetForm();
            toast.success("Usuário criado com sucesso!");
        },
        onError: (err) => toast.error("Erro ao criar usuário: " + (err.response?.data?.error || err.message))
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => fluxoApi.entities.User.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            setShowForm(false);
            resetForm();
            toast.success("Usuário atualizado com sucesso!");
        },
        onError: (err) => toast.error("Erro ao atualizar usuário: " + (err.response?.data?.error || err.message))
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => fluxoApi.entities.User.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            toast.success("Usuário excluído!");
        }
    });

    const resetForm = () => {
        setFormData({
            name: '',
            email: '',
            password: '',
            role: 'analyst',
            department: 'CDPC', // Default to common
            allowed_modules: ['flow']
        });
        setEditingUser(null);
    };

    const handleEdit = (user) => {
        setEditingUser(user);
        setFormData({
            name: user.name,
            email: user.email,
            password: user.password || '',
            role: user.role,
            department: user.department || 'CDPC',
            allowed_modules: user.allowed_modules || []
        });
        setShowForm(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.name || !formData.email || !formData.role || !formData.department) {
            toast.warning("Preencha todos os campos obrigatórios");
            return;
        }

        if (editingUser) {
            updateMutation.mutate({ id: editingUser.id, data: formData });
        } else {
            createMutation.mutate(formData);
        }
    };

    const toggleModule = (moduleId) => {
        setFormData(prev => {
            const current = prev.allowed_modules || [];
            if (current.includes(moduleId)) {
                return { ...prev, allowed_modules: current.filter(m => m !== moduleId) };
            } else {
                return { ...prev, allowed_modules: [...current, moduleId] };
            }
        });
    };

    const getRoleLabel = (role) => ROLES.find(r => r.value === role)?.label || role;
    const getModuleLabels = (mods) => {
        if (!mods || mods.length === 0) return 'Nenhum';
        return mods.map(m => MODULES.find(mod => mod.id === m)?.label || m).join(', ');
    };

    // Filter Logic
    const managers = users.filter(u => u.role === 'manager' || u.department === 'GOR');
    const cdpcUsers = users.filter(u => u.department === 'CDPC' && u.role !== 'manager');
    const cocrUsers = users.filter(u => u.department === 'COCR' && u.role !== 'manager');
    const cvacUsers = users.filter(u => u.department === 'CVAC' && u.role !== 'manager');
    const otherUsers = users.filter(u =>
        !['CDPC', 'COCR', 'CVAC', 'GOR'].includes(u.department) &&
        u.role !== 'manager'
    );

    const UserListTable = ({ data, emptyMsg }) => {
        const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });

        const sortedData = React.useMemo(() => {
            if (!data) return [];
            const sorted = [...data];
            sorted.sort((a, b) => {
                const aValue = (a[sortConfig.key] || '').toString().toLowerCase();
                const bValue = (b[sortConfig.key] || '').toString().toLowerCase();

                if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
            return sorted;
        }, [data, sortConfig]);

        const handleSort = (key) => {
            setSortConfig(current => ({
                key,
                direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
            }));
        };

        const SortIcon = ({ columnKey }) => {
            if (sortConfig.key !== columnKey) return <div className="w-4 h-4 ml-2" />;
            return sortConfig.direction === 'asc'
                ? <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
                : <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>;
        };

        return (
            <Card className="border-0 shadow-lg">
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50">
                                <TableHead
                                    className="cursor-pointer hover:bg-slate-100 transition-colors"
                                    onClick={() => handleSort('name')}
                                >
                                    <div className="flex items-center">
                                        Nome
                                        <SortIcon columnKey="name" />
                                    </div>
                                </TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Área</TableHead>
                                <TableHead>Perfil</TableHead>
                                <TableHead>Acesso aos Módulos</TableHead>
                                <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-10">
                                        <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-600" />
                                    </TableCell>
                                </TableRow>
                            ) : sortedData.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-10 text-slate-500">
                                        {emptyMsg}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                sortedData.map((user) => (
                                    <TableRow key={user.id} className="hover:bg-slate-50/50">
                                        <TableCell className="font-medium text-slate-900">{user.name}</TableCell>
                                        <TableCell>{user.email}</TableCell>
                                        <TableCell>
                                            <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-100">
                                                {user.department || '-'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="capitalize bg-slate-100">
                                                {getRoleLabel(user.role)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-sm text-slate-600">
                                            {getModuleLabels(user.allowed_modules)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button size="icon" variant="ghost" onClick={() => handleEdit(user)}>
                                                    <Edit className="w-4 h-4 text-slate-600" />
                                                </Button>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    onClick={() => {
                                                        if (confirm('Tem certeza que deseja excluir este usuário?')) deleteMutation.mutate(user.id);
                                                    }}
                                                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
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
        );
    };

    return (
        <div className={cn("space-y-6", !isEmbedded && "p-6 max-w-7xl mx-auto")}>
            {!isEmbedded ? (
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
                            <UserCog className="w-8 h-8 text-indigo-600" />
                            Gerenciamento de Usuários
                        </h1>
                        <p className="text-slate-600">Controle de acesso, perfis e permissões do sistema.</p>
                    </div>
                    <Button onClick={() => { resetForm(); setShowForm(true); }} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                        <Plus className="w-4 h-4 mr-2" />
                        Novo Usuário
                    </Button>
                </div>
            ) : (
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-slate-800">Usuários do Sistema</h2>
                    <Button onClick={() => { resetForm(); setShowForm(true); }} size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm">
                        <Plus className="w-4 h-4 mr-2" />
                        Novo Usuário
                    </Button>
                </div>
            )}

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="w-full justify-start bg-slate-100 p-1 rounded-lg mb-6 overflow-x-auto">
                    <TabsTrigger value="CDPC">CDPC (Demandas)</TabsTrigger>
                    <TabsTrigger value="COCR">COCR (Contratos)</TabsTrigger>
                    <TabsTrigger value="CVAC">CVAC (Financeiro)</TabsTrigger>
                    <TabsTrigger value="MANAGEMENT" className="text-indigo-700">GERENCIAL</TabsTrigger>
                    <TabsTrigger value="OTHERS">Não Atribuídos</TabsTrigger>
                </TabsList>

                <TabsContent value="CDPC">
                    <UserListTable data={cdpcUsers} emptyMsg="Nenhum usuário do CDPC encontrado." />
                </TabsContent>
                <TabsContent value="COCR">
                    <UserListTable data={cocrUsers} emptyMsg="Nenhum usuário do COCR encontrado." />
                </TabsContent>
                <TabsContent value="CVAC">
                    <UserListTable data={cvacUsers} emptyMsg="Nenhum usuário do CVAC encontrado." />
                </TabsContent>
                <TabsContent value="MANAGEMENT">
                    <UserListTable data={managers} emptyMsg="Nenhum gestor encontrado." />
                </TabsContent>
                <TabsContent value="OTHERS">
                    <UserListTable data={otherUsers} emptyMsg="Todos os usuários estão categorizados." />
                </TabsContent>
            </Tabs>

            <Dialog open={showForm} onOpenChange={setShowForm}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>{editingUser ? 'Editar Usuário' : 'Novo Usuário'}</DialogTitle>
                        <DialogDescription>
                            Configure a área e o perfil de acesso do colaborador.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nome Completo</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                required
                                placeholder="Ex: João da Silva"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">Email de Login</Label>
                            <Input
                                id="email"
                                type="email"
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                required
                                placeholder="email@exemplo.com"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">Senha</Label>
                            <Input
                                id="password"
                                type="text"
                                value={formData.password}
                                onChange={e => setFormData({ ...formData, password: e.target.value })}
                                placeholder={editingUser ? "Deixe em branco para manter a atual" : "Senha de acesso"}
                                required={!editingUser}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="department">Área (Departamento)</Label>
                                <Select
                                    value={formData.department}
                                    onValueChange={handleDepartmentChange}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione a área" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {DEPARTMENTS.map(dept => (
                                            <SelectItem key={dept.value} value={dept.value}>
                                                {dept.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="role">Perfil</Label>
                                <Select
                                    value={formData.role}
                                    onValueChange={(val) => setFormData({ ...formData, role: val })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione o perfil" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {ROLES.map(role => (
                                            <SelectItem key={role.value} value={role.value}>
                                                {role.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Módulos Permitidos (Automático)</Label>
                            <div className="grid gap-2 border rounded-md p-3 bg-slate-50">
                                {MODULES.map(mod => (
                                    <div key={mod.id} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={`mod-${mod.id}`}
                                            checked={(formData.allowed_modules || []).includes(mod.id)}
                                            onCheckedChange={() => toggleModule(mod.id)}
                                            disabled
                                        />
                                        <Label
                                            htmlFor={`mod-${mod.id}`}
                                            className="text-sm font-medium leading-none opacity-70"
                                        >
                                            {mod.label}
                                        </Label>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 mt-4">
                            <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="bg-indigo-600 text-white hover:bg-indigo-700">
                                {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                Salvar Usuário
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
