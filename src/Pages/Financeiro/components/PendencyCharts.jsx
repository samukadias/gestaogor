import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

export default function PendencyCharts({ attestations }) {
    const getClientInitials = (name) => {
        if (!name) return '';
        // Remove words like "do, da, de, e" to clean the acronym
        const words = name.split(' ').filter(w => !['do', 'da', 'de', 'e', 'das', 'dos'].includes(w.toLowerCase()));
        if (words.length === 1) return words[0].substring(0, 3).toUpperCase();
        return words.map(w => w[0]).join('').substring(0, 4).toUpperCase();
    };

    // Rendereing Horizontal BarChart for better readability
    // Pendências por cliente
    const pendencyByClient = attestations.reduce((acc, att) => {
        const pendency = (att.billed_amount || 0) - (att.paid_amount || 0);
        if (pendency > 0) {
            const acronym = getClientInitials(att.client_name);
            const existing = acc.find(item => item.fullName === att.client_name);
            if (existing) {
                existing.value += pendency;
            } else {
                acc.push({ client: acronym, fullName: att.client_name, value: pendency });
            }
        }
        return acc;
    }, []);

    // Pendências por mês
    const pendencyByMonth = attestations.reduce((acc, att) => {
        const pendency = (att.billed_amount || 0) - (att.paid_amount || 0);
        if (pendency > 0 && att.reference_month) {
            const [year, month] = att.reference_month.split('-');
            const monthLabel = new Date(year, month - 1).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
            const existing = acc.find(item => item.month === monthLabel);
            if (existing) {
                existing.value += pendency;
            } else {
                acc.push({ month: monthLabel, value: pendency });
            }
        }
        return acc;
    }, []).sort((a, b) => a.month.localeCompare(b.month));

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            notation: 'compact'
        }).format(value);
    };

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            // Se for o gráfico de clientes (que tem fullName)
            const fullName = payload[0]?.payload?.fullName || label || payload[0]?.name;

            return (
                <div className="bg-white p-3 rounded-lg shadow-lg border border-slate-100 max-w-[250px]">
                    <p className="text-slate-600 text-sm break-words whitespace-normal">{fullName}</p>
                    <p className="text-slate-900 font-semibold mt-1">
                        {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL'
                        }).format(payload[0]?.value)}
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-0 shadow-lg bg-white">
                <CardHeader className="border-b border-slate-100">
                    <CardTitle className="text-lg text-slate-800">Pendências por Cliente</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                    {pendencyByClient.length === 0 ? (
                        <div className="flex items-center justify-center h-64 text-slate-500">
                            Sem pendências
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height={Math.max(300, pendencyByClient.length * 40)}>
                            <BarChart
                                layout="vertical"
                                data={pendencyByClient.sort((a, b) => b.value - a.value)}
                                margin={{ left: 100, right: 30, top: 10, bottom: 10 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                                <XAxis
                                    type="number"
                                    hide
                                />
                                <YAxis
                                    dataKey="client"
                                    type="category"
                                    tick={{ fill: '#64748b', fontSize: 11 }}
                                    width={120}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                                <Bar
                                    dataKey="value"
                                    fill="#3b82f6"
                                    radius={[0, 4, 4, 0]}
                                    barSize={20}
                                    label={{
                                        position: 'right',
                                        formatter: formatCurrency,
                                        fill: '#64748b',
                                        fontSize: 10
                                    }}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white">
                <CardHeader className="border-b border-slate-100">
                    <CardTitle className="text-lg text-slate-800">Pendências por Mês</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                    {pendencyByMonth.length === 0 ? (
                        <div className="flex items-center justify-center h-64 text-slate-500">
                            Sem pendências
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={pendencyByMonth}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                <XAxis
                                    dataKey="month"
                                    tick={{ fill: '#64748b', fontSize: 12 }}
                                    axisLine={{ stroke: '#e2e8f0' }}
                                />
                                <YAxis
                                    tickFormatter={formatCurrency}
                                    tick={{ fill: '#64748b', fontSize: 12 }}
                                    axisLine={{ stroke: '#e2e8f0' }}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar
                                    dataKey="value"
                                    fill="#ef4444"
                                    radius={[4, 4, 0, 0]}
                                    name="Pendência"
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
