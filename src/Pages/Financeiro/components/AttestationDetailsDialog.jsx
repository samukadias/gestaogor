import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calendar, DollarSign, FileText, User, AlertCircle } from "lucide-react";

export default function AttestationDetailsDialog({ attestation, open, onOpenChange }) {
    if (!attestation) return null;

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value || 0);
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('pt-BR');
    };

    const formatMonth = (monthStr) => {
        if (!monthStr) return '-';
        const [year, month] = monthStr.split('-');
        return new Date(year, month - 1).toLocaleDateString('pt-BR', {
            month: 'long',
            year: 'numeric'
        });
    };

    const pendency = (attestation.billed_amount || 0) - (attestation.paid_amount || 0);
    const hasPendency = pendency > 0;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl flex items-center gap-2">
                        <FileText className="w-6 h-6 text-blue-600" />
                        Detalhes da Atestação
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6 pt-4">
                    {/* Informações do Contrato */}
                    <div>
                        <h3 className="text-sm font-semibold text-slate-500 uppercase mb-3">
                            Contrato
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs text-slate-500 mb-1">Cliente</p>
                                <p className="font-medium text-slate-900">{attestation.client_name}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 mb-1">Analista</p>
                                <div className="flex items-center gap-2">
                                    <User className="w-4 h-4 text-slate-400" />
                                    <p className="font-medium text-slate-900">{attestation.responsible_analyst || '-'}</p>
                                </div>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 mb-1">PD</p>
                                <Badge variant="outline">{attestation.pd_number}</Badge>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 mb-1">ESP</p>
                                <Badge variant="outline">{attestation.esp_number}</Badge>
                            </div>
                        </div>
                    </div>

                    <Separator />

                    {/* Período */}
                    <div>
                        <h3 className="text-sm font-semibold text-slate-500 uppercase mb-3">
                            Período
                        </h3>
                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-blue-600" />
                            <p className="font-medium text-slate-900">{formatMonth(attestation.reference_month)}</p>
                        </div>
                    </div>

                    <Separator />

                    {/* Datas do Processo */}
                    <div>
                        <h3 className="text-sm font-semibold text-slate-500 uppercase mb-3">
                            Datas do Processo
                        </h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="text-xs text-slate-500 mb-1">Geração do Relatório</p>
                                <p className="text-slate-700">{formatDate(attestation.report_generation_date)}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 mb-1">Envio para Atestação</p>
                                <p className="text-slate-700">{formatDate(attestation.report_send_date)}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 mb-1">Retorno da Atestação</p>
                                <p className="text-slate-700">{formatDate(attestation.attestation_return_date)}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 mb-1">Envio da Fatura</p>
                                <p className="text-slate-700">{formatDate(attestation.invoice_send_to_client_date)}</p>
                            </div>
                        </div>
                    </div>

                    <Separator />

                    {/* Valores Financeiros */}
                    <div>
                        <h3 className="text-sm font-semibold text-slate-500 uppercase mb-3 flex items-center gap-2">
                            <DollarSign className="w-4 h-4" />
                            Valores Financeiros
                        </h3>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-slate-600">Valor Faturado</span>
                                <span className="font-semibold text-slate-900">{formatCurrency(attestation.billed_amount)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-slate-600">Valor Pago</span>
                                <span className="font-semibold text-green-600">{formatCurrency(attestation.paid_amount)}</span>
                            </div>
                            <Separator />
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-semibold text-slate-700">Pendência</span>
                                <span className={`font-bold text-lg ${hasPendency ? 'text-red-600' : 'text-green-600'}`}>
                                    {formatCurrency(pendency)}
                                </span>
                            </div>
                            {attestation.invoice_number && (
                                <div className="pt-2">
                                    <p className="text-xs text-slate-500 mb-1">Número da NF</p>
                                    <Badge>{attestation.invoice_number}</Badge>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Observações */}
                    {attestation.observations && (
                        <>
                            <Separator />
                            <div>
                                <h3 className="text-sm font-semibold text-slate-500 uppercase mb-3 flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4" />
                                    Observações
                                </h3>
                                <div className="bg-slate-50 rounded-lg p-4">
                                    <p className="text-sm text-slate-700 whitespace-pre-wrap">
                                        {attestation.observations}
                                    </p>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
