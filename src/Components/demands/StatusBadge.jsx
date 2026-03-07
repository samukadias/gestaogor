import React from 'react';
import { cn } from "@/lib/utils";

const statusStyles = {
    "PENDENTE TRIAGEM": "bg-amber-50 text-amber-700 border-amber-200",
    "TRIAGEM NÃO ELEGÍVEL": "bg-slate-50 text-slate-600 border-slate-200",
    "DESIGNADA": "bg-blue-50 text-blue-700 border-blue-200",
    "EM QUALIFICAÇÃO": "bg-violet-50 text-violet-700 border-violet-200",
    "EM ANDAMENTO": "bg-indigo-50 text-indigo-700 border-indigo-200",
    "PENDÊNCIA DDS": "bg-orange-50 text-orange-700 border-orange-200",
    "PENDÊNCIA DOP": "bg-orange-50 text-orange-700 border-orange-200",
    "PENDÊNCIA DOP E DDS": "bg-orange-50 text-orange-700 border-orange-200",
    "PENDÊNCIA COMERCIAL": "bg-rose-50 text-rose-700 border-rose-200",
    "PENDÊNCIA SUPRIMENTOS": "bg-teal-50 text-teal-700 border-teal-200",
    "PENDÊNCIA FORNECEDOR": "bg-red-50 text-red-700 border-red-200",
    "CONGELADA": "bg-cyan-50 text-cyan-700 border-cyan-200",
    "ENTREGUE": "bg-emerald-50 text-emerald-700 border-emerald-200",
    "REABERTA": "bg-amber-100 text-amber-800 border-amber-300",
    "CANCELADA": "bg-zinc-100 text-zinc-500 border-zinc-200"
};

export default function StatusBadge({ status, size = "default" }) {
    const style = statusStyles[status] || "bg-slate-50 text-slate-600 border-slate-200";

    return (
        <span className={cn(
            "inline-flex items-center font-medium border rounded-full whitespace-nowrap",
            style,
            size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs"
        )}>
            {status}
        </span>
    );
}
