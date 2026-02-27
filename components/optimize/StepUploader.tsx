import React from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, RefreshCw } from 'lucide-react';

interface StepUploaderProps {
    onDrop: (acceptedFiles: File[]) => void;
    loading: boolean;
    onManualEntry: () => void;
}

export function StepUploader({ onDrop, loading, onManualEntry }: StepUploaderProps) {
    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/*': [],
            'application/pdf': ['.pdf']
        },
        multiple: false,
    });

    return (
        <div className="max-w-xl mx-auto">
            <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors
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
                        <p className="text-sm text-gray-500 mt-2">ou clique para selecionar</p>
                        <p className="text-xs text-gray-400 mt-4 font-mono">Suporta PNG, JPG, WEBP e PDF</p>
                    </div>
                )}
            </div>

            <div className="mt-8 text-center">
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
