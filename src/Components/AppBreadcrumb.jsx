import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import {
    Breadcrumb,
    BreadcrumbList,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Home } from "lucide-react";

const routeNames = {
    'dashboard': 'Dashboard CDPC',
    'demands': 'Demandas CDPC',
    'demand-detail': 'Detalhes da Demanda',
    'financeiro': 'Dashboard CVAC',
    'contratos': 'Contratos',
    'atestacoes': 'Medições',
    'prazos': 'Dashboard COCR',
    'ver': 'Visualizar',
    'analise': 'Análise',
    'etapas': 'Controle de Etapas',
    'gestao-dados': 'Gestão de Dados',
    'pesquisa': 'Pesquisa',
    'novo': 'Novo',
    'editar': 'Editar',
    'gerencial': 'Visão Executiva',
    'admin': 'Administração',
    'monitor': 'Monitor do Sistema',
    'settings': 'Configurações',
    'atividades': 'Atividades'
};

export default function AppBreadcrumb() {
    const location = useLocation();
    const pathnames = location.pathname.split('/').filter((x) => x);

    // Não renderizar em tela de login ou na raiz limpa
    if (pathnames.length === 0 || pathnames[0] === 'login') return null;

    return (
        <div className="px-6 pt-4 pb-2 hidden md:block">
            <Breadcrumb>
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink asChild>
                            <Link to="/" className="flex items-center gap-1 text-slate-500 hover:text-indigo-600 transition-colors">
                                <Home className="w-3.5 h-3.5" />
                            </Link>
                        </BreadcrumbLink>
                    </BreadcrumbItem>
                    {pathnames.map((value, index) => {
                        const last = index === pathnames.length - 1;
                        const to = `/${pathnames.slice(0, index + 1).join('/')}`;
                        const isId = value.match(/^[0-9A-Fa-f-]+$/) && value.length >= 1;

                        // Format name
                        let name = routeNames[value];
                        if (!name) {
                            if (isId) {
                                name = `#${value.substring(0, 8)}`; // Truncate UUID if it's long
                            } else {
                                name = value.charAt(0).toUpperCase() + value.slice(1);
                            }
                        }

                        return (
                            <React.Fragment key={to}>
                                <BreadcrumbSeparator />
                                <BreadcrumbItem>
                                    {last ? (
                                        <BreadcrumbPage className="font-semibold text-indigo-900">{name}</BreadcrumbPage>
                                    ) : (
                                        isId ? (
                                            <span className="text-slate-400 text-sm">{name}</span>
                                        ) : (
                                            <BreadcrumbLink asChild>
                                                <Link to={to} className="text-slate-500 hover:text-indigo-600 transition-colors">{name}</Link>
                                            </BreadcrumbLink>
                                        )
                                    )}
                                </BreadcrumbItem>
                            </React.Fragment>
                        );
                    })}
                </BreadcrumbList>
            </Breadcrumb>
        </div>
    );
}
