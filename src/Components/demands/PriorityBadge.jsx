import React from 'react';
import { cn } from "@/lib/utils";

// Maintained for backward compatibility or potential future use, 
// but now priority is directly driven by 'weight' (0 is highest, 4 is lowest).
export function calculatePriority(weight, complexity) {
    return weight || 0;
}

export default function PriorityBadge({ weight }) {
    // If weight format is missing, default to 4 (lowest priority)
    const priority = weight !== undefined && weight !== null ? weight : 4;

    let style = "bg-slate-100 text-slate-600";
    let label = "Baixo";

    if (priority === 0) {
        style = "bg-rose-100 text-rose-700 font-bold border border-rose-200 shadow-sm";
        label = "Estratégico";
    } else if (priority === 1) {
        style = "bg-orange-100 text-orange-700 font-semibold border border-orange-200";
        label = "Muito Alto";
    } else if (priority === 2) {
        style = "bg-amber-100 text-amber-700 font-medium border border-amber-200";
        label = "Alto";
    } else if (priority === 3) {
        style = "bg-blue-50 text-blue-600 border border-blue-100";
        label = "Padrão";
    }

    return (
        <span className={cn(
            "inline-flex items-center px-2.5 py-1 text-xs rounded-full whitespace-nowrap",
            style
        )}>
            <span className="mr-1 opacity-70">P{priority}</span> {label}
        </span>
    );
}
