import React, { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Building2, Layers, Calendar, UserCog, Database, X, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

// Components
import UserManagement from './Users';
import ClientsTab from './Settings/tabs/ClientsTab';
import CyclesTab from './Settings/tabs/CyclesTab';
import HolidaysTab from './Settings/tabs/HolidaysTab';
import ImportExportTab from './Settings/tabs/ImportExportTab';

export default function SettingsPage() {
    const [user, setUser] = useState(null);
    const [activeTab, setActiveTab] = useState('users');

    useEffect(() => {
        const stored = localStorage.getItem('fluxo_user');
        if (stored) {
            setUser(JSON.parse(stored));
        }
    }, []);

    const isAdmin = user?.role === 'admin' || user?.role === 'manager' || user?.role === 'general_manager' || user?.department === 'GOR';

    if (!isAdmin) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <Card className="max-w-md w-full border-0 shadow-lg bg-white/50 backdrop-blur-sm">
                    <CardContent className="p-8 text-center">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-in zoom-in duration-300">
                            <ShieldCheck className="w-8 h-8 text-red-500" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 mb-2">Acesso Restrito</h2>
                        <p className="text-slate-500">
                            Esta área é exclusiva para gestores e administradores do sistema.
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const tabTriggerClass = "data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm rounded-full px-6 py-2.5 transition-all duration-200 flex items-center gap-2 font-medium text-slate-600 hover:text-slate-900";

    return (
        <div className="min-h-screen bg-slate-50/50">
            {/* Hero Header */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                                <div className="p-2 bg-indigo-50 rounded-xl">
                                    <UserCog className="w-6 h-6 text-indigo-600" />
                                </div>
                                Administração do Sistema
                            </h1>
                            <p className="text-slate-500 mt-2 text-sm sm:text-base ml-14">
                                Central de controle para usuários, cadastros e configurações globais.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
                    {/* Navigation Bar */}
                    <div className="sticky top-[88px] z-10 -mx-4 px-4 pb-4 md:static md:mx-0 md:px-0 md:pb-0 overflow-x-auto bg-slate-50/95 backdrop-blur supports-[backdrop-filter]:bg-slate-50/50 md:bg-transparent">
                        <TabsList className="bg-slate-200/50 p-1.5 rounded-full inline-flex md:flex w-max md:w-full md:justify-start h-auto">
                            <TabsTrigger value="users" className={tabTriggerClass}>
                                <Users className="w-4 h-4" />
                                Usuários
                            </TabsTrigger>
                            <TabsTrigger value="clients" className={tabTriggerClass}>
                                <Building2 className="w-4 h-4" />
                                Clientes
                            </TabsTrigger>
                            <TabsTrigger value="cycles" className={tabTriggerClass}>
                                <Layers className="w-4 h-4" />
                                Ciclos
                            </TabsTrigger>
                            <TabsTrigger value="holidays" className={tabTriggerClass}>
                                <Calendar className="w-4 h-4" />
                                Feriados
                            </TabsTrigger>
                            <TabsTrigger value="import_export" className={tabTriggerClass}>
                                <Database className="w-4 h-4" />
                                Sistema
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    {/* Content Area */}
                    <div className="min-h-[500px] animate-in slide-in-from-bottom-4 duration-500 fade-in">
                        <TabsContent value="users" className="mt-0 focus-visible:outline-none">
                            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm overflow-hidden">
                                <CardContent className="p-0">
                                    <UserManagement isEmbedded={true} />
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="clients" className="mt-0 focus-visible:outline-none">
                            <Card className="border-0 shadow-lg bg-white">
                                <CardHeader className="border-b bg-slate-50/50">
                                    <CardTitle className="text-lg text-slate-800">Gerenciar Clientes</CardTitle>
                                    <CardDescription>Cadastre e edite as empresas clientes do sistema.</CardDescription>
                                </CardHeader>
                                <CardContent className="p-6">
                                    <ClientsTab />
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="cycles" className="mt-0 focus-visible:outline-none">
                            <Card className="border-0 shadow-lg bg-white">
                                <CardHeader className="border-b bg-slate-50/50">
                                    <CardTitle className="text-lg text-slate-800">Ciclos de Avaliação</CardTitle>
                                    <CardDescription>Configure os períodos de avaliação de desempenho.</CardDescription>
                                </CardHeader>
                                <CardContent className="p-6">
                                    <CyclesTab />
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="holidays" className="mt-0 focus-visible:outline-none">
                            <Card className="border-0 shadow-lg bg-white">
                                <CardHeader className="border-b bg-slate-50/50">
                                    <CardTitle className="text-lg text-slate-800">Calendário de Feriados</CardTitle>
                                    <CardDescription>Defina os dias não úteis para cálculo de prazos e SLAs.</CardDescription>
                                </CardHeader>
                                <CardContent className="p-6">
                                    <HolidaysTab />
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="import_export" className="mt-0 focus-visible:outline-none">
                            <Card className="border-0 shadow-lg bg-white">
                                <CardHeader className="border-b bg-slate-50/50">
                                    <CardTitle className="text-lg text-slate-800">Manutenção do Sistema</CardTitle>
                                    <CardDescription>Ferramentas para backup, restauração e limpeza de dados.</CardDescription>
                                </CardHeader>
                                <CardContent className="p-6">
                                    <ImportExportTab />
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </div>
                </Tabs>
            </div>
        </div>
    );
}
