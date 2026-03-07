import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";

export default function StatsCard({ title, value, fullValue, icon: Icon, color, isLoading, progress, progressLabel, onClick }) {
  const getStyles = (color) => {
    switch (color) {
      case 'orange': // Warning/Expiring
        return {
          bg: 'bg-gradient-to-br from-amber-500 to-amber-600',
          iconBg: 'bg-amber-400/30',
          text: 'text-white',
          progressTrack: 'bg-black/10',
          progressFill: 'bg-white/90',
          subText: 'text-amber-50'
        };
      case 'green': // Success/Active
        return {
          bg: 'bg-gradient-to-br from-emerald-500 to-emerald-600',
          iconBg: 'bg-emerald-400/30',
          text: 'text-white',
          progressTrack: 'bg-black/10',
          progressFill: 'bg-white/90',
          subText: 'text-emerald-50'
        };
      case 'purple': // Financial
        return {
          bg: 'bg-gradient-to-br from-purple-500 to-purple-600',
          iconBg: 'bg-purple-400/30',
          text: 'text-white',
          progressTrack: 'bg-black/10',
          progressFill: 'bg-white/90',
          subText: 'text-purple-50'
        };
      default: // Blue/Total
        return {
          bg: 'bg-gradient-to-br from-blue-500 to-blue-600',
          iconBg: 'bg-blue-400/30',
          text: 'text-white',
          progressTrack: 'bg-black/10',
          progressFill: 'bg-white/90',
          subText: 'text-blue-50'
        };
    }
  };

  const styles = getStyles(color);

  if (isLoading) {
    return (
      <Card className="overflow-hidden border-0 shadow-sm">
        <CardContent className="p-6">
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-16" />
            </div>
            <Skeleton className="w-12 h-12 rounded-xl" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Se tiver progresso, precisamos ajustar o layout.
  // Vou colocar o progresso dentro do padding principal ou manter em baixo?
  // O design original dividia. Mas no card colorido, dividir fica estranho se o fundo mudar.
  // Vou manter tudo no mesmo bloco colorido.

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      onClick={onClick}
      className={onClick ? 'cursor-pointer' : ''}
    >
      <Card className={`${styles.bg} border-0 shadow-xl overflow-hidden`}>
        <CardContent className="p-6 flex flex-col h-full justify-between">
          <div className="flex justify-between items-start">
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium ${styles.text} opacity-90 mb-2 truncate`} title={title}>{title}</p>
              <p className={`text-2xl lg:text-3xl font-bold ${styles.text} truncate`} title={fullValue || value}>{value}</p>
            </div>
            <div className={`p-3 rounded-xl ${styles.iconBg} flex-shrink-0 ml-3`}>
              <Icon className={`w-6 h-6 ${styles.text}`} />
            </div>
          </div>

          {progress !== undefined && progress !== null && (
            <div className="mt-4 pt-4 border-t border-white/10">
              <div className={`flex justify-between text-xs ${styles.subText} mb-1 opacity-90`}>
                <span>Faturamento</span>
                <span>{progress.toFixed(1)}%</span>
              </div>
              <div className={`w-full ${styles.progressTrack} rounded-full h-2`}>
                <div
                  className={`${styles.progressFill} h-2 rounded-full transition-all duration-300`}
                  style={{ width: `${Math.min(progress, 100)}%` }}
                />
              </div>
              {progressLabel && (
                <p className={`text-xs ${styles.subText} mt-2 text-right truncate opacity-80`} title={progressLabel}>{progressLabel}</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
