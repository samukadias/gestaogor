import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle2, Eye } from "lucide-react";
import { motion } from "framer-motion";

export default function PendencyTable({ attestations, onViewDetails }) {
    const formatCurrency = (value) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value || 0);
    };

    const formatMonth = (monthStr) => {
        if (!monthStr) return '-';
        const [year, month] = monthStr.split('-');
        const date = new Date(year, month - 1);
        return date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
    };

    return (
        <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
            <Table>
                <TableHeader>
                    <TableRow className="bg-slate-50 border-b border-slate-100">
                        <TableHead className="font-semibold text-slate-700">Cliente</TableHead>
                        <TableHead className="font-semibold text-slate-700">Analista</TableHead>
                        <TableHead className="font-semibold text-slate-700">PD</TableHead>
                        <TableHead className="font-semibold text-slate-700">ESP</TableHead>
                        <TableHead className="font-semibold text-slate-700">Mês</TableHead>
                        <TableHead className="font-semibold text-slate-700 text-right">Faturado</TableHead>
                        <TableHead className="font-semibold text-slate-700 text-right">Pago</TableHead>
                        <TableHead className="font-semibold text-slate-700 text-right">Pendência</TableHead>
                        <TableHead className="font-semibold text-slate-700 text-center">Status</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {attestations.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={9} className="text-center py-12 text-slate-500">
                                Nenhum registro encontrado
                            </TableCell>
                        </TableRow>
                    ) : (
                        attestations.map((att, index) => {
                            const measurementValue = parseFloat(att.measurement_value) || 0;
                            const billedAmount = parseFloat(att.billed_amount) || 0;
                            const gap = measurementValue - billedAmount;
                            const hasGap = gap > 0;

                            return (
                                <motion.tr
                                    key={att.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className={`border-b border-slate-50 hover:bg-slate-50/50 transition-colors ${hasGap ? 'bg-red-50/30' : ''
                                        }`}
                                >
                                    <TableCell className="font-medium text-slate-800">
                                        {att.client_name}
                                    </TableCell>
                                    <TableCell className="text-slate-600">{att.responsible_analyst || '-'}</TableCell>
                                    <TableCell className="text-slate-600">{att.pd_number}</TableCell>
                                    <TableCell className="text-slate-600">{att.esp_number}</TableCell>
                                    <TableCell className="text-slate-600">{formatMonth(att.reference_month)}</TableCell>
                                    <TableCell className="text-right text-slate-700">
                                        {formatCurrency(measurementValue)}
                                    </TableCell>
                                    <TableCell className="text-right text-slate-700">
                                        {formatCurrency(billedAmount)}
                                    </TableCell>
                                    <TableCell className={`text-right font-semibold ${hasGap ? 'text-red-600' : 'text-green-600'
                                        }`}>
                                        {hasGap ? formatCurrency(gap) : '-'}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            {hasGap ? (
                                                <>
                                                    <Badge variant="destructive" className="bg-red-100 text-red-700 border-red-200">
                                                        <AlertTriangle className="w-3 h-3 mr-1" />
                                                        GAP Identificado
                                                    </Badge>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => onViewDetails && onViewDetails(att)}
                                                        className="h-7 w-7 p-0"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </Button>
                                                </>
                                            ) : (
                                                <>
                                                    <Badge className="bg-green-100 text-green-700 border-green-200">
                                                        <CheckCircle2 className="w-3 h-3 mr-1" />
                                                        Sem GAP
                                                    </Badge>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => onViewDetails && onViewDetails(att)}
                                                        className="h-7 w-7 p-0"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </Button>
                                                </>
                                            )}
                                        </div>
                                    </TableCell>
                                </motion.tr>
                            );
                        })
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
