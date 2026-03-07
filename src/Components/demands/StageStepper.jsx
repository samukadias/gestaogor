
import React from 'react';
import { motion } from 'framer-motion';
import { Check, Circle } from 'lucide-react';
import { cn } from "@/lib/utils";

// Definindo as etapas em ordem
const STAGES = [
    { id: 'Triagem', label: 'Triagem' },
    { id: 'Qualificação', label: 'Qualificação' },
    { id: 'PO', label: 'PO' },
    { id: 'OO', label: 'OO' },
    { id: 'RT', label: 'RT' },
    { id: 'ESP', label: 'ESP', legacyId: 'KIT' }
];

export function StageStepper({ currentStage, onStageClick, readOnly = false, stageHistory = [] }) {
    // Encontrar o índice da etapa atual
    const currentIndex = STAGES.findIndex(s => s.id === currentStage || s.legacyId === currentStage);

    // Helper para calcular dias na etapa
    const getStageDays = (stageObj) => {
        // Filtra todas as entradas de histórico para esta etapa ou sua versão legada
        const entries = stageHistory.filter(h => h.stage === stageObj.id || (stageObj.legacyId && h.stage === stageObj.legacyId));
        if (entries.length === 0) return null;

        // Soma durações (em minutos)
        let totalMinutes = 0;
        entries.forEach(e => {
            if (e.duration_minutes) {
                totalMinutes += e.duration_minutes;
            } else if (e.entered_at && !e.exited_at) {
                // Etapa atual (em aberto)
                const start = new Date(e.entered_at);
                const now = new Date();
                const diff = Math.round((now - start) / (1000 * 60));
                totalMinutes += diff;
            }
        });

        const days = (totalMinutes / 1440).toFixed(1);
        return days;
    };

    return (
        <div className="w-full py-4 overflow-x-auto">
            <div className="flex items-center justify-between min-w-[600px] relative">

                {/* Linha de fundo */}
                <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-200 -z-10 rounded-full" />

                {/* Linha de progresso */}
                <motion.div
                    className="absolute top-1/2 left-0 h-1 bg-blue-600 -z-0 rounded-full origin-left"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: currentIndex === -1 ? 0 : currentIndex / (STAGES.length - 1) }}
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                />

                {STAGES.map((stage, index) => {
                    const isCompleted = index < currentIndex;
                    const isCurrent = index === currentIndex;
                    const isFuture = index > currentIndex;
                    const days = getStageDays(stage);

                    return (
                        <div
                            key={stage.id}
                            className={cn(
                                "flex flex-col items-center gap-2 cursor-pointer transition-all",
                                readOnly && "cursor-default",
                                isFuture && !readOnly && "hover:opacity-80"
                            )}
                            onClick={() => !readOnly && onStageClick && onStageClick(stage.id)}
                        >
                            <motion.div
                                className={cn(
                                    "w-10 h-10 rounded-full flex items-center justify-center border-4 transition-colors duration-300 bg-white z-10",
                                    isCompleted ? "border-blue-600 bg-blue-600 text-white" :
                                        isCurrent ? "border-blue-600 bg-white text-blue-600" :
                                            "border-slate-300 text-slate-300"
                                )}
                                whileHover={!readOnly && !isCurrent ? { scale: 1.1 } : {}}
                                whileTap={!readOnly ? { scale: 0.95 } : {}}
                            >
                                {isCompleted ? (
                                    <Check className="w-5 h-5" />
                                ) : isCurrent ? (
                                    <div className="w-3 h-3 bg-blue-600 rounded-full" />
                                ) : (
                                    <span className="text-sm font-bold">{index + 1}</span>
                                )}
                            </motion.div>

                            <div className="flex flex-col items-center">
                                <span className={cn(
                                    "text-xs font-semibold whitespace-nowrap transition-colors duration-300",
                                    isCompleted || isCurrent ? "text-blue-700" : "text-slate-400"
                                )}>
                                    {stage.label}
                                </span>
                                {days !== null && (
                                    <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-1.5 rounded-full mt-0.5">
                                        {days}d
                                    </span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
