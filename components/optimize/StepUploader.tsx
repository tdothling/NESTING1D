import React from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, RefreshCw, FileSpreadsheet, HardDriveUpload } from 'lucide-react';

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
        <div className="w-full max-w-4xl mx-auto space-y-8 font-mono">
            {/* Header Area */}
            <div className="mb-8 border-l-8 border-[var(--color-ink)] pl-4">
                <h2 className="text-3xl font-black uppercase tracking-widest text-[var(--color-ink)] block">
                    NOVA ORDEM DE CORTE
                </h2>
                <p className="text-sm font-bold opacity-60 uppercase tracking-widest mt-1">
                    FORNEÇA OS DADOS DA ESTRUTURA PARA OTIMIZAÇÃO
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 border-4 border-[var(--color-ink)] shadow-[8px_8px_0px_0px_var(--color-ink)]">
                {/* AI Upload Zone */}
                <div
                    {...getRootProps()}
                    className={`border-4 p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 min-h-[300px]
              ${isDragActive
                            ? 'border-[var(--color-accent)] bg-[var(--color-accent)] text-white'
                            : 'border-[var(--color-ink)] hover:border-[var(--color-ink)] hover:bg-[var(--color-ink)] hover:text-[var(--color-bg)] bg-white text-[var(--color-ink)]'}`}
                >
                    <input {...getInputProps()} />
                    {loading ? (
                        <div className="flex flex-col items-center">
                            <RefreshCw className="w-12 h-12 animate-spin mb-6" />
                            <div className="inline-block border-2 border-current px-4 py-2 bg-transparent text-sm font-black uppercase tracking-widest animate-pulse">
                                PROCESSAMENTO IA ATIVO...
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center group">
                            <Upload className="w-16 h-16 mb-6 transition-transform group-hover:-translate-y-2" />
                            <h3 className="text-xl font-black uppercase tracking-widest border-b-2 border-current pb-2 mb-4">
                                LEITURA POR IA
                            </h3>
                            <p className="text-sm font-bold opacity-80 uppercase tracking-widest mb-4 leading-relaxed max-w-[250px]">
                                ARRASTE OU SELECIONE IMAGEM / PDF DO PROJETO
                            </p>
                            <div className="border border-current px-3 py-1 text-[10px] font-bold tracking-widest opacity-60">
                                FORMATOS: PNG, JPG, WEBP, PDF
                            </div>
                        </div>
                    )}
                </div>

                {/* Excel/CSV Upload Zone */}
                <div
                    {...getSpreadsheetRootProps()}
                    className={`border-4 p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 min-h-[300px] bg-white
              ${isSpreadsheetDrag
                            ? 'border-emerald-500 bg-emerald-500 text-white'
                            : 'border-[var(--color-ink)] border-dashed hover:bg-emerald-500 hover:border-emerald-500 hover:border-solid hover:text-white text-[var(--color-ink)]'}`}
                >
                    <input {...getSpreadsheetInputProps()} />
                    <div className="flex flex-col items-center group">
                        <FileSpreadsheet className="w-16 h-16 mb-6 transition-transform group-hover:-translate-y-2" />
                        <h3 className="text-xl font-black uppercase tracking-widest border-b-2 border-current pb-2 mb-4">
                            IMPORTAR PLANILHA
                        </h3>
                        <p className="text-sm font-bold opacity-80 uppercase tracking-widest mb-4 leading-relaxed max-w-[250px]">
                            PROCESSAMENTO EM LOTE VIA ARQUIVO CSV OU EXCEL
                        </p>
                        <div className="flex flex-col gap-2 mt-2">
                            <p className="text-xs font-bold bg-[var(--color-ink)] text-white px-2 py-1 opacity-90 text-left group-hover:bg-emerald-600 transition-colors">
                                <span className="mr-2">■</span> MATERIAL
                            </p>
                            <p className="text-xs font-bold bg-[var(--color-ink)] text-white px-2 py-1 opacity-90 text-left group-hover:bg-emerald-600 transition-colors">
                                <span className="mr-2">■</span> COMPRIMENTO
                            </p>
                            <p className="text-xs font-bold bg-[var(--color-ink)] text-white px-2 py-1 opacity-90 text-left group-hover:bg-emerald-600 transition-colors">
                                <span className="mr-2">■</span> QUANTIDADE
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Manual Entry Separator */}
            <div className="flex items-center justify-center py-4 relative">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t-4 border-[var(--color-ink)]"></div>
                </div>
                <div className="relative bg-[var(--color-bg)] px-6">
                    <span className="text-sm font-black uppercase tracking-widest text-[var(--color-ink)] border-2 border-[var(--color-ink)] py-1 px-4 bg-white">
                        MÉTODO ALTERNATIVO
                    </span>
                </div>
            </div>

            {/* Manual Entry Button */}
            <div className="text-center">
                <button
                    onClick={onManualEntry}
                    className="w-full md:w-auto px-12 py-6 bg-[var(--color-ink)] text-[var(--color-bg)] border-4 border-[var(--color-ink)] font-black text-lg uppercase tracking-widest hover:bg-[var(--color-accent)] hover:border-[var(--color-accent)] hover:text-white transition-all active:scale-95 flex items-center justify-center gap-4 mx-auto shadow-[6px_6px_0px_0px_var(--color-ink)] hover:shadow-none hover:translate-y-[6px] hover:translate-x-[6px]"
                >
                    <HardDriveUpload className="w-6 h-6" />
                    DIGITAÇÃO MANUAL DE DADOS
                </button>
            </div>
        </div>
    );
}
