import React from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, RefreshCw, FileSpreadsheet } from 'lucide-react';

interface StepUploaderProps {
    onDrop: (acceptedFiles: File[]) => void;
    onSpreadsheet: (file: File) => void;
    loading: boolean;
    onManualEntry: () => void;
}

export function StepUploader({ onDrop, onSpreadsheet, loading, onManualEntry }: StepUploaderProps) {
    // Dropzone for images/PDFs (Gemini AI)
    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/*': [],
            'application/pdf': ['.pdf']
        },
        multiple: false,
    });

    // Dropzone for Excel/CSV
    const { getRootProps: getSpreadsheetRootProps, getInputProps: getSpreadsheetInputProps, isDragActive: isSpreadsheetDrag } = useDropzone({
        onDrop: (files) => { if (files.length > 0) onSpreadsheet(files[0]); },
        accept: {
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
            'application/vnd.ms-excel': ['.xls'],
            'text/csv': ['.csv'],
        },
        multiple: false,
    });

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            {/* AI Upload Zone */}
            <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-[var(--color-accent)] bg-orange-50' : 'border-gray-300 hover:border-gray-400 bg-white'}`}
            >
                <input {...getInputProps()} />
                {loading ? (
                    <div className="flex flex-col items-center">
                        <RefreshCw className="w-10 h-10 text-[var(--color-accent)] animate-spin mb-4" />
                        <p className="text-gray-500 font-mono">Analisando documento com Gemini AI...</p>
                    </div>
                ) : (
                    <div className="flex flex-col items-center">
                        <Upload className="w-10 h-10 text-gray-400 mb-4" />
                        <p className="text-lg font-medium text-gray-900">Arraste uma imagem ou PDF da tabela aqui</p>
                        <p className="text-sm text-gray-500 mt-2">A IA vai ler e extrair os dados automaticamente</p>
                        <p className="text-xs text-gray-400 mt-4 font-mono">Suporta PNG, JPG, WEBP e PDF</p>
                    </div>
                )}
            </div>

            {/* Excel/CSV Upload Zone */}
            <div
                {...getSpreadsheetRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${isSpreadsheetDrag ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:border-gray-400 bg-white'}`}
            >
                <input {...getSpreadsheetInputProps()} />
                <div className="flex flex-col items-center">
                    <FileSpreadsheet className="w-8 h-8 text-green-600 mb-3" />
                    <p className="text-base font-medium text-gray-900">Importar Planilha Excel ou CSV</p>
                    <p className="text-xs text-gray-500 mt-1">Colunas esperadas: <span className="font-mono">Material, Comprimento, Quantidade</span></p>
                    <p className="text-xs text-gray-400 mt-2 font-mono">Suporta .xlsx, .xls e .csv</p>
                </div>
            </div>

            <div className="text-center">
                <p className="text-sm text-gray-500 mb-4">- OU -</p>
                <button
                    onClick={onManualEntry}
                    className="text-[var(--color-accent)] hover:text-[var(--color-ink)] font-medium text-sm"
                >
                    Inserir dados manualmente &rarr;
                </button>
            </div>
        </div>
    );
}
