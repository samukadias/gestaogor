import React, { useMemo, useRef, useEffect } from 'react';
import { format, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Network, PlayCircle, Clock, CheckCircle2 } from "lucide-react";

// Categorize raw statuses into Macro Lanes (1 to 4 top-to-bottom)
const getMacroLane = (status) => {
    const s = (status || '').toUpperCase();

    // Linha 1: Comercial
    if (s === 'PENDENTE TRIAGEM' || s === 'REABERTA' || s === 'DESIGNADA' || s === 'CANCELADA' || s === 'TRIAGEM NÃO ELEGÍVEL')
        return { id: 1, label: 'COMERCIAL', color: 'emerald' };

    // Linha 4: Contrato
    if (s === 'ASSINADA') return { id: 4, label: 'CONTRATO', color: 'indigo' };

    // Linha 3: DOP / APP
    if (s === 'ENTREGUE') return { id: 3, label: 'DOP ou DDS', color: 'amber' };

    // Linha 2: Proposta
    return { id: 2, label: 'PROPOSTA', color: 'blue' };
};

const getColorStyles = (colorName) => {
    switch (colorName) {
        case 'emerald': return 'bg-emerald-100 border-emerald-300 text-emerald-800';
        case 'blue': return 'bg-blue-100 border-blue-300 text-blue-800';
        case 'amber': return 'bg-amber-100 border-amber-300 text-amber-800';
        case 'indigo': return 'bg-indigo-100 border-indigo-300 text-indigo-800';
        default: return 'bg-slate-100 border-slate-300 text-slate-800';
    }
};

const getLaneBgStyle = (laneId) => {
    switch (laneId) {
        case 1: return 'bg-emerald-50/30';
        case 2: return 'bg-blue-50/30';
        case 3: return 'bg-amber-50/30';
        case 4: return 'bg-indigo-50/30';
        default: return 'bg-transparent';
    }
};

export default function DemandProcessChart({ history = [], demandCreatedAt }) {
    const scrollRef = useRef(null);

    const processNodes = useMemo(() => {
        let nodes = [];

        // 1. Initial Point (Creation)
        if (demandCreatedAt) {
            nodes.push({
                dateObj: new Date(demandCreatedAt),
                formattedDate: format(new Date(demandCreatedAt), "dd/MM/yy HH:mm", { locale: ptBR }),
                statusName: 'CRIAÇÃO DA DEMANDA',
                lane: getMacroLane('PENDENTE TRIAGEM'),
                daysSinceLast: 0
            });
        }

        const sortedHistory = [...history].sort((a, b) => new Date(a.changed_at) - new Date(b.changed_at));
        let lastDate = demandCreatedAt ? new Date(demandCreatedAt) : null;

        sortedHistory.forEach((h) => {
            const hDate = new Date(h.changed_at);
            let diffDays = lastDate ? Math.max(0, differenceInDays(hDate, lastDate)) : 0;

            if (nodes.length > 0 && nodes[nodes.length - 1].statusName === h.to_status) {
                // Accumulate days if same consecutive status
                nodes[nodes.length - 1].daysSinceLast += diffDays;
                nodes[nodes.length - 1].formattedDate = format(hDate, "dd/MM/yy HH:mm", { locale: ptBR });
                nodes[nodes.length - 1].dateObj = hDate;
            } else {
                nodes.push({
                    dateObj: hDate,
                    formattedDate: format(hDate, "dd/MM/yy HH:mm", { locale: ptBR }),
                    statusName: h.to_status,
                    lane: getMacroLane(h.to_status),
                    daysSinceLast: diffDays
                });
            }
            lastDate = hDate;
        });

        return nodes;
    }, [history, demandCreatedAt]);

    if (processNodes.length === 0) {
        return (
            <div className="text-center p-8 text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200 m-6">
                Sem histórico suficiente para desenhar o fluxo.
            </div>
        );
    }

    const totalDaysElapsed = processNodes.length > 1
        ? differenceInDays(processNodes[processNodes.length - 1].dateObj, processNodes[0].dateObj)
        : 0;

    // Define the 4 static lanes
    const gridLanes = [
        { id: 1, label: '01 - COMERCIAL' },
        { id: 2, label: '02 - PROPOSTA' },
        { id: 3, label: '03 - DOP ou DDS' },
        { id: 4, label: '04 - CONTRATO' }
    ];

    return (
        <div className="flex flex-col h-full bg-white rounded-xl shadow-sm overflow-hidden relative">
            {/* Header */}
            <div className="p-4 pr-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                    <Network className="w-5 h-5 text-indigo-400" />
                    <h3 className="font-bold text-white tracking-wide text-sm uppercase">Fluxograma de Etapas</h3>
                </div>
                <div className="text-xs font-semibold bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-full border border-indigo-500/30">
                    SLA Total Decorrido: {totalDaysElapsed} {totalDaysElapsed === 1 ? 'dia' : 'dias'}
                </div>
            </div>

            {/* Scrolling Body */}
            <div
                className="flex-1 overflow-x-auto overflow-y-hidden p-6 relative select-none"
                ref={scrollRef}
            >
                {/* SVG Lines Connector background layer */}
                <svg className="absolute top-0 left-0 w-full h-full pointer-events-none" style={{ minWidth: `${Math.max(100, processNodes.length * 200)}px` }}>
                    {processNodes.map((node, i) => {
                        if (i === 0) return null;
                        const prevNode = processNodes[i - 1];

                        // Calculate approximate center points of nodes
                        // X position: node index * 220px (node width + gap) + 120px (left padding/offset)
                        const startX = (i - 1) * 220 + 260; // 260px = 120px (sidebar) + (220 width scale reference)
                        const endX = i * 220 + 130;

                        // Y position: based on lane (0 = ~70px, 1 = ~190px, 2 = ~310px, 3 = ~430px)
                        const laneHeight = 120;
                        const startY = (prevNode.lane.id - 1) * laneHeight + 60; // 60px half height of lane
                        const endY = (node.lane.id - 1) * laneHeight + 60;

                        return (
                            <path
                                key={`line-${i}`}
                                d={`M ${startX} ${startY} C ${startX + 50} ${startY}, ${endX - 50} ${endY}, ${endX} ${endY}`}
                                fill="none"
                                stroke="#94a3b8"
                                strokeWidth="3"
                                strokeDasharray="4 4"
                                className="opacity-60"
                            />
                        );
                    })}
                </svg>

                {/* Left Sidebar Labels (Sticky) */}
                <div className="absolute left-0 top-0 bottom-0 w-32 bg-white/90 backdrop-blur-sm z-10 border-r border-slate-200">
                    {gridLanes.map((lane) => (
                        <div key={lane.id} className="h-[120px] w-full flex items-center justify-end pr-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-dashed border-slate-200">
                            {lane.label}
                        </div>
                    ))}
                </div>

                {/* Grid Structure Overlay */}
                <div className="absolute left-0 right-0 top-0 pointer-events-none z-0">
                    {gridLanes.map((lane) => (
                        <div key={lane.id} className={`h-[120px] w-full border-b border-dashed border-slate-200 ${getLaneBgStyle(lane.id)}`} style={{ minWidth: '100vw' }}></div>
                    ))}
                </div>

                {/* The Timeline Columns (X-axis) */}
                <div className="flex pl-36 space-x-[20px] relative z-10 h-full">
                    {processNodes.map((node, index) => {
                        return (
                            <div key={index} className="w-[200px] shrink-0 h-[480px] relative mt-[-24px]">
                                {/* Render the Node strictly at its Y-coordinate based on the lane.id */}
                                <div
                                    className={`absolute w-[180px] p-3 rounded-lg border-2 shadow-sm flex flex-col items-center justify-center text-center transition-all hover:scale-105 bg-white ${getColorStyles(node.lane.color)}`}
                                    style={{
                                        top: `${(node.lane.id - 1) * 120 + 34}px`,
                                        left: '10px'
                                    }}
                                >
                                    <h4 className="font-bold text-[11px] uppercase leading-tight mb-1 h-[26px] line-clamp-2">
                                        {node.statusName}
                                    </h4>
                                    <span className="text-[9px] font-mono font-medium opacity-80 mb-2">
                                        {node.formattedDate}
                                    </span>

                                    {index === 0 ? (
                                        <div className="mt-auto bg-white/60 px-2 py-0.5 rounded-full border border-black/10 text-[9px] font-bold flex items-center gap-1">
                                            <PlayCircle className="w-3 h-3" /> Início
                                        </div>
                                    ) : index === processNodes.length - 1 && node.lane.id === 4 ? (
                                        <div className="mt-auto bg-indigo-500 text-white px-2 py-0.5 rounded-full shadow-sm text-[9px] font-bold flex items-center gap-1">
                                            <CheckCircle2 className="w-3 h-3" /> Fim
                                        </div>
                                    ) : (
                                        <div className="mt-auto bg-white/60 px-2 py-0.5 rounded-full border border-black/10 text-[9px] font-bold flex items-center gap-1">
                                            <Clock className="w-3 h-3" /> +{node.daysSinceLast} dia(s)
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                    {/* Padding Right to let you scroll past the last element */}
                    <div className="w-[100px] shrink-0"></div>
                </div>
            </div>
        </div>
    );
}
