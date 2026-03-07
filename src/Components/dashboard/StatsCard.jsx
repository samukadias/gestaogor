import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";

export default function StatsCard({
    title,
    value,
    subtitle,
    type = 'default',
    icon: Icon,
    trend,
    trendUp,
    onClick
}) {
    const getStyles = () => {
        switch (type) {
            case 'danger':
                return {
                    bg: 'bg-gradient-to-br from-red-500 to-red-600',
                    iconBg: 'bg-red-400/30',
                    text: 'text-white'
                };
            case 'success':
                return {
                    bg: 'bg-gradient-to-br from-emerald-500 to-emerald-600',
                    iconBg: 'bg-emerald-400/30',
                    text: 'text-white'
                };
            case 'warning':
                return {
                    bg: 'bg-gradient-to-br from-amber-500 to-amber-600',
                    iconBg: 'bg-amber-400/30',
                    text: 'text-white'
                };
            case 'info':
                return {
                    bg: 'bg-gradient-to-br from-cyan-500 to-cyan-600',
                    iconBg: 'bg-cyan-400/30',
                    text: 'text-white'
                };
            case 'purple':
                return {
                    bg: 'bg-gradient-to-br from-purple-500 to-purple-600',
                    iconBg: 'bg-purple-400/30',
                    text: 'text-white'
                };
            default: // Blue/Indigo
                return {
                    bg: 'bg-gradient-to-br from-indigo-500 to-indigo-600',
                    iconBg: 'bg-indigo-400/30',
                    text: 'text-white'
                };
        }
    };

    const styles = getStyles();

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="h-full"
        >
            <Card
                onClick={onClick}
                className={`${styles.bg} border-0 shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 overflow-hidden h-full relative group ${onClick ? 'cursor-pointer' : ''}`}
            >
                <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all pointer-events-none" />
                <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className={`text-sm font-medium ${styles.text} opacity-80 h-10 flex items-center`}>
                                {title}
                            </p>
                            <p className={`text-3xl font-bold ${styles.text} mt-2`}>
                                {value}
                            </p>
                            {(subtitle || trend) && (
                                <div className={`text-xs ${styles.text} opacity-70 mt-1 flex items-center gap-2`}>
                                    {subtitle && <span>{subtitle}</span>}
                                    {trend && (
                                        <span className={`flex items-center ${trendUp ? 'text-emerald-200' : 'text-red-200'} font-bold bg-white/10 px-1 rounded`}>
                                            {trend}
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className={`p-3 rounded-xl ${styles.iconBg}`}>
                            {Icon && <Icon className={`w-6 h-6 ${styles.text}`} />}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}
