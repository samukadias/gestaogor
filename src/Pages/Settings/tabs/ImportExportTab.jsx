import React, { useState } from 'react';
import { fluxoApi } from '@/api/fluxoClient';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { FileDown, FileUp, Database, Loader2, AlertCircle, CheckCircle, Table as TableIcon, Download } from "lucide-react";
import { toast } from "sonner";
import { format } from 'date-fns';
import * as XLSX from 'xlsx';

// Helper: Excel Serial Date to JS Date
const excelDateToJS = (serial) => {
    if (!serial) return null;

    // Se for número (Serial Excel)
    if (typeof serial === 'number') {
        const utc_days = Math.floor(serial - 25569);
        const utc_value = utc_days * 86400;
        const date_info = new Date(utc_value * 1000);
        return date_info.toISOString();
    }

    // Se for string "DD/MM/YYYY" ou "D/M/YY"
    if (typeof serial === 'string' && serial.includes('/')) {
        try {
            const parts = serial.split('/');
            if (parts.length === 3) {
                const d = parts[0].padStart(2, '0');
                const m = parts[1].padStart(2, '0');
                let y = parts[2];
                if (y.length === 2) y = `20${y}`; // Assume 20xx
                return new Date(`${y}-${m}-${d}`).toISOString();
            }
        } catch (e) { return null; }
    }

    // Se for ISO ou outro formato string, tenta direto
    return serial;
};

const cleanCurrency = (val) => {
    if (typeof val === 'number') return val;
    if (!val) return 0;
    // Remove R$, espaços, pontos de milhar, e troca vírgula decimal por ponto
    return parseFloat(String(val).replace(/[R$\s.]/g, '').replace(',', '.')) || 0;
};

// ExportCard component for data export
const ExportCard = ({ title, description, fetchFn, filename, sheetName, columnMap, isProcessing, setIsProcessing }) => {
    const [exporting, setExporting] = useState(false);
    const [recordCount, setRecordCount] = useState(null);

    const handleExport = async () => {
        setExporting(true);
        setIsProcessing(true);
        try {
            const data = await fetchFn();
            if (!data || data.length === 0) {
                toast.warning(`Nenhum registro encontrado para "${title}".`);
                return;
            }

            const exportData = data.map(row => {
                const newRow = {};
                Object.entries(columnMap).forEach(([key, displayName]) => {
                    let value = row[key];
                    // Format dates
                    if (value && typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}/)) {
                        try { value = new Date(value).toLocaleDateString('pt-BR'); } catch (e) { /* keep */ }
                    }
                    // Format booleans
                    if (typeof value === 'boolean') value = value ? 'Sim' : 'Não';
                    newRow[displayName] = value ?? '';
                });
                return newRow;
            });

            const ws = XLSX.utils.json_to_sheet(exportData);
            // Auto-size columns
            const colWidths = Object.keys(exportData[0] || {}).map(key => ({
                wch: Math.max(key.length, ...exportData.slice(0, 100).map(row => String(row[key] || '').length)) + 2
            }));
            ws['!cols'] = colWidths;

            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, sheetName);
            XLSX.writeFile(wb, `${filename}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);

            setRecordCount(data.length);
            toast.success(`${data.length} registros exportados com sucesso!`);
        } catch (err) {
            console.error('Export error:', err);
            toast.error(`Erro ao exportar "${title}": ${err.message}`);
        } finally {
            setExporting(false);
            setIsProcessing(false);
        }
    };

    return (
        <Card className="border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                    <div>
                        <h4 className="text-sm font-semibold text-slate-800">{title}</h4>
                        <p className="text-xs text-slate-500 mt-0.5">{description}</p>
                    </div>
                    <FileDown className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-3 text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                    onClick={handleExport}
                    disabled={exporting || isProcessing}
                >
                    {exporting ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Exportando...
                        </>
                    ) : (
                        <>
                            <Download className="w-4 h-4 mr-2" />
                            Exportar Excel
                        </>
                    )}
                </Button>
                {recordCount !== null && (
                    <p className="text-xs text-emerald-600 text-center mt-2 flex items-center justify-center">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        {recordCount} registros exportados
                    </p>
                )}
            </CardContent>
        </Card>
    );
};

export default function ImportExportTab() {
    const [importType, setImportType] = useState('demands');
    const [fileData, setFileData] = useState([]);
    const [previewData, setPreviewData] = useState([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [fileName, setFileName] = useState(null);
    const [logs, setLogs] = useState([]);
    const [autoCreateDeps, setAutoCreateDeps] = useState(true);

    const user = JSON.parse(localStorage.getItem('fluxo_user') || '{}');

    const importOptions = [
        {
            id: 'demands',
            label: 'Demandas (CDPC)',
            headers: ['Titulo', 'Descricao', 'Prioridade', 'Solicitante', 'Analista', 'Cliente']
        },
        {
            id: 'clients',
            label: 'Clientes (Base Geral)',
            headers: ['Nome', 'Status']
        },
        {
            id: 'contracts_cocr',
            label: 'Contratos COCR (Prazos)',
            headers: ['Objeto', 'DataInicio', 'DataFim', 'NomeCliente', 'Tipo']
        },
        {
            id: 'contracts_cvac',
            label: 'Contratos CVAC (Financeiro)',
            headers: ['Objeto', 'ValorTotal', 'ValorMensal', 'NomeCliente', 'NumeroContrato']
        }
    ];

    const handleDownloadTemplate = () => {
        const option = importOptions.find(o => o.id === importType);
        if (!option) return;

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet([option.headers]);
        XLSX.utils.book_append_sheet(wb, ws, "Template");
        XLSX.writeFile(wb, `modelo_importacao_${importType}.xlsx`);
        toast.success("Modelo baixado! Preencha e faça o upload.");
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setFileName(file.name);
        const reader = new FileReader();
        reader.onload = (evt) => {
            const bstr = evt.target.result;
            const wb = XLSX.read(bstr, { type: 'binary' });
            const wsname = wb.SheetNames[0];
            const ws = wb.Sheets[wsname];
            const data = XLSX.utils.sheet_to_json(ws);

            if (data.length === 0) {
                toast.error("Planilha vazia ou formato inválido");
                return;
            }

            setFileData(data);
            setPreviewData(data.slice(0, 5));
            setLogs([]); // Clear logic
        };
        reader.readAsBinaryString(file);
    };

    // Helper para buscar ou criar entidades em memória/API
    const findOrCreate = async (map, entityName, name, createFn) => {
        if (!name) return null;

        const normalized = name.trim();
        if (map.has(normalized.toLowerCase())) {
            return map.get(normalized.toLowerCase());
        }

        if (autoCreateDeps) {
            try {
                const newEntity = await createFn(normalized);
                if (newEntity && newEntity.id) {
                    map.set(normalized.toLowerCase(), newEntity.id);
                    return newEntity.id;
                }
            } catch (e) {
                console.error(`Erro ao criar ${entityName}: ${name}`, e);
                return null;
            }
        }
        return null;
    };

    const processImport = async () => {
        if (!fileData.length) return;

        setIsProcessing(true);
        setProgress(0);
        setLogs([]);

        let successCount = 0;
        let errorCount = 0;
        const newLogs = [];

        try {
            toast.info("Carregando dependências...");
            const [users, clients, cycles] = await Promise.all([
                fluxoApi.entities.User.list(),
                fluxoApi.entities.Client.list(),
                fluxoApi.entities.Cycle.list()
            ]);

            // Mapas de Lookup (Case insensitive keys)
            const userMap = new Map(users.map(u => [u.name.toLowerCase(), u.id]));
            const clientMap = new Map(clients.map(c => [c.name.toLowerCase(), c.id]));
            const cycleMap = new Map(cycles.map(c => [c.name.toLowerCase(), c.id]));

            const total = fileData.length;

            // 2. Processamento
            for (let i = 0; i < total; i++) {
                const row = fileData[i];
                try {
                    // Normalização de chaves para Case Insensitive
                    const normalizedRow = {};
                    Object.keys(row).forEach(k => {
                        if (row[k] !== undefined && row[k] !== null) {
                            normalizedRow[String(k).trim().toLowerCase()] = row[k];
                        }
                    });

                    // Log para debug das colunas encontradas na primeira linha
                    if (i === 0) {
                        newLogs.push(`Colunas detectadas no Excel: ${Object.keys(normalizedRow).join(', ')}`);
                    }

                    const getCol = (keys) => {
                        for (let k of keys) {
                            const val = normalizedRow[String(k).trim().toLowerCase()];
                            if (val !== undefined) return val;
                        }
                        return null;
                    };

                    if (importType === 'demands') {
                        /* 
                           Headers esperados: Titulo, Descricao, Prioridade, Solicitante, Analista, Cliente
                        */
                        // Mapeamento específico para "Lista VIP" e genéricos
                        const titulo = getCol(['Produto', 'PRODUTO', 'Titulo', 'Title', 'Product', 'Nome', 'Assunto', 'Demanda']);
                        const descricao = getCol(['Descricao', 'Description', 'Observation', 'Observacao', 'Detalhes', 'Escopo']) || '-';
                        const numDemanda = getCol(['NºDEMANDA', 'NDEMANDA', 'DemandNumber', 'Numero']) || `DEM-${Math.floor(Math.random() * 100000)}`;
                        const cicloName = getCol(['CICLO', 'Ciclo', 'Cycle']);
                        const artefato = getCol(['ARTEFATO', 'Artefato', 'Artifact']);
                        const prazo = getCol(['PREVISÃO', 'Previsao', 'Deadline', 'ExpectedDate']);
                        const qualificacao = getCol(['QUALIFIED', 'Qualified', 'Qualificacao', 'DataQualificacao']);
                        const statusImportado = getCol(['STATUS', 'Status']);

                        // Mapeamento de Pessoas
                        const solicitanteName = getCol(['SOLICITANTE', 'Solicitante', 'Requester']);
                        const analistaName = getCol(['RESPONSÁVEL', 'Responsavel', 'Analista', 'Owner']); // 'Responsável' da Lista VIP
                        const clienteName = getCol(['CLIENTE', 'Cliente', 'Client']);

                        // Resolve IDs
                        const requesterId = await findOrCreate(userMap, 'Solicitante', solicitanteName, async (name) => {
                            newLogs.push(`Criando Solicitante: ${name}`);
                            return fluxoApi.entities.User.create({
                                name,
                                email: `${name.replace(/\s+/g, '.').toLowerCase()}.${Date.now()}@fluxo.temp`,
                                password: 'mudar123',
                                role: 'requester',
                                department: 'CDPC'
                            });
                        }) || user.id;

                        const analystId = await findOrCreate(userMap, 'Analista', analistaName, async (name) => {
                            newLogs.push(`Criando Analista: ${name}`);
                            return fluxoApi.entities.User.create({
                                name,
                                email: `${name.replace(/\s+/g, '.').toLowerCase()}.${Date.now()}@fluxo.temp`,
                                password: 'mudar123',
                                role: 'analyst',
                                department: 'CDPC'
                            });
                        });

                        const clientId = await findOrCreate(clientMap, 'Cliente', clienteName, async (name) => {
                            newLogs.push(`Criando Cliente: ${name}`);
                            return fluxoApi.entities.Client.create({ name, active: true });
                        });

                        const cycleId = await findOrCreate(cycleMap, 'Ciclo', cicloName, async (name) => {
                            newLogs.push(`Criando Ciclo: ${name}`);
                            return fluxoApi.entities.Cycle.create({ name });
                        });


                        await fluxoApi.entities.Demand.create({
                            product: titulo || 'Sem Título',
                            observation: descricao,
                            complexity: getCol(['Prioridade', 'Priority', 'Complexity', 'Complexidade', 'Nivel']) || 'Medium',
                            demand_number: String(numDemanda),
                            status: statusImportado || 'PENDENTE TRIAGEM',
                            artifact: artefato,
                            expected_delivery_date: excelDateToJS(prazo),
                            qualification_date: excelDateToJS(qualificacao),

                            requester_id: requesterId,
                            analyst_id: analystId,
                            client_id: clientId,
                            cycle_id: cycleId
                        });
                    }
                    else if (importType === 'clients') {
                        const name = getCol(['Nome', 'Name']);
                        if (name && !clientMap.has(name.toLowerCase())) {
                            await fluxoApi.entities.Client.create({
                                name,
                                active: String(getCol(['Status'])).toLowerCase() === 'ativo'
                            });
                        }
                    }
                    else if (importType === 'contracts_cocr') {
                        /* 
                           Mapeamento COCR:
                           Contrato, Objeto, Empresa, Valor, Vigência, Analista, SEI
                        */
                        const numContrato = getCol(['Contrato', 'NumeroContrato', 'Nº Contrato']) || `CTR-${Date.now()}`;
                        const termo = getCol(['Termo', 'Aditivo', 'TA']) || '';

                        // Busca colunas variadas
                        const objeto = getCol(['Objeto', 'Descricao', 'Object']);
                        const empresa = getCol(['Empresa', 'Contratada', 'Fornecedor', 'Company']);
                        const cliente = getCol(['Cliente', 'Orgao', 'Client']);
                        const analista = getCol(['Analista', 'Gestor', 'Fiscal', 'Responsavel']);

                        // Valores financeiros
                        const valTotal = cleanCurrency(getCol(['Valor', 'Valor Total', 'Valor Global', 'Total Value']));
                        const valFaturado = cleanCurrency(getCol(['Faturado', 'Valor Faturado', 'Executado']));
                        const valAFaturar = cleanCurrency(getCol(['A Faturar', 'Saldo', 'Valor a Faturar']));

                        // Datas
                        const dtInicio = excelDateToJS(getCol(['Inicio', 'Vigencia Inicio', 'Data Inicio', 'Start Date']));
                        const dtFim = excelDateToJS(getCol(['Fim', 'Vigencia Fim', 'Termino', 'Data Fim', 'End Date']));

                        const numSEI = getCol(['SEI', 'Processo SEI', 'Processo']);

                        // Verifica duplicidade básica pelo número do contrato (opcional)
                        // A constraint unique no DB vai barrar se for igual, então deixamos o try/catch tratar.

                        await fluxoApi.entities.Contract.create({
                            contract_number: String(numContrato),
                            termo: String(termo),
                            object: objeto,
                            company_name: empresa,
                            cliente: cliente || empresa, // Fallback
                            analista_responsavel: analista,

                            total_value: valTotal,
                            valor_contrato: valTotal, // Redundância legado
                            valor_faturado: valFaturado,
                            valor_a_faturar: valAFaturar,
                            current_balance: valAFaturar,

                            start_date: dtInicio,
                            end_date: dtFim,
                            data_inicio_efetividade: dtInicio,
                            data_fim_efetividade: dtFim,

                            numero_processo_sei_nosso: numSEI,
                            status: 'active'
                        });
                    }
                    else if (importType === 'contracts_cvac') {
                        // Placeholder CVAC
                        await new Promise(r => setTimeout(r, 50));
                    }    // Expandir lógica real conforme necessidade


                    successCount++;
                } catch (err) {
                    const errorMsg = err.response?.data?.error || err.message || 'Desconhecido';
                    newLogs.push(`Linha ${i + 1} Erro: ${JSON.stringify(errorMsg)}`);
                    errorCount++;
                }

                // Update UI every 5 items or end
                if (i % 5 === 0 || i === total - 1) {
                    setProgress(Math.round(((i + 1) / total) * 100));
                }
            }

        } catch (globalErr) {
            newLogs.push(`Erro Crítico: ${globalErr.message}`);
            toast.error("Falha ao iniciar importação");
        }

        setIsProcessing(false);
        setFileData([]);
        setPreviewData([]);
        setFileName(null);
        setLogs(newLogs);

        if (errorCount === 0 && successCount > 0) {
            toast.success(`${successCount} registros importados com sucesso!`);
        } else {
            toast.warning(`Importação finalizada. Sucessos: ${successCount}, Erros: ${errorCount}`);
        }
    };

    const handleClearAllDemands = async () => {
        if (!confirm("ATENÇÃO: Você está prestes a excluir TODAS as demandas do sistema. Deseja continuar?")) return;
        if (!confirm("Tem certeza absoluta? Esta ação não pode ser desfeita e apagará todo o histórico.")) return;

        setIsProcessing(true);
        setLogs(["Iniciando limpeza da base de dados..."]);
        try {
            const allDemands = await fluxoApi.entities.Demand.list();
            setLogs(prev => [...prev, `Encontradas ${allDemands.length} demandas para excluir.`]);

            let deleted = 0;
            for (const d of allDemands) {
                try {
                    await fluxoApi.entities.Demand.delete(d.id);
                    deleted++;
                    if (deleted % 5 === 0) setLogs(prev => [...prev, `Excluído ${deleted}/${allDemands.length}`]);
                } catch (e) {
                    setLogs(prev => [...prev, `Erro ao excluir ID ${d.id}: ${e.message}`]);
                }
            }
            toast.success("Base de demandas limpa com sucesso!");
            setLogs(prev => [...prev, "Limpeza concluída."]);
        } catch (err) {
            toast.error("Erro ao limpar base: " + err.message);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Coluna de Controle */}
                <Card className="md:col-span-1 border-0 shadow-sm rounded-xl h-fit">
                    <CardHeader>
                        <CardTitle className="text-lg">Nova Importação</CardTitle>
                        <CardDescription>Upload de dados em massa</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Tipo de Dado</Label>
                            <Select value={importType} onValueChange={setImportType}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {importOptions.map(opt => (
                                        <SelectItem key={opt.id} value={opt.id}>{opt.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex items-center space-x-2 py-2">
                            <Checkbox
                                id="autoCreate"
                                checked={autoCreateDeps}
                                onCheckedChange={setAutoCreateDeps}
                            />
                            <Label htmlFor="autoCreate" className="text-xs text-slate-600">
                                Criar Usuários/Clientes automaticamente se não existirem
                            </Label>
                        </div>

                        <div className="pt-2 border-t border-slate-100 space-y-3">
                            <Button variant="outline" size="sm" className="w-full justify-start" onClick={handleDownloadTemplate}>
                                <Download className="w-4 h-4 mr-2 text-indigo-600" />
                                Baixar Modelo (.xlsx)
                            </Button>

                            <div className="relative">
                                <Button variant="secondary" className="w-full cursor-pointer relative">
                                    <FileUp className="w-4 h-4 mr-2" />
                                    {fileName ? 'Arquivo Pronto' : 'Selecionar Arquivo'}
                                    <input
                                        type="file"
                                        accept=".xlsx, .xls, .csv"
                                        onChange={handleFileUpload}
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                    />
                                </Button>
                            </div>
                            {fileName && (
                                <p className="text-xs text-emerald-600 flex items-center justify-center font-medium">
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    {fileName}
                                </p>
                            )}
                        </div>

                        {fileData.length > 0 && (
                            <Button
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white mt-4"
                                onClick={processImport}
                                disabled={isProcessing}
                            >
                                {isProcessing ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        {progress}%
                                    </>
                                ) : (
                                    <>
                                        <Database className="w-4 h-4 mr-2" />
                                        Iniciar Importação
                                    </>
                                )}
                            </Button>
                        )}
                    </CardContent>
                </Card>

                {/* Coluna de Log e Preview */}
                <Card className="md:col-span-2 border-0 shadow-sm rounded-xl flex flex-col h-[500px]">
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <TableIcon className="w-5 h-5 text-slate-500" />
                            Status da Operação
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-auto">
                        {isProcessing && (
                            <div className="mb-4">
                                <Progress value={progress} className="h-2" />
                            </div>
                        )}

                        {logs.length > 0 ? (
                            <div className="bg-slate-900 text-slate-200 p-4 rounded-lg font-mono text-xs h-full overflow-y-auto">
                                {logs.map((log, i) => (
                                    <div key={i} className="mb-1 border-b border-slate-800 pb-1 last:border-0">
                                        {log}
                                    </div>
                                ))}
                            </div>
                        ) : !fileData.length ? (
                            <div className="flex flex-col items-center justify-center h-full text-slate-400 border-2 border-dashed border-slate-100 rounded-lg bg-slate-50/50">
                                <FileDown className="w-12 h-12 mb-3 opacity-20" />
                                <p>Aguardando arquivo...</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto rounded-lg border border-slate-200">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-slate-50">
                                            {previewData.length > 0 && Object.keys(previewData[0]).map((header) => (
                                                <TableHead key={header} className="text-xs font-bold uppercase whitespace-nowrap">
                                                    {header}
                                                </TableHead>
                                            ))}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {previewData.map((row, i) => (
                                            <TableRow key={i}>
                                                {Object.values(row).map((val, j) => (
                                                    <TableCell key={j} className="text-xs whitespace-nowrap">
                                                        {String(val)}
                                                    </TableCell>
                                                ))}
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                                <div className="p-2 bg-indigo-50 text-indigo-700 text-xs text-center border-t border-indigo-100 font-medium">
                                    Detectamos {fileData.length} linhas. Clique em Iniciar para processar.
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* ===================== EXPORTAÇÃO ===================== */}
            <div className="pt-6 border-t border-slate-200">
                <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                    <FileDown className="w-5 h-5 text-emerald-600" />
                    Exportação de Dados
                </h3>
                <p className="text-sm text-slate-500 mb-4">Exporte os dados do sistema para planilhas Excel (.xlsx).</p>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <ExportCard
                        title="Demandas (CDPC)"
                        description="Todas as demandas com status, responsáveis e datas"
                        fetchFn={() => fluxoApi.entities.Demand.list()}
                        filename="demandas_cdpc"
                        sheetName="Demandas"
                        columnMap={{
                            demand_number: 'Nº Demanda',
                            product: 'Produto',
                            status: 'Status',
                            stage: 'Etapa',
                            complexity: 'Complexidade',
                            artifact: 'Artefato',
                            created_date: 'Data Criação',
                            qualification_date: 'Data Qualificação',
                            expected_delivery_date: 'Previsão Entrega',
                            delivery_date: 'Data Entrega',
                            observation: 'Observação',
                        }}
                        isProcessing={isProcessing}
                        setIsProcessing={setIsProcessing}
                    />
                    <ExportCard
                        title="Clientes"
                        description="Base geral de clientes cadastrados"
                        fetchFn={() => fluxoApi.entities.Client.list()}
                        filename="clientes"
                        sheetName="Clientes"
                        columnMap={{
                            id: 'ID',
                            name: 'Nome',
                            sigla: 'Sigla',
                            active: 'Ativo',
                        }}
                        isProcessing={isProcessing}
                        setIsProcessing={setIsProcessing}
                    />
                    <ExportCard
                        title="Contratos COCR (Prazos)"
                        description="Todos os contratos do módulo de prazos"
                        fetchFn={() => fluxoApi.entities.Contract.list()}
                        filename="contratos_cocr"
                        sheetName="Contratos COCR"
                        columnMap={{
                            contrato: 'Contrato',
                            termo: 'Termo',
                            objeto: 'Objeto',
                            cliente: 'Cliente',
                            analista_responsavel: 'Analista Responsável',
                            status: 'Status',
                            data_inicio_efetividade: 'Início Vigência',
                            data_fim_efetividade: 'Fim Vigência',
                            valor_contrato: 'Valor Contrato',
                            valor_faturado: 'Valor Faturado',
                            valor_a_faturar: 'Valor a Faturar',
                            numero_processo_sei_nosso: 'Processo SEI',
                        }}
                        isProcessing={isProcessing}
                        setIsProcessing={setIsProcessing}
                    />
                    <ExportCard
                        title="Contratos CVAC (Financeiro)"
                        description="Todos os contratos financeiros"
                        fetchFn={() => fluxoApi.entities.FinanceContract.list()}
                        filename="contratos_cvac"
                        sheetName="Contratos CVAC"
                        columnMap={{
                            pd_number: 'Nº PD',
                            client_name: 'Cliente',
                            responsible_analyst: 'Analista Responsável',
                            sei_process_number: 'Processo SEI',
                            created_at: 'Data Cadastro',
                        }}
                        isProcessing={isProcessing}
                        setIsProcessing={setIsProcessing}
                    />
                    <ExportCard
                        title="Atestações Mensais"
                        description="Histórico de atestações dos contratos financeiros"
                        fetchFn={() => fluxoApi.entities.MonthlyAttestation.list()}
                        filename="atestacoes_mensais"
                        sheetName="Atestações"
                        columnMap={{
                            reference_month: 'Mês Referência',
                            client_name: 'Cliente',
                            pd_number: 'Nº PD',
                            responsible_analyst: 'Analista',
                            report_generation_date: 'Data Relatório',
                            status: 'Status',
                        }}
                        isProcessing={isProcessing}
                        setIsProcessing={setIsProcessing}
                    />
                    <ExportCard
                        title="Usuários"
                        description="Lista de todos os usuários do sistema"
                        fetchFn={() => fluxoApi.entities.User.list()}
                        filename="usuarios"
                        sheetName="Usuários"
                        columnMap={{
                            id: 'ID',
                            name: 'Nome',
                            email: 'Email',
                            role: 'Perfil',
                            department: 'Departamento',
                        }}
                        isProcessing={isProcessing}
                        setIsProcessing={setIsProcessing}
                    />
                </div>
            </div>

            {/* Danger Zone */}
            <div className="pt-8 border-t border-slate-200">
                <h3 className="text-sm font-semibold text-red-600 mb-4 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Zona de Perigo
                </h3>
                <div className="p-4 bg-red-50 border border-red-100 rounded-lg flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-red-900">Limpar Base de Demandas</p>
                        <p className="text-xs text-red-600 mt-1">Exclui todas as demandas e históricos. Usuários e clientes são mantidos.</p>
                    </div>
                    <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleClearAllDemands}
                        disabled={isProcessing}
                    >
                        {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Excluir Tudo"}
                    </Button>
                </div>
            </div>
        </div>
    );
}
