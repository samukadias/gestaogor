import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, parseISO, startOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CardDescription } from "@/components/ui/card";

function QualifiedDemandsChart({ demands }) {
    const [timeframe, setTimeframe] = useState('month');

    const data = useMemo(() => {
        const qualified = demands.filter(d => d.qualification_date);
        const groups = {};

        qualified.forEach(d => {
            const date = parseISO(d.qualification_date);
            let key;
            let label;

            if (timeframe === 'week') {
                const start = startOfWeek(date, { locale: ptBR });
                key = format(start, 'yyyy-ww');
                label = `Sem ${format(start, 'dd/MM')}`;
            } else if (timeframe === 'month') {
                key = format(date, 'yyyy-MM');
                label = format(date, 'MMM/yy', { locale: ptBR });
            } else {
                key = format(date, 'yyyy');
                label = key;
            }

            if (!groups[key]) {
                groups[key] = { name: label, value: 0, sortKey: key };
            }
            groups[key].value += 1;
        });

        return Object.values(groups).sort((a, b) => a.sortKey.localeCompare(b.sortKey));
    }, [demands, timeframe]);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <CardDescription>
                    Total: {data.reduce((acc, curr) => acc + curr.value, 0)} demandas
                </CardDescription>
                <Select value={timeframe} onValueChange={setTimeframe}>
                    <SelectTrigger className="w-32 h-8">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="week">Semanal</SelectItem>
                        <SelectItem value="month">Mensal</SelectItem>
                        <SelectItem value="year">Anual</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis
                            dataKey="name"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            stroke="#64748b"
                            dy={10}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            allowDecimals={false}
                            stroke="#64748b"
                            fontSize={12}
                        />
                        <Tooltip
                            cursor={{ fill: '#f1f5f9' }}
                            contentStyle={{
                                borderRadius: '8px',
                                border: 'none',
                                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                                fontSize: '12px'
                            }}
                        />
                        <Bar
                            dataKey="value"
                            fill="#8b5cf6"
                            radius={[4, 4, 0, 0]}
                            barSize={32}
                            activeBar={{ fill: '#7c3aed' }}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}

export default React.memo(QualifiedDemandsChart);
