import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, Save, X, Check, ChevronsUpDown } from "lucide-react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import CurrencyInput from "@/components/ui/currency-input";

const STAGES = [
    "Triagem",
    "Qualificação",
    "PO",
    "OO",
    "RT",
    "ESP"
];

const STATUS_LIST = [
    "PENDENTE TRIAGEM",
    "TRIAGEM NÃO ELEGÍVEL",
    "DESIGNADA",
    "EM QUALIFICAÇÃO",
    "EM ANDAMENTO",
    "CORREÇÃO",
    "PENDÊNCIA DDS",
    "PENDÊNCIA DOP",
    "PENDÊNCIA DOP E DDS",
    "PENDÊNCIA COMERCIAL",
    "PENDÊNCIA SUPRIMENTOS",
    "PENDÊNCIA FORNECEDOR",
    "CONGELADA",
    "ENTREGUE",
    "CANCELADA"
];

export default function DemandForm({
    demand,
    onSave,
    onCancel,
    isLoading,
    analysts = [],
    clients = [],
    cycles = [],
    requesters = [],
    userRole = 'user',
    userDepartment = '',
    isNew = false
}) {
    const [formData, setFormData] = useState({
        demand_number: demand?.demand_number || '',
        product: demand?.product || '',
        artifact: demand?.artifact || 'Orçamento',
        value: demand?.value ?? '',
        weight: demand?.weight ?? 1,
        margem_bruta: demand?.margem_bruta ?? '',
        margem_liquida: demand?.margem_liquida ?? '',
        qualification_date: demand?.qualification_date || '',
        expected_delivery_date: demand?.expected_delivery_date || '',
        delivery_date: demand?.delivery_date || '',
        delivery_date_change_reason: '',
        status: demand?.status || 'PENDENTE TRIAGEM',
        observation: demand?.observation || '',
        client_id: demand?.client_id || '',
        cycle_id: demand?.cycle_id || '',
        stage: demand?.stage || 'Triagem',
        analyst_id: demand?.analyst_id || '',
        requester_id: demand?.requester_id || '',
        support_analyst_id: demand?.support_analyst_id || '',
        architect_support_analyst_id: demand?.architect_support_analyst_id || ''
    });

    const isGestor = ['admin', 'manager', 'general_manager'].includes(userRole);

    const originalDeliveryDate = demand?.delivery_date || '';
    const deliveryDateChanged = formData.delivery_date !== originalDeliveryDate;
    // Only require reason if the demand was ALREADY delivered and the date is being changed
    const isAlreadyDelivered = demand?.status === 'ENTREGUE';
    const showReasonField = isGestor && isAlreadyDelivered && deliveryDateChanged;

    const [showPreVendasSupport, setShowPreVendasSupport] = useState(!!demand?.support_analyst_id);
    const [showArquitetoSupport, setShowArquitetoSupport] = useState(!!demand?.architect_support_analyst_id);
    const [openClient, setOpenClient] = useState(false);

    const submitForm = (e) => {
        if (e && e.preventDefault) e.preventDefault();

        // Validate Required Fields
        if (!formData.product || !formData.product.trim()) {
            alert('Por favor, informe o Produto.');
            return;
        }

        // Validate delivery_date change reason
        if (showReasonField && !formData.delivery_date_change_reason.trim()) {
            alert('Por favor, informe o motivo da alteração da data de entrega.');
            return;
        }

        // Sanitize data: convert empty strings to null for ID fields
        const { delivery_date_change_reason, ...rest } = formData;
        const cleanedData = {
            ...rest,
            value: formData.value !== '' && formData.value !== null && formData.value !== undefined
                ? parseFloat(String(formData.value).replace(',', '.')) || null
                : null,
            margem_bruta: formData.margem_bruta !== '' && formData.margem_bruta != null && String(formData.margem_bruta).trim() !== ''
                ? parseFloat(String(formData.margem_bruta).replace(',', '.')) || null
                : null,
            margem_liquida: formData.margem_liquida !== '' && formData.margem_liquida != null && String(formData.margem_liquida).trim() !== ''
                ? parseFloat(String(formData.margem_liquida).replace(',', '.')) || null
                : null,
            client_id: formData.client_id === "" ? null : formData.client_id,
            analyst_id: formData.analyst_id === "" ? null : formData.analyst_id,
            cycle_id: formData.cycle_id === "" ? null : formData.cycle_id,
            requester_id: formData.requester_id === "" ? null : formData.requester_id,
            support_analyst_id: formData.support_analyst_id === "" ? null : formData.support_analyst_id,
            architect_support_analyst_id: formData.architect_support_analyst_id === "" ? null : formData.architect_support_analyst_id,
        };

        onSave(cleanedData);
    };

    const DatePicker = ({ value, onChange, label, disabled }) => (
        <div className="space-y-2">
            <Label className="text-sm text-slate-600">{label}</Label>
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        disabled={disabled}
                        className={cn(
                            "w-full justify-start text-left font-normal h-10",
                            !value && "text-slate-400"
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {value ? format(parseISO(value), "dd/MM/yyyy", { locale: ptBR }) : "Selecionar data"}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                        mode="single"
                        selected={value ? parseISO(value) : undefined}
                        onSelect={(date) => onChange(date ? format(date, 'yyyy-MM-dd') : '')}
                        locale={ptBR}
                    />
                </PopoverContent>
            </Popover>
        </div>
    );

    return (
        <form onSubmit={submitForm} className="space-y-6" noValidate>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-2">
                    <Label className="text-sm text-slate-600">Nº Demanda</Label>
                    <Input
                        value={formData.demand_number}
                        onChange={(e) => setFormData({ ...formData, demand_number: e.target.value })}
                        placeholder="Opcional"
                        className="h-10"
                    />
                </div>

                <div className="space-y-2 lg:col-span-2">
                    <Label className="text-sm text-slate-600">Produto *</Label>
                    <Input
                        value={formData.product}
                        onChange={(e) => setFormData({ ...formData, product: e.target.value })}
                        placeholder="Nome do produto ou descrição da demanda"
                        className="h-10"
                    />
                </div>

                <div className="space-y-2">
                    <Label className="text-sm text-slate-600">Artefato *</Label>
                    <Select
                        value={formData.artifact}
                        onValueChange={(v) => setFormData({ ...formData, artifact: v })}
                    >
                        <SelectTrigger className="h-10">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Orçamento">Orçamento</SelectItem>
                            <SelectItem value="Proposta">Proposta</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label className="text-sm text-slate-600">Valor (R$)</Label>
                    <CurrencyInput
                        id="value"
                        value={formData.value}
                        onChange={(val) => setFormData({ ...formData, value: val })}
                    />
                </div>

                <div className="space-y-2">
                    <Label className="text-sm text-slate-600">Etapa</Label>
                    <Select
                        value={formData.stage}
                        onValueChange={(v) => setFormData({ ...formData, stage: v })}
                    >
                        <SelectTrigger className="h-10">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {STAGES.map(s => (
                                <SelectItem key={s} value={s}>{s}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label className="text-sm text-slate-600">Prioridade</Label>
                    <Select
                        value={String(formData.weight)}
                        onValueChange={(v) => setFormData({ ...formData, weight: Number(v) })}
                    >
                        <SelectTrigger className="h-10">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="0">0 - Estratégico</SelectItem>
                            <SelectItem value="1">1 - Muito Alto</SelectItem>
                            <SelectItem value="2">2 - Alto</SelectItem>
                            <SelectItem value="3">3 - Padrão</SelectItem>
                            <SelectItem value="4">4 - Baixo</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label className="text-sm text-slate-600">MB (%)</Label>
                        <Input
                            value={formData.margem_bruta}
                            onChange={(e) => setFormData({ ...formData, margem_bruta: e.target.value })}
                            placeholder="Ex: 15,08"
                            className="h-10"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-sm text-slate-600">ML (%)</Label>
                        <Input
                            value={formData.margem_liquida}
                            onChange={(e) => setFormData({ ...formData, margem_liquida: e.target.value })}
                            placeholder="Ex: 10,50"
                            className="h-10"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label className="text-sm text-slate-600">Cliente</Label>
                    <Popover open={openClient} onOpenChange={setOpenClient}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={openClient}
                                className="w-full justify-between h-10 font-normal px-3"
                            >
                                <span className="truncate">
                                    {formData.client_id
                                        ? clients.find((c) => String(c.id) === String(formData.client_id))?.name || "Cliente não encontrado"
                                        : "Selecionar cliente..."}
                                </span>
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                            <Command>
                                <CommandInput placeholder="Buscar cliente..." />
                                <CommandList>
                                    <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
                                    <CommandGroup>
                                        <CommandItem
                                            value="none"
                                            onSelect={() => {
                                                setFormData({ ...formData, client_id: "" });
                                                setOpenClient(false);
                                            }}
                                        >
                                            <Check
                                                className={cn(
                                                    "mr-2 h-4 w-4",
                                                    !formData.client_id ? "opacity-100" : "opacity-0"
                                                )}
                                            />
                                            Nenhum
                                        </CommandItem>
                                        {clients.filter(c => c.active !== false).map((client) => (
                                            <CommandItem
                                                key={client.id}
                                                value={client.name}
                                                onSelect={(currentValue) => {
                                                    // current value comes lowercased from cmdk sometimes, but we used client.name as value
                                                    // safer to use closure client.id
                                                    setFormData({ ...formData, client_id: String(client.id) });
                                                    setOpenClient(false);
                                                }}
                                            >
                                                <Check
                                                    className={cn(
                                                        "mr-2 h-4 w-4",
                                                        String(formData.client_id) === String(client.id) ? "opacity-100" : "opacity-0"
                                                    )}
                                                />
                                                {client.name}
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>
                </div>

                <div className="space-y-2">
                    <Label className="text-sm text-slate-600">Ciclo</Label>
                    <Select
                        value={formData.cycle_id ? String(formData.cycle_id) : "none"}
                        onValueChange={(v) => setFormData({ ...formData, cycle_id: v === "none" ? "" : v })}
                    >
                        <SelectTrigger className="h-10">
                            <SelectValue placeholder="Selecionar" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none">Nenhum</SelectItem>
                            {cycles.filter(c => c.active !== false).map(c => (
                                <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label className="text-sm text-slate-600">Responsável</Label>
                    <Select
                        value={formData.analyst_id ? String(formData.analyst_id) : "none"}
                        onValueChange={(v) => setFormData({ ...formData, analyst_id: v === "none" ? "" : v })}
                    >
                        <SelectTrigger className="h-10">
                            <SelectValue placeholder="Selecionar" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none">Não designado</SelectItem>
                            {[...analysts].filter(a => a.active !== false).sort((a, b) => a.name.localeCompare(b.name)).map(a => (
                                <SelectItem key={a.id} value={String(a.id)}>{a.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2 flex flex-col justify-end pb-2">
                    <div className="flex items-center gap-2 mb-2">
                        <Switch
                            id="has-support-prevendas"
                            checked={showPreVendasSupport}
                            onCheckedChange={(checked) => {
                                setShowPreVendasSupport(checked);
                                if (!checked) {
                                    setFormData(prev => ({ ...prev, support_analyst_id: '' }));
                                }
                            }}
                        />
                        <Label htmlFor="has-support-prevendas" className="text-sm text-slate-600 cursor-pointer">
                            Suporte Pré-Vendas?
                        </Label>
                    </div>

                    {showPreVendasSupport && (
                        <Select
                            value={formData.support_analyst_id ? String(formData.support_analyst_id) : "none"}
                            onValueChange={(v) => setFormData({ ...formData, support_analyst_id: v === "none" ? "" : v })}
                        >
                            <SelectTrigger className="h-10">
                                <SelectValue placeholder="Responsável Suporte Pré-Vendas" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">Selecione...</SelectItem>
                                {[...analysts].filter(a => a.active !== false && String(a.id) !== String(formData.analyst_id)).sort((a, b) => a.name.localeCompare(b.name)).map(a => (
                                    <SelectItem key={a.id} value={String(a.id)}>{a.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                </div>

                <div className="space-y-2 flex flex-col justify-end pb-2">
                    <div className="flex items-center gap-2 mb-2">
                        <Switch
                            id="has-support-arquiteto"
                            checked={showArquitetoSupport}
                            onCheckedChange={(checked) => {
                                setShowArquitetoSupport(checked);
                                if (!checked) {
                                    setFormData(prev => ({ ...prev, architect_support_analyst_id: '' }));
                                }
                            }}
                        />
                        <Label htmlFor="has-support-arquiteto" className="text-sm text-slate-600 cursor-pointer">
                            Suporte Arquiteto?
                        </Label>
                    </div>

                    {showArquitetoSupport && (
                        <Select
                            value={formData.architect_support_analyst_id ? String(formData.architect_support_analyst_id) : "none"}
                            onValueChange={(v) => setFormData({ ...formData, architect_support_analyst_id: v === "none" ? "" : v })}
                        >
                            <SelectTrigger className="h-10">
                                <SelectValue placeholder="Responsável Suporte Arquiteto" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">Selecione...</SelectItem>
                                {[...analysts].filter(a => a.active !== false && String(a.id) !== String(formData.analyst_id)).sort((a, b) => a.name.localeCompare(b.name)).map(a => (
                                    <SelectItem key={a.id} value={String(a.id)}>{a.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                </div>

                <div className="space-y-2">
                    <Label className="text-sm text-slate-600">Executivo</Label>
                    <Select
                        value={formData.requester_id ? String(formData.requester_id) : "none"}
                        onValueChange={(v) => setFormData({ ...formData, requester_id: v === "none" ? "" : v })}
                    >
                        <SelectTrigger className="h-10">
                            <SelectValue placeholder="Selecionar" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none">Nenhum</SelectItem>
                            {[...requesters].filter(r => r.active !== false).sort((a, b) => a.name.localeCompare(b.name)).map(r => (
                                <SelectItem key={r.id} value={String(r.id)}>{r.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <DatePicker
                    label="Data Início"
                    value={formData.qualification_date}
                    onChange={(v) => setFormData({ ...formData, qualification_date: v })}
                    disabled={!isGestor && !isNew}
                />

                <DatePicker
                    label="Previsão de Entrega"
                    value={formData.expected_delivery_date}
                    onChange={(v) => setFormData({ ...formData, expected_delivery_date: v })}
                />

                {isGestor && (
                    <DatePicker
                        label="Data Fim"
                        value={formData.delivery_date}
                        onChange={(v) => setFormData({ ...formData, delivery_date: v })}
                    />
                )}

                {showReasonField && (
                    <div className="space-y-2 lg:col-span-2">
                        <Label className="text-sm text-red-600">
                            Motivo da Alteração da Data Fim *
                        </Label>
                        <Input
                            value={formData.delivery_date_change_reason}
                            onChange={(e) => setFormData({ ...formData, delivery_date_change_reason: e.target.value })}
                            placeholder="Informe o motivo da alteração..."
                            className="h-10 border-red-300 focus:border-red-500"
                            required
                        />
                    </div>
                )}

                <div className="space-y-2">
                    <Label className="text-sm text-slate-600">Status</Label>
                    <Select
                        value={formData.status}
                        onValueChange={(v) => {
                            const updates = { status: v };
                            // Auto-set delivery_date when status changes to ENTREGUE
                            if (v === 'ENTREGUE' && !formData.delivery_date) {
                                updates.delivery_date = format(new Date(), 'yyyy-MM-dd');
                            }
                            setFormData({ ...formData, ...updates });
                        }}
                    >
                        <SelectTrigger className="h-10">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {STATUS_LIST.map(s => (
                                <SelectItem key={s} value={s}>{s}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="space-y-2">
                <Label className="text-sm text-slate-600">Observações</Label>
                <Textarea
                    value={formData.observation}
                    onChange={(e) => setFormData({ ...formData, observation: e.target.value })}
                    placeholder="Detalhes adicionais sobre a demanda..."
                    rows={4}
                    className="resize-none"
                />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
                    <X className="w-4 h-4 mr-2" />
                    Cancelar
                </Button>
                {userRole !== 'viewer' && (
                    <Button type="button" onClick={() => submitForm()} disabled={isLoading} className="bg-indigo-600 hover:bg-indigo-700">
                        <Save className="w-4 h-4 mr-2" />
                        {isLoading ? 'Salvando...' : 'Salvar'}
                    </Button>
                )}
            </div>
        </form>
    );
}
