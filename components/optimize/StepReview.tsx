import React from 'react';
import { CutRequest } from '@/lib/types';
import { Plus, Trash2, ArrowRight, RefreshCw } from 'lucide-react';

interface StepReviewProps {
    requests: CutRequest[];
    globalMultiplier: number;
    setGlobalMultiplier: (n: number) => void;
    applyMultiplier: () => void;
    updateRequest: (id: string, field: keyof CutRequest, value: any) => void;
    addRequest: () => void;
    removeRequest: (id: string) => void;
    uniqueMaterials: string[];
    standardBarLengths: Record<string, number>;
    setStandardBarLengths: React.Dispatch<React.SetStateAction<Record<string, number>>>;
    maxScrapLength: number;
    setMaxScrapLength: (n: number) => void;
    onBack: () => void;
    onOptimize: () => void;
    loading: boolean;
}

export function StepReview({
    requests,
    globalMultiplier,
    setGlobalMultiplier,
    applyMultiplier,
    updateRequest,
    addRequest,
    removeRequest,
    uniqueMaterials,
    standardBarLengths,
    setStandardBarLengths,
    maxScrapLength,
    setMaxScrapLength,
    onBack,
    onOptimize,
    loading
}: StepReviewProps) {
    return (
        <div className="space-y-6">
            {/* Multiplier Tool */}
            <div className="bg-white shadow rounded-lg border border-[var(--color-line)] p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h3 className="text-sm font-medium text-gray-900 font-mono">Multiplicador de Projeto</h3>
                    <p className="text-xs text-gray-500">Vai produzir várias unidades iguais? Multiplique todas as quantidades de uma vez.</p>
                </div>
                <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500 font-mono">x</span>
                    <input
                        type="number"
                        min="1"
                        className="w-20 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        value={globalMultiplier}
                        onChange={(e) => setGlobalMultiplier(Math.max(1, Number(e.target.value)))}
                    />
                    <button
                        onClick={applyMultiplier}
                        disabled={globalMultiplier <= 1 || requests.length === 0}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed hidden sm:inline-flex"
                    >
                        Aplicar a Todos
                    </button>
                    <button
                        onClick={applyMultiplier}
                        disabled={globalMultiplier <= 1 || requests.length === 0}
                        className="inline-flex sm:hidden items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Aplicar
                    </button>
                </div>
            </div>

            {/* Editor Table */}
            <div className="bg-white shadow rounded-lg border border-[var(--color-line)] overflow-hidden">
                <div className="px-4 py-5 sm:px-6 flex justify-between items-center bg-gray-50 border-b border-[var(--color-line)]">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 font-mono">Itens para Corte</h3>
                    <button onClick={addRequest} className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-[var(--color-ink)] hover:bg-gray-800">
                        <Plus className="h-3 w-3 mr-1" /> Adicionar
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-mono">Material</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-mono">Comprimento (mm)</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-mono">Qtd</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-mono">Peso (Kg/m)</th>
                                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider font-mono" title="Pular Otimização de Barra (ex: Chapas já cortadas)">Direto p/ Compra</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-mono">Descrição</th>
                                <th scope="col" className="relative px-6 py-3">
                                    <span className="sr-only">Ações</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {requests.map((req) => (
                                <tr key={req.id}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <input
                                            type="text"
                                            value={req.material}
                                            onChange={(e) => updateRequest(req.id, 'material', e.target.value)}
                                            className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                        />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <input
                                            type="number"
                                            value={req.length}
                                            onChange={(e) => updateRequest(req.id, 'length', Number(e.target.value))}
                                            className="block w-24 border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                        />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <input
                                            type="number"
                                            value={req.quantity}
                                            onChange={(e) => updateRequest(req.id, 'quantity', Number(e.target.value))}
                                            className="block w-20 border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                        />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={req.weightKgM || ''}
                                            placeholder="Opcional"
                                            onChange={(e) => updateRequest(req.id, 'weightKgM', Number(e.target.value))}
                                            className="block w-24 border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                        />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        <input
                                            type="checkbox"
                                            checked={req.skipOptimization || false}
                                            onChange={(e) => updateRequest(req.id, 'skipOptimization', e.target.checked)}
                                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                        />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <input
                                            type="text"
                                            value={req.description || ''}
                                            onChange={(e) => updateRequest(req.id, 'description', e.target.value)}
                                            className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                        />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button onClick={() => removeRequest(req.id)} className="text-red-600 hover:text-red-900">
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Optimization Settings */}
            <div className="bg-white shadow rounded-lg border border-[var(--color-line)] p-6">
                <h3 className="text-lg font-medium text-gray-900 font-mono mb-4">Configurações de Otimização</h3>
                <p className="text-sm text-gray-500 mb-4">Defina o comprimento padrão da barra de compra para cada material.</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {uniqueMaterials.map(material => (
                        <div key={material} className="bg-gray-50 p-3 rounded-md border border-gray-200">
                            <label htmlFor={`len-${material}`} className="block text-xs font-medium text-gray-700 font-mono truncate mb-1" title={material}>
                                {material}
                            </label>
                            <div className="relative rounded-md shadow-sm">
                                <input
                                    type="number"
                                    id={`len-${material}`}
                                    className="focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                    placeholder="6000"
                                    value={standardBarLengths[material] || 6000}
                                    onChange={(e) => setStandardBarLengths(prev => ({ ...prev, [material]: Number(e.target.value) }))}
                                />
                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                    <span className="text-gray-500 sm:text-xs">mm</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-6 border-t border-gray-200 pt-6">
                    <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                        <label htmlFor="max-scrap" className="block text-sm font-medium text-gray-700 font-mono mb-1">
                            Comprimento Máximo de Sucata
                        </label>
                        <p className="text-xs text-gray-500 mb-3">Retalhos menores que este valor não retornarão ao estoque (considerados sucata/perda total).</p>
                        <div className="relative rounded-md shadow-sm max-w-[200px]">
                            <input
                                type="number"
                                id="max-scrap"
                                className="focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                placeholder="1000"
                                value={maxScrapLength}
                                onChange={(e) => setMaxScrapLength(Number(e.target.value))}
                            />
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                <span className="text-gray-500 sm:text-xs">mm</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex justify-end space-x-3">
                <button
                    onClick={onBack}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                    Voltar
                </button>
                <button
                    onClick={onOptimize}
                    disabled={loading}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-[var(--color-accent)] hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                    {loading ? (
                        <>
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Processando...
                        </>
                    ) : (
                        <>
                            Otimizar Cortes <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
