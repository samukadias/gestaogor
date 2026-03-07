import React from 'react';
import { Download } from 'lucide-react';
import * as XLSX from 'xlsx';

/**
 * Reusable export button component.
 * Exports data to Excel (.xlsx) format using the xlsx library.
 *
 * @param {Object} props
 * @param {Array<Object>} props.data - Array of objects to export
 * @param {string} props.filename - Name of the exported file (without extension)
 * @param {string} [props.sheetName] - Name of the Excel sheet
 * @param {Object} [props.columnMap] - Map of { dataKey: 'Display Name' } for column headers
 * @param {string} [props.label] - Button label text
 * @param {string} [props.className] - Additional CSS classes
 */
const ExportButton = ({
    data = [],
    filename = 'export',
    sheetName = 'Dados',
    columnMap,
    label = 'Exportar',
    className = '',
}) => {
    const handleExport = () => {
        if (!data || data.length === 0) {
            return;
        }

        let exportData = data;

        // If columnMap is provided, remap keys to display names
        if (columnMap) {
            exportData = data.map(row => {
                const newRow = {};
                Object.entries(columnMap).forEach(([key, displayName]) => {
                    let value = row[key];
                    // Format dates
                    if (value && typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}/)) {
                        try {
                            value = new Date(value).toLocaleDateString('pt-BR');
                        } catch (e) {
                            // keep original
                        }
                    }
                    // Format numbers
                    if (typeof value === 'number' && key.includes('valor')) {
                        value = value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                    }
                    newRow[displayName] = value ?? '';
                });
                return newRow;
            });
        }

        const ws = XLSX.utils.json_to_sheet(exportData);

        // Auto-size columns
        const colWidths = Object.keys(exportData[0] || {}).map(key => ({
            wch: Math.max(
                key.length,
                ...exportData.map(row => String(row[key] || '').length)
            ) + 2
        }));
        ws['!cols'] = colWidths;

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, sheetName);
        XLSX.writeFile(wb, `${filename}.xlsx`);
    };

    return (
        <button
            onClick={handleExport}
            disabled={!data || data.length === 0}
            className={`inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200
                ${data && data.length > 0
                    ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20'
                    : 'bg-slate-700/30 text-slate-500 cursor-not-allowed border border-slate-700/30'
                } ${className}`}
            title={data && data.length > 0 ? `Exportar ${data.length} registros` : 'Sem dados para exportar'}
        >
            <Download className="w-4 h-4" />
            {label}
        </button>
    );
};

export default ExportButton;
