import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, CheckCircle, TrendingUp, TrendingDown } from "lucide-react";
import { motion } from "framer-motion";

export default function PendencyCard({ title, value, subtitle, type = 'default', icon: Icon }) {
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
                    bg: 'bg-gradient-to-br from-green-500 to-green-600',
                    iconBg: 'bg-green-400/30',
                    text: 'text-white'
                };
            case 'warning':
                return {
                    bg: 'bg-gradient-to-br from-amber-500 to-amber-600',
                    iconBg: 'bg-amber-400/30',
                    text: 'text-white'
                };
            default:
                return {
                    bg: 'bg-gradient-to-br from-blue-500 to-blue-600',
                    iconBg: 'bg-blue-400/30',
                    text: 'text-white'
                };
        }
    };

    const styles = getStyles();
    const IconComponent = Icon || (type === 'danger' ? AlertTriangle : type === 'success' ? CheckCircle : TrendingUp);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            <Card className={`${styles.bg} border-0 shadow-xl overflow-hidden relative group`}>
                <CardContent className="p-6 relative z-10">
                    <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0 mr-4">
                            <p className={`text-sm font-medium ${styles.text} opacity-80 truncate`}>
                                {title}
                            </p>
                            <p className={`text-2xl xl:text-3xl font-bold ${styles.text} mt-2 truncate`}>
                                {value}
                            </p>
                            {subtitle && (
                                <p className={`text-xs ${styles.text} opacity-70 mt-1 truncate`}>
                                    {subtitle}
                                </p>
                            )}
                        </div>
                        <div className={`p-3 rounded-xl ${styles.iconBg} shrink-0`}>
                            <IconComponent className={`w-6 h-6 ${styles.text}`} />
                        </div>
                    </div>
                </CardContent>

                {/* Decorative watermarked icon */}
                <div className="absolute -right-4 -bottom-4 opacity-10 pointer-events-none group-hover:scale-110 transition-transform duration-500">
                    <IconComponent size={100} className={styles.text} />
                </div>
            </Card>
        </motion.div>
    );
}
