import React from 'react';
import { OptimizationResult } from '@/lib/types';
import { AlertCircle, ShoppingCart, Download, MessageCircle, Save } from 'lucide-react';

interface StepResultsProps {
    result: OptimizationResult;
    projectName: string;
    setProjectName: (name: string) => void;
    autoUpdateStock: boolean;
    setAutoUpdateStock: (b: boolean) => void;
    onBack: () => void;
    onSave: () => void;
    onDownloadPDF: () => void;
    onWhatsApp: () => void;
    loading: boolean;
}

export function StepResults({
    result,
    projectName,
    setProjectName,
    autoUpdateStock,
    setAutoUpdateStock,
    onBack,
    onSave,
    onDownloadPDF,
    onWhatsApp,
    loading
}: StepResultsProps) {
    return (
        <div className="space-y-6">
            {/* Summary */}
            <div className="bg-white shadow rounded-lg border border-[var(--color-line)] p-6">
                <h2 className="text-lg font-medium text-gray-900 font-mono mb-4">Resumo da Otimização</h2>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-4">
                    <div className="bg-gray-50 overflow-hidden rounded-lg p-4 border border-gray-200">
                        <dt className="text-sm font-medium text-gray-500 truncate">Total de Barras Usadas</dt>
                        <dd className="mt-1 text-3xl font-semibold text-gray-900">{result.totalStockUsed}</dd>
                    </div>
                    <div className="bg-gray-50 overflow-hidden rounded-lg p-4 border border-gray-200">
                        <dt className="text-sm font-medium text-gray-500 truncate">Sucata (Perda Real)</dt>
                        <dd className="mt-1 text-3xl font-semibold text-red-600">
                            {(result.totalTrueWaste / 1000).toFixed(2)} <span className="text-xl">m</span>
                            {result.totalTrueWasteKg > 0 && (
                                <span className="block text-sm text-red-500 font-normal">~ {result.totalTrueWasteKg} Kg</span>
                            )}
                        </dd>
                    </div>
                    <div className="bg-gray-50 overflow-hidden rounded-lg p-4 border border-gray-200">
                        <dt className="text-sm font-medium text-gray-500 truncate">Retalho Aproveitável</dt>
                        <dd className="mt-1 text-3xl font-semibold text-amber-600">
                            {(result.totalReusableScrap / 1000).toFixed(2)} <span className="text-xl">m</span>
                        </dd>
                    </div>
                    <div className="bg-gray-50 overflow-hidden rounded-lg p-4 border border-gray-200">
                        <dt className="text-sm font-medium text-gray-500 truncate">Aproveitamento</dt>
                        <dd className="mt-1 text-3xl font-semibold text-green-600">
                            {Math.round((1 - (result.totalTrueWaste / (result.bars.reduce((acc, b) => acc + b.length, 0) || 1))) * 100)}%
                        </dd>
                    </div>
                </div>
            </div>

            {/* Purchase List */}
            <div className="bg-white shadow rounded-lg border border-[var(--color-line)] overflow-hidden">
                <div className="px-4 py-5 sm:px-6 bg-indigo-50 border-b border-[var(--color-line)] flex items-center">
                    <ShoppingCart className="h-5 w-5 text-indigo-600 mr-2" />
                    <h3 className="text-lg leading-6 font-medium text-indigo-900 font-mono">Lista de Compra</h3>
                </div>
                <div className="p-6">
                    {result.purchaseList && result.purchaseList.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-mono">Material</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-mono">Comprimento (mm)</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-mono">Quantidade</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {result.purchaseList.map((item, idx) => (
                                        <tr key={idx}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.material}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.length}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold">{item.quantity}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="text-sm text-gray-500 mb-4">Nenhuma compra necessária. Todo o material foi retirado do estoque.</p>
                    )}

                    <div className="mt-4 flex flex-wrap gap-3">
                        <button
                            onClick={onDownloadPDF}
                            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            <Download className="h-4 w-4 mr-2" />
                            Baixar PDF
                        </button>
                        <button
                            onClick={onWhatsApp}
                            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-[#25D366] hover:bg-[#128C7E] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#25D366]"
                        >
                            <MessageCircle className="h-4 w-4 mr-2" />
                            Enviar por WhatsApp
                        </button>
                    </div>
                </div>
            </div>

            {/* Cut Plan Visualization */}
            <div className="bg-white shadow rounded-lg border border-[var(--color-line)] overflow-hidden">
                <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-[var(--color-line)]">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 font-mono">Plano de Corte Detalhado</h3>
                </div>
                <div className="p-6 space-y-8">
                    {result.bars.map((bar, index) => (
                        <div key={bar.id} className="space-y-2">
                            <div className="flex justify-between text-sm text-gray-500 font-mono">
                                <span className="font-bold text-gray-900">{bar.material}</span>
                                <span>Barra #{index + 1} ({bar.length}mm) {bar.isScrapUsed ? '(Retalho)' : '(Nova)'}</span>
                                <span>
                                    {bar.reusableScrap > 0 ? (
                                        <span className="text-amber-600 font-semibold mr-2">Sobra: {bar.reusableScrap}mm</span>
                                    ) : null}
                                    {bar.trueWaste > 0 ? (
                                        <span className="text-red-500 font-semibold mr-2">
                                            Sucata: {bar.trueWaste}mm {bar.trueWasteKg > 0 ? `(${bar.trueWasteKg} Kg)` : ''}
                                        </span>
                                    ) : null}
                                    {bar.waste === 0 ? <span className="text-green-600 font-semibold">Sem perda</span> : null}
                                </span>
                            </div>
                            <div className="h-12 bg-gray-200 rounded-md flex overflow-hidden border border-gray-300 relative">
                                {bar.cuts.map((cut, idx) => (
                                    <div
                                        key={idx}
                                        style={{ width: `${(cut.length / bar.length) * 100}%` }}
                                        className="h-full bg-[var(--color-ink)] border-r border-white flex items-center justify-center text-white text-xs font-mono relative group"
                                    >
                                        <span className="truncate px-1">{cut.length}</span>
                                        <div className="absolute bottom-full mb-2 hidden group-hover:block bg-black text-white text-xs p-1 rounded whitespace-nowrap z-10">
                                            {cut.description || `Peça ${idx + 1}`} - {cut.length}mm
                                        </div>
                                    </div>
                                ))}
                                {/* Waste */}
                                <div
                                    style={{ width: `${(bar.waste / bar.length) * 100}%` }}
                                    className="h-full bg-red-100 flex items-center justify-center text-red-800 text-xs font-mono"
                                >
                                    <span className="truncate px-1">{bar.waste}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Items Not Fit */}
            {result.itemsNotFit.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
                        </div>
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-red-800">Itens não otimizados</h3>
                            <div className="mt-2 text-sm text-red-700">
                                <ul className="list-disc pl-5 space-y-1">
                                    {result.itemsNotFit.map((item, idx) => (
                                        <li key={idx}>
                                            {item.material} - {item.length}mm (Muito grande para as barras disponíveis)
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Save Project */}
            <div className="flex flex-col bg-gray-50 p-4 rounded-lg border border-[var(--color-line)]">
                <div className="flex justify-between items-center mb-4">
                    <div className="flex-1 mr-4">
                        <label htmlFor="project-name" className="block text-sm font-medium text-gray-700">Nome do Projeto</label>
                        <input
                            type="text"
                            id="project-name"
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            placeholder="Ex: Estrutura Galpão A"
                            value={projectName}
                            onChange={(e) => setProjectName(e.target.value)}
                        />
                    </div>
                    <div className="flex items-end h-full pb-1">
                        <div className="flex items-center">
                            <input
                                id="auto-update-stock"
                                name="auto-update-stock"
                                type="checkbox"
                                checked={autoUpdateStock}
                                onChange={(e) => setAutoUpdateStock(e.target.checked)}
                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                            />
                            <label htmlFor="auto-update-stock" className="ml-2 block text-sm text-gray-900">
                                Atualizar estoque automaticamente
                            </label>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end space-x-3">
                    <button
                        onClick={onBack}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                        Editar
                    </button>
                    <button
                        onClick={onSave}
                        disabled={loading}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                        <Save className="h-4 w-4 mr-2" />
                        {loading ? 'Salvando...' : 'Salvar Projeto'}
                    </button>
                </div>
            </div>
        </div>
    );
}
