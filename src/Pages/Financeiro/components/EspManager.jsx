import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import CurrencyInput from "@/components/ui/currency-input";


export default function EspManager({ esps, onChange }) {
    const addEsp = () => {
        onChange([...esps, { esp_number: '', object_description: '', esp_value: '' }]);
    };

    const removeEsp = (index) => {
        const newEsps = esps.filter((_, i) => i !== index);
        onChange(newEsps);
    };

    const updateEsp = (index, field, value) => {
        const newEsps = [...esps];
        newEsps[index] = { ...newEsps[index], [field]: value };
        onChange(newEsps);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold text-slate-700">ESPs Vinculadas</Label>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addEsp}
                    className="text-blue-600 border-blue-200 hover:bg-blue-50"
                >
                    <Plus className="w-4 h-4 mr-1" />
                    Adicionar ESP
                </Button>
            </div>

            <AnimatePresence>
                {esps.length === 0 ? (
                    <div className="text-center py-8 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                        <p className="text-slate-500 text-sm">Nenhuma ESP cadastrada</p>
                        <p className="text-slate-400 text-xs mt-1">Clique em "Adicionar ESP" para começar</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {esps.map((esp, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="p-4 bg-gradient-to-r from-slate-50 to-white rounded-xl border border-slate-200 shadow-sm"
                            >
                                <div className="flex items-start gap-4">
                                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <Label className="text-xs text-slate-500 mb-1 block">
                                                Número da ESP
                                            </Label>
                                            <Input
                                                value={esp.esp_number}
                                                onChange={(e) => updateEsp(index, 'esp_number', e.target.value)}
                                                placeholder="Ex: ESP-001"
                                                className="bg-white"
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-xs text-slate-500 mb-1 block">
                                                Objeto
                                            </Label>
                                            <Textarea
                                                value={esp.object_description}
                                                onChange={(e) => updateEsp(index, 'object_description', e.target.value)}
                                                placeholder="Descreva o objeto da ESP..."
                                                className="bg-white min-h-[80px]"
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-xs text-slate-500 mb-1 block">
                                                Valor da ESP (R$)
                                            </Label>
                                            <CurrencyInput
                                                value={esp.esp_value || 0}
                                                onChange={(value) => updateEsp(index, 'esp_value', value)}
                                            />
                                        </div>

                                    </div>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => removeEsp(index)}
                                        className="text-red-500 hover:text-red-700 hover:bg-red-50 mt-5"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
