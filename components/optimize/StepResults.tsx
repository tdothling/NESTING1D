import React from 'react';
import { OptimizationResult, StockItem } from '@/lib/types';
import { AlertCircle, ShoppingCart, Download, MessageCircle, Save, Printer, DollarSign } from 'lucide-react';

interface StepResultsProps {
    result: OptimizationResult;
    projectName: string;
    projectId: string | null;
    setProjectName: (name: string) => void;
    autoUpdateStock: boolean;
    setAutoUpdateStock: (b: boolean) => void;
    stock: StockItem[];
    onBack: () => void;
    onSave: () => void;
    onDownloadPDF: () => void;
    onWhatsApp: () => void;
    loading: boolean;
}

export function StepResults({
    result,
    projectName,
    projectId,
    setProjectName,
    autoUpdateStock,
    setAutoUpdateStock,
    stock,
    onBack,
    onSave,
    onDownloadPDF,
    onWhatsApp,
    loading
}: StepResultsProps) {

    // Calculate estimated cost from purchase list
    const estimatedCost = result.purchaseList
        ? result.purchaseList.reduce((total, item) => {
            // Find the price per meter for this material from stock
            const stockItem = stock.find(s => s.material.trim().toLowerCase() === item.material.trim().toLowerCase() && s.pricePerMeter && s.pricePerMeter > 0);
            if (stockItem && stockItem.pricePerMeter) {
                return total + (item.length / 1000) * stockItem.pricePerMeter * item.quantity;
            }
            return total;
        }, 0)
        : 0;

    return (
        <div className="space-y-8 font-mono max-w-7xl mx-auto">
            {/* Header section */}
            <div className="mb-6 border-l-8 border-[var(--color-ink)] pl-4">
                <h2 className="text-3xl font-black uppercase tracking-widest text-[var(--color-ink)] block">
                    RELATÓRIO DE OTIMIZAÇÃO
                </h2>
                <p className="text-sm font-bold opacity-60 uppercase tracking-widest mt-1">
                    RESULTADOS DO PROCESSAMENTO DE CORTE
                </p>
            </div>

            {/* Summary */}
            <div className="bg-white border-4 border-[var(--color-ink)] p-6 shadow-[8px_8px_0px_0px_var(--color-ink)]">
                <h2 className="text-lg font-black text-[var(--color-ink)] uppercase tracking-widest mb-6 border-b-2 border-[var(--color-ink)] pb-2">MÉTRICAS GERAIS</h2>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
                    <div className="bg-[var(--color-bg)] p-4 border-2 border-[var(--color-ink)]">
                        <dt className="text-xs font-black text-[var(--color-ink)] uppercase tracking-widest mb-2 opacity-70">TOTAL DE BARRAS</dt>
                        <dd className="text-4xl font-black text-[var(--color-ink)]">{result.totalStockUsed}</dd>
                    </div>
                    <div className="bg-[var(--color-bg)] p-4 border-2 border-[var(--color-ink)]">
                        <dt className="text-xs font-black text-[var(--color-ink)] uppercase tracking-widest mb-2 opacity-70">SUCATA (PERDA REAL)</dt>
                        <dd className="text-4xl font-black text-[#f9411d]">
                            {(result.totalTrueWaste / 1000).toFixed(2)} <span className="text-xl">M</span>
                            {result.totalTrueWasteKg > 0 && (
                                <span className="block text-sm font-bold text-[#f9411d] opacity-80 mt-1">~ {result.totalTrueWasteKg} KG</span>
                            )}
                        </dd>
                    </div>
                    <div className="bg-[var(--color-bg)] p-4 border-2 border-[var(--color-ink)]">
                        <dt className="text-xs font-black text-[var(--color-ink)] uppercase tracking-widest mb-2 opacity-70">RETALHO APROVEITÁVEL</dt>
                        <dd className="text-4xl font-black text-amber-600">
                            {(result.totalReusableScrap / 1000).toFixed(2)} <span className="text-xl">M</span>
                        </dd>
                    </div>
                    <div className="bg-[var(--color-bg)] p-4 border-2 border-[var(--color-ink)]">
                        <dt className="text-xs font-black text-[var(--color-ink)] uppercase tracking-widest mb-2 opacity-70">APROVEITAMENTO</dt>
                        <dd className="text-4xl font-black text-emerald-600">
                            {Math.round((1 - (result.totalTrueWaste / (result.bars.reduce((acc, b) => acc + b.length, 0) || 1))) * 100)}%
                        </dd>
                    </div>
                    {estimatedCost > 0 && (
                        <div className="bg-emerald-50 p-4 border-2 border-emerald-600 relative overflow-hidden">
                            <div className="absolute -right-4 -bottom-4 opacity-10">
                                <DollarSign className="w-24 h-24" />
                            </div>
                            <dt className="text-xs font-black text-emerald-800 uppercase tracking-widest mb-2 flex items-center">
                                <span className="w-2 h-2 bg-emerald-600 inline-block mr-2"></span> CUSTO ESTIMADO
                            </dt>
                            <dd className="text-3xl font-black text-emerald-700 relative z-10">
                                R$ {estimatedCost.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </dd>
                            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mt-1 block relative z-10">*SOMENTE BARRAS NOVAS</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Purchase List */}
            <div className="bg-white border-4 border-[var(--color-ink)] shadow-[8px_8px_0px_0px_var(--color-ink)] relative overflow-hidden">
                <div className="px-6 py-4 flex justify-between items-center bg-[var(--color-ink)] text-white border-b-4 border-[var(--color-ink)]">
                    <div className="flex items-center">
                        <ShoppingCart className="h-5 w-5 mr-3" />
                        <h3 className="text-lg font-black uppercase tracking-widest">LISTA DE COMPRA</h3>
                    </div>
                </div>

                <div className="p-0">
                    {result.purchaseList && result.purchaseList.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y-2 divide-[var(--color-ink)]">
                                <thead className="bg-[var(--color-bg)] border-b-2 border-[var(--color-ink)]">
                                    <tr>
                                        <th scope="col" className="px-6 py-4 text-left text-xs font-black text-[var(--color-ink)] uppercase tracking-widest border-r-2 border-[var(--color-ink)]">MATERIAL</th>
                                        <th scope="col" className="px-6 py-4 text-left text-xs font-black text-[var(--color-ink)] uppercase tracking-widest border-r-2 border-[var(--color-ink)]">COMPRIMENTO (MM)</th>
                                        <th scope="col" className="px-6 py-4 text-left text-xs font-black text-[var(--color-ink)] uppercase tracking-widest">QUANTIDADE</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y-2 divide-[var(--color-ink)]">
                                    {result.purchaseList.map((item, idx) => (
                                        <tr key={idx} className="hover:bg-[var(--color-bg)] transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-[var(--color-ink)] uppercase border-r-2 border-[var(--color-ink)]">{item.material}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-black text-[var(--color-ink)] border-r-2 border-[var(--color-ink)]">{item.length}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-lg font-black text-[var(--color-accent)]">{item.quantity}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="p-8 text-center border-b-2 border-dashed border-[var(--color-ink)] bg-[var(--color-bg)]">
                            <p className="text-sm font-black text-[var(--color-ink)] uppercase tracking-widest opacity-60">
                                NENHUMA COMPRA NECESSÁRIA. MATERIAL RETIRADO DO ESTOQUE.
                            </p>
                        </div>
                    )}

                    <div className="p-6 bg-white flex flex-wrap gap-4 border-t-2 border-[var(--color-ink)]">
                        <button
                            onClick={onDownloadPDF}
                            className="inline-flex items-center px-6 py-3 border-2 border-[var(--color-ink)] text-xs font-black uppercase tracking-widest text-[var(--color-ink)] bg-white hover:bg-[var(--color-ink)] hover:text-white transition-all active:scale-95 shadow-[4px_4px_0px_0px_var(--color-ink)] hover:shadow-none hover:translate-y-[4px] hover:translate-x-[4px]"
                        >
                            <Download className="h-4 w-4 mr-2" />
                            BAIXAR PDF
                        </button>
                        {projectId && (
                            <button
                                onClick={onWhatsApp}
                                className="inline-flex items-center px-6 py-3 border-2 border-[#25D366] text-xs font-black uppercase tracking-widest text-white bg-[#25D366] hover:bg-white hover:text-[#25D366] transition-all active:scale-95 shadow-[4px_4px_0px_0px_#25D366] hover:shadow-none hover:translate-y-[4px] hover:translate-x-[4px]"
                            >
                                <MessageCircle className="h-4 w-4 mr-2" />
                                WHATSAPP
                            </button>
                        )}
                        <button
                            onClick={() => {
                                // Store current in-memory result in sessionStorage so the print page 
                                // always shows the LATEST optimization, not stale DB data
                                const printData = {
                                    name: projectName || 'Projeto',
                                    createdAt: new Date().toISOString(),
                                    result: result,
                                };
                                sessionStorage.setItem('nesting1d_print_data', JSON.stringify(printData));
                                window.open('/print/live', '_blank');
                            }}
                            className="inline-flex items-center px-6 py-3 border-2 border-[var(--color-ink)] text-xs font-black uppercase tracking-widest text-[var(--color-bg)] bg-[var(--color-ink)] hover:bg-[var(--color-accent)] hover:border-[var(--color-accent)] hover:text-white transition-all active:scale-95 shadow-[4px_4px_0px_0px_var(--color-ink)] hover:shadow-none hover:translate-y-[4px] hover:translate-x-[4px]"
                        >
                            <Printer className="h-4 w-4 mr-2" />
                            FICHA DE CORTE
                        </button>
                    </div>
                </div>
            </div>

            {/* Cut Plan Visualization */}
            <div className="bg-white border-4 border-[var(--color-ink)] shadow-[8px_8px_0px_0px_var(--color-ink)] overflow-hidden">
                <div className="px-6 py-4 bg-[var(--color-bg)] border-b-4 border-[var(--color-ink)] flex items-center justify-between">
                    <h3 className="text-lg font-black text-[var(--color-ink)] uppercase tracking-widest">PLANO DE CORTE DETALHADO</h3>
                    <span className="bg-[var(--color-ink)] text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 border border-white">
                        VISTA AGRUPADA
                    </span>
                </div>

                <div className="p-6 space-y-10">
                    {(() => {
                        // Group identical bars
                        const groupedBars = result.bars.reduce((acc, bar) => {
                            const signature = `${bar.material}|${bar.length}|${bar.waste}|${bar.trueWaste}|${bar.isScrapUsed}|${bar.cuts.map(c => c.length).join(',')}`;
                            if (!acc[signature]) {
                                acc[signature] = { ...bar, groupQuantity: 1, originalIndices: [] };
                            } else {
                                acc[signature].groupQuantity++;
                            }
                            return acc;
                        }, {} as Record<string, typeof result.bars[0] & { groupQuantity: number, originalIndices: number[] }>);

                        return Object.values(groupedBars).map((bar, index) => (
                            <div key={bar.id} className="space-y-3 relative">
                                <div className="flex flex-wrap justify-between items-center text-xs font-bold font-mono border-b-2 border-dashed border-[var(--color-ink)] pb-2 gap-2">
                                    <div className="flex items-center gap-3">
                                        {bar.groupQuantity > 1 && (
                                            <span className="flex items-center justify-center bg-[var(--color-accent)] text-white font-black px-2 py-1 text-xs border border-[var(--color-ink)]">
                                                {bar.groupQuantity}X
                                            </span>
                                        )}
                                        <span className="font-black text-[var(--color-ink)] text-sm uppercase">{bar.material}</span>
                                        <span className="bg-[var(--color-bg)] px-2 py-1 border border-[var(--color-ink)]">
                                            BARRA {bar.length}MM {bar.isScrapUsed ? '(RETALHO)' : '(NOVA)'}
                                        </span>
                                    </div>

                                    <div className="flex gap-2">
                                        {bar.reusableScrap > 0 ? (
                                            <span className="bg-amber-100 text-amber-800 border-2 border-amber-800 px-2 py-1 uppercase tracking-widest">SOBRA: {bar.reusableScrap}MM</span>
                                        ) : null}
                                        {bar.trueWaste > 0 ? (
                                            <span className="bg-red-100 text-red-800 border-2 border-red-800 px-2 py-1 uppercase tracking-widest flex items-center gap-1">
                                                SUCATA: {bar.trueWaste}MM {bar.trueWasteKg > 0 ? `(${bar.trueWasteKg} KG)` : ''}
                                            </span>
                                        ) : null}
                                        {bar.waste === 0 ? <span className="bg-green-100 text-green-800 border-2 border-green-800 px-2 py-1 uppercase tracking-widest">SEM PERDA</span> : null}
                                    </div>
                                </div>

                                <div className={`h-16 bg-gray-200 flex overflow-hidden border-2 relative ${bar.groupQuantity > 1 ? 'border-[var(--color-accent)] shadow-[4px_4px_0px_0px_var(--color-accent)]' : 'border-[var(--color-ink)] shadow-[4px_4px_0px_0px_var(--color-ink)]'}`}>
                                    {bar.cuts.map((cut, idx) => (
                                        <div
                                            key={idx}
                                            style={{ width: `${(cut.length / bar.length) * 100}%` }}
                                            className="h-full bg-[var(--color-ink)] border-r-2 border-[var(--color-bg)] flex items-center justify-center text-white text-xs font-mono relative group transition-colors hover:bg-[var(--color-accent)] cursor-crosshair"
                                        >
                                            <span className="truncate px-1 font-black">{cut.length}</span>

                                            {/* Tooltip */}
                                            <div className="absolute bottom-full mb-2 hidden group-hover:block bg-white text-[var(--color-ink)] text-xs p-2 whitespace-nowrap z-10 border-2 border-[var(--color-ink)] shadow-[4px_4px_0px_0px_var(--color-ink)] font-bold">
                                                <div className="uppercase border-b-2 border-dashed border-[var(--color-ink)] pb-1 mb-1">
                                                    {cut.description || `PEÇA ${idx + 1}`}
                                                </div>
                                                <div className="font-black text-sm">COMPRIMENTO: {cut.length}MM</div>
                                                {bar.groupQuantity > 1 && (
                                                    <div className="mt-1 pt-1 border-t-2 border-[var(--color-ink)] text-[var(--color-accent)]">
                                                        CORTAR {bar.groupQuantity} PEÇAS IGUAIS
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    {/* Waste */}
                                    <div
                                        className="h-full flex items-center justify-center text-red-800 text-xs font-mono border-l-2 border-dashed border-red-800 relative cursor-not-allowed"
                                        style={{
                                            width: `${(bar.waste / bar.length) * 100}%`,
                                            backgroundImage: 'repeating-linear-gradient(45deg, #fee2e2 0, #fee2e2 1px, #fecaca 0, #fecaca 50%)',
                                            backgroundSize: '10px 10px'
                                        }}
                                    >
                                        <div className="bg-white/80 px-1 border border-red-800">
                                            <span className="truncate font-black">{bar.waste}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Visual stacked effect for grouped bars */}
                                {bar.groupQuantity > 1 && (
                                    <>
                                        <div className="absolute top-12 left-2 right-2 h-16 bg-[var(--color-ink)] opacity-10 border-2 border-[var(--color-ink)] -z-10 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)]"></div>
                                        {bar.groupQuantity > 2 && (
                                            <div className="absolute top-14 left-4 right-4 h-16 bg-[var(--color-ink)] opacity-5 border-2 border-[var(--color-ink)] -z-20"></div>
                                        )}
                                    </>
                                )}
                            </div>
                        ));
                    })()}
                </div>
            </div>

            {/* Items Not Fit */}
            {result.itemsNotFit.length > 0 && (
                <div className="bg-red-50 border-4 border-red-600 p-6 shadow-[8px_8px_0px_0px_#dc2626]">
                    <div className="flex">
                        <div className="flex-shrink-0 mr-4">
                            <AlertCircle className="h-8 w-8 text-red-600" aria-hidden="true" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-red-800 uppercase tracking-widest mb-2 border-b-2 border-red-200 pb-2">ALERTA: ITENS NÃO OTIMIZADOS</h3>
                            <div className="text-sm font-bold text-red-700 uppercase tracking-widest">
                                <ul className="list-disc pl-5 space-y-2">
                                    {result.itemsNotFit.map((item, idx) => (
                                        <li key={idx}>
                                            <span className="font-black">{item.material}</span> - {item.length}MM
                                            <span className="ml-2 bg-red-200 text-red-900 px-2 py-0.5 text-[10px] hidden sm:inline-block">EXCEDE ESTOQUE</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Save Project */}
            <div className="bg-[var(--color-bg)] p-6 border-4 border-[var(--color-ink)] shadow-[8px_8px_0px_0px_var(--color-ink)]">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-6 pb-6 border-b-2 border-dashed border-[var(--color-ink)]">
                    <div className="flex-1 w-full">
                        <label htmlFor="project-name" className="block text-sm font-black text-[var(--color-ink)] uppercase tracking-widest mb-2">IDENTIFICAÇÃO DO PROJETO</label>
                        <input
                            type="text"
                            id="project-name"
                            className="block w-full border-2 border-[var(--color-ink)] bg-white rounded-none outline-none focus:ring-0 focus:border-[var(--color-accent)] text-lg font-black px-4 py-3 uppercase"
                            placeholder="EX: ESTRUTURA GALPÃO A"
                            value={projectName}
                            onChange={(e) => setProjectName(e.target.value)}
                        />
                    </div>

                    <label className="flex items-center cursor-pointer group bg-white border-2 border-[var(--color-ink)] px-4 py-3 hover:bg-[var(--color-ink)] hover:text-white transition-colors">
                        <input
                            id="auto-update-stock"
                            name="auto-update-stock"
                            type="checkbox"
                            checked={autoUpdateStock}
                            onChange={(e) => setAutoUpdateStock(e.target.checked)}
                            className="sr-only peer"
                        />
                        <div className="w-6 h-6 border-2 border-current bg-transparent flex items-center justify-center mr-3 peer-checked:bg-[var(--color-accent)] peer-checked:border-[var(--color-accent)]">
                            {autoUpdateStock && <span className="text-white text-sm font-black block leading-none relative bottom-[1px]">✓</span>}
                        </div>
                        <span className="text-sm font-black uppercase tracking-widest group-hover:text-white">
                            ATUALIZAR ESTOQUE AUT.
                        </span>
                    </label>
                </div>

                <div className="flex flex-col sm:flex-row justify-end space-y-4 sm:space-y-0 sm:space-x-4">
                    <button
                        onClick={onBack}
                        className="inline-flex items-center justify-center px-6 py-4 border-2 border-[var(--color-ink)] text-sm font-black uppercase tracking-widest text-[var(--color-ink)] bg-white hover:bg-[var(--color-ink)] hover:text-white transition-all active:scale-95"
                    >
                        EDITAR DADOS
                    </button>
                    <button
                        onClick={onSave}
                        disabled={loading}
                        className="inline-flex items-center justify-center px-8 py-4 border-4 border-[var(--color-ink)] text-lg font-black uppercase tracking-widest text-[var(--color-bg)] bg-[var(--color-accent)] hover:bg-[var(--color-ink)] transition-all active:scale-95 shadow-[4px_4px_0px_0px_var(--color-ink)] hover:shadow-none hover:translate-y-[4px] hover:translate-x-[4px] disabled:opacity-50 disabled:shadow-[4px_4px_0px_0px_var(--color-ink)] disabled:translate-y-0 disabled:translate-x-0"
                    >
                        <Save className="h-5 w-5 mr-3" />
                        {loading ? 'SALVANDO...' : 'SALVAR PROJETO'}
                    </button>
                </div>
            </div>
        </div>
    );
}
