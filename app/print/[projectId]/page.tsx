'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getProjects } from '@/lib/store';
import { Project, BarResult } from '@/lib/types';
import { Printer, ArrowLeft } from 'lucide-react';

export default function PrintPage() {
    const params = useParams();
    const projectId = params.projectId as string;
    const [project, setProject] = useState<Project | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const projects = await getProjects();
                const found = projects.find((p: Project) => p.id === projectId);
                setProject(found || null);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [projectId]);

    if (loading) return (
        <div className="flex justify-center items-center h-screen bg-[var(--color-bg)]">
            <div className="border-2 border-[var(--color-ink)] border-dashed p-12">
                <div className="font-mono text-[var(--color-ink)] animate-pulse uppercase tracking-widest font-bold">GERANDO FICHA DE CORTE...</div>
            </div>
        </div>
    );

    if (!project || !project.result) return (
        <div className="flex justify-center items-center h-screen bg-[var(--color-bg)] p-6">
            <div className="border-4 border-[var(--color-ink)] bg-white p-12 text-center w-full max-w-2xl">
                <h1 className="font-mono text-xl text-[var(--color-accent)] font-bold uppercase tracking-widest mb-4">Erro de Leitura</h1>
                <p className="font-mono text-sm opacity-70 uppercase tracking-widest">Projeto não encontrado ou resultado indisponível.</p>
                <button
                    onClick={() => window.history.back()}
                    className="mt-8 px-6 py-3 border-2 border-[var(--color-ink)] font-mono text-sm font-bold uppercase tracking-widest bg-[var(--color-ink)] text-white hover:bg-white hover:text-[var(--color-ink)] transition-colors active:scale-95 flex items-center justify-center w-full mx-auto"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    RETORNAR AO SISTEMA
                </button>
            </div>
        </div>
    );

    const result = project.result;

    // Group bars by material
    const barsByMaterial: Record<string, BarResult[]> = {};
    result.bars.forEach(bar => {
        if (!barsByMaterial[bar.material]) barsByMaterial[bar.material] = [];
        barsByMaterial[bar.material].push(bar);
    });

    return (
        <div className="min-h-screen bg-[var(--color-bg)] py-8 font-mono">
            {/* Print Styles */}
            <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm;
          }
          body { 
            -webkit-print-color-adjust: exact; 
            print-color-adjust: exact; 
            background: white !important;
          }
          .no-print { display: none !important; }
          .page-break { break-before: page; }
          .bar-card { break-inside: avoid; }
          .print-header { break-inside: avoid; }
          .material-title { break-after: avoid; }
          
          /* Override industrial styles specifically for saving ink when printing */
          .print-container {
            border: none !important;
            padding: 0 !important;
            max-width: 100% !important;
          }
        }
      `}</style>

            <div className="max-w-[800px] mx-auto print-container px-4">
                {/* Print Button (NÃO APARECE NA IMPRESSÃO) */}
                <div className="no-print mb-8 flex justify-between items-center border-4 border-[var(--color-ink)] bg-white p-4">
                    <button
                        onClick={() => window.history.back()}
                        className="flex items-center text-sm font-bold uppercase tracking-widest text-[var(--color-ink)] hover:text-[var(--color-accent)] transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        RETORNAR
                    </button>
                    <button
                        onClick={() => window.print()}
                        className="px-6 py-3 bg-[var(--color-ink)] text-white border-2 border-[var(--color-ink)] font-bold uppercase tracking-widest text-sm hover:bg-[var(--color-accent)] hover:border-[var(--color-accent)] transition-colors flex items-center active:scale-95 shadow-[4px_4px_0px_0px_var(--color-ink)] hover:shadow-none translate-y-[-4px] translate-x-[-4px] hover:translate-y-0 hover:translate-x-0"
                    >
                        <Printer className="w-4 h-4 mr-2" />
                        EMITIR ORDEM
                    </button>
                </div>

                {/* THE ACTUAL PRINT DOCUMENT */}
                <div className="bg-white border-4 border-[var(--color-ink)] shadow-[8px_8px_0px_0px_var(--color-ink)] print:shadow-none print:border-none relative">
                    {/* Header */}
                    <div className="print-header border-b-4 border-[var(--color-ink)] p-8 relative overflow-hidden bg-[var(--color-bg)] print:bg-transparent print:border-b-2">
                        {/* Status Stamp */}
                        <div className="absolute -right-8 -top-8 border-4 border-[var(--color-ink)] text-[var(--color-ink)] px-12 py-1 transform rotate-45 font-black text-xs tracking-widest opacity-20">
                            ORDEM DE PRODUÇÃO
                        </div>

                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h1 className="text-4xl font-black uppercase tracking-widest text-[var(--color-ink)] border-l-8 border-[var(--color-ink)] pl-4">ORDEM DE CORTE</h1>
                                <p className="text-xl font-bold mt-2 uppercase text-[var(--color-ink)] opacity-80">{project.name}</p>
                                <div className="mt-2 inline-flex items-center border-2 border-[var(--color-ink)] px-2 py-1 bg-white text-xs font-bold uppercase tracking-widest">
                                    REF: {project.id.substring(0, 8)}
                                </div>
                            </div>
                            <div className="text-right border-l-2 border-[var(--color-ink)] border-dashed pl-6">
                                <p className="font-bold text-sm tracking-widest uppercase mb-1">EMISSÃO</p>
                                <p className="text-lg font-black">{new Date(project.createdAt).toLocaleDateString('pt-BR')}</p>
                            </div>
                        </div>

                        {/* Metrics Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 border-2 border-[var(--color-ink)] bg-white divide-x-2 divide-y-2 md:divide-y-0 divide-[var(--color-ink)]">
                            <div className="p-3 text-center">
                                <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-1">MATÉRIA-PRIMA</p>
                                <p className="text-2xl font-black">{result.totalStockUsed} <span className="text-sm">BARRAS</span></p>
                            </div>
                            <div className="p-3 text-center">
                                <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-1">APROVEITAMENTO</p>
                                <p className="text-2xl font-black text-[var(--color-ink)]">{Math.round((1 - (result.totalTrueWaste / (result.bars.reduce((acc, b) => acc + b.length, 0) || 1))) * 100)}%</p>
                            </div>
                            <div className="p-3 text-center">
                                <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-1">SUCATA</p>
                                <p className="text-2xl font-black text-[var(--color-accent)]">{result.totalTrueWaste} <span className="text-sm text-[var(--color-ink)]">mm</span></p>
                            </div>
                            <div className="p-3 text-center">
                                <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-1">TOTAL CORTES</p>
                                <p className="text-2xl font-black">{project.requests.length}</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-8 space-y-12">
                        {/* Bars grouped by material */}
                        {Object.entries(barsByMaterial).map(([material, materialBars], matIdx) => {
                            // Group identical bars within the material
                            const groupedBars = materialBars.reduce((acc, bar) => {
                                const signature = `${bar.material}|${bar.length}|${bar.waste}|${bar.trueWaste}|${bar.isScrapUsed}|${bar.cuts.map(c => c.length).join(',')}`;
                                if (!acc[signature]) {
                                    acc[signature] = { ...bar, groupQuantity: 1 };
                                } else {
                                    acc[signature].groupQuantity++;
                                }
                                return acc;
                            }, {} as Record<string, typeof materialBars[0] & { groupQuantity: number }>);

                            return (
                                <div key={material}>
                                    <h2 className="material-title flex items-center gap-4 mb-6">
                                        <div className="w-8 h-8 bg-[var(--color-ink)] flex items-center justify-center text-white font-bold">{matIdx + 1}</div>
                                        <span className="text-2xl font-black uppercase tracking-widest border-b-4 border-[var(--color-ink)] pb-1 flex-1">{material}</span>
                                    </h2>

                                    <div className="space-y-6 pl-4 md:pl-12 border-l-4 border-dashed border-[var(--color-ink)] border-opacity-20 ml-4 py-2">
                                        {Object.values(groupedBars).map((bar, barIdx) => (
                                            <div key={bar.id} className="bar-card border-2 border-[var(--color-ink)] p-5 relative bg-white transition-all print:border-2">

                                                {/* Grouping Indicator */}
                                                {bar.groupQuantity > 1 && (
                                                    <div className="absolute -top-4 -left-4 bg-[var(--color-ink)] text-[var(--color-bg)] font-black px-4 py-1 flex items-center transform -rotate-2 border-2 border-[var(--color-bg)] shadow-[4px_4px_0px_0px_var(--color-ink)] print:shadow-none">
                                                        <span className="text-xl mr-2">×{bar.groupQuantity}</span> BARRAS IDÊNTICAS
                                                    </div>
                                                )}

                                                {/* Bar Header */}
                                                <div className={`flex flex-col sm:flex-row justify-between sm:items-end mb-4 ${bar.groupQuantity > 1 ? 'mt-4' : ''}`}>
                                                    <div>
                                                        <span className="text-[10px] font-bold uppercase tracking-widest opacity-60 block">IDENTIFICAÇÃO</span>
                                                        <span className="font-black text-lg">
                                                            {bar.length}mm <span className="text-sm border border-[var(--color-ink)] px-1 relative bottom-[2px]">{bar.isScrapUsed ? 'RETALHO' : 'BARRA NOVA'}</span>
                                                        </span>
                                                    </div>

                                                    <div className="flex gap-2 mt-2 sm:mt-0 font-bold text-xs">
                                                        {bar.reusableScrap > 0 && (
                                                            <div className="border border-[var(--color-ink)] px-2 py-1 flex items-center bg-yellow-50">
                                                                <span className="w-2 h-2 bg-yellow-400 mr-2 border border-[var(--color-ink)]"></span>
                                                                SOBRA: {bar.reusableScrap}mm
                                                            </div>
                                                        )}
                                                        {bar.trueWaste > 0 && (
                                                            <div className="border border-[var(--color-ink)] px-2 py-1 flex items-center bg-red-50 text-[var(--color-accent)] print:text-[var(--color-ink)]">
                                                                <span className="w-2 h-2 bg-[var(--color-accent)] mr-2 border border-[var(--color-ink)]"></span>
                                                                SUCATA: {bar.trueWaste}mm
                                                            </div>
                                                        )}
                                                        {bar.waste === 0 && (
                                                            <div className="border border-[var(--color-ink)] px-2 py-1 flex items-center bg-green-50">
                                                                <span className="w-2 h-2 bg-green-500 mr-2 border border-[var(--color-ink)]"></span>
                                                                PERDA ZERO
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Visual Bar */}
                                                <div className="h-14 bg-white border-2 border-[var(--color-ink)] flex overflow-hidden mb-6 relative">
                                                    {bar.cuts.map((cut, cutIdx) => (
                                                        <div
                                                            key={cutIdx}
                                                            style={{ width: `${(cut.length / bar.length) * 100}%` }}
                                                            className="h-full bg-[var(--color-bg)] border-r-2 border-[var(--color-ink)] flex items-center justify-center text-[var(--color-ink)] text-sm font-black relative overflow-hidden print:border-r print:bg-white"
                                                        >
                                                            {/* Crosshatch pattern for cuts */}
                                                            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #141414 0, #141414 1px, transparent 0, transparent 50%)', backgroundSize: '10px 10px' }}></div>
                                                            <span className="bg-white px-1 border border-[var(--color-ink)] relative z-10">{cut.length}</span>
                                                        </div>
                                                    ))}

                                                    {bar.reusableScrap > 0 && (
                                                        <div
                                                            style={{ width: `${(bar.reusableScrap / bar.length) * 100}%` }}
                                                            className="h-full bg-yellow-100 flex items-center justify-center text-[var(--color-ink)] text-xs font-bold border-r-2 border-[var(--color-ink)] print:bg-white"
                                                        >
                                                            <span className="bg-white px-1 border border-[var(--color-ink)] origin-center">{bar.reusableScrap}</span>
                                                        </div>
                                                    )}

                                                    {bar.trueWaste > 0 && (
                                                        <div
                                                            style={{ width: `${(bar.trueWaste / bar.length) * 100}%` }}
                                                            className="h-full bg-red-100 flex items-center justify-center text-[var(--color-accent)] text-xs font-bold print:bg-white print:text-[var(--color-ink)]"
                                                        >
                                                            <span className="origin-center rotate-90 sm:rotate-0">{bar.trueWaste}</span>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Cut Checklist */}
                                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-3 font-bold text-sm">
                                                    {bar.cuts.map((cut, cutIdx) => (
                                                        <div key={cutIdx} className="flex flex-col border-b border-dashed border-[var(--color-ink)] border-opacity-30 pb-2">
                                                            <div className="flex items-start">
                                                                <input type="checkbox" className="mt-1 mr-3 w-5 h-5 border-2 border-[var(--color-ink)] rounded-none text-[var(--color-ink)] focus:ring-0 cursor-pointer appearance-none checked:bg-[var(--color-ink)] checked:border-transparent print:appearance-auto" />
                                                                <div className="flex-1">
                                                                    <div className="flex justify-between w-full">
                                                                        <span>{cut.length}mm</span>
                                                                        <span className="px-1 border border-[var(--color-ink)] text-[10px] ml-2 leading-tight flex items-center bg-[var(--color-bg)] print:bg-white">CORTE</span>
                                                                    </div>
                                                                    {cut.description && (
                                                                        <p className="text-xs opacity-60 font-medium mt-1 uppercase tracking-widest truncate">{cut.description}</p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}

                        {/* Purchase List Summary */}
                        {result.purchaseList && result.purchaseList.length > 0 && (
                            <div className="page-break mt-12 pt-8 border-t-8 border-double border-[var(--color-ink)]">
                                <h2 className="flex items-center gap-4 mb-6">
                                    <span className="text-2xl font-black uppercase tracking-widest border-b-4 border-[var(--color-ink)] pb-1">COMPRA RECOMENDADA</span>
                                </h2>
                                <div className="border-4 border-[var(--color-ink)] bg-white overflow-hidden">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-[var(--color-ink)] text-[var(--color-bg)]">
                                            <tr>
                                                <th className="px-6 py-4 font-black tracking-widest uppercase border-r border-white border-opacity-20">MATERIAL</th>
                                                <th className="px-6 py-4 font-black tracking-widest uppercase border-r border-white border-opacity-20 text-center">COMPR. (mm)</th>
                                                <th className="px-6 py-4 font-black tracking-widest uppercase text-center">QTD (BARRAS)</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y-2 divide-[var(--color-ink)] font-bold uppercase text-[var(--color-ink)]">
                                            {result.purchaseList.map((item, idx) => (
                                                <tr key={idx} className="hover:bg-[var(--color-bg)] transition-colors">
                                                    <td className="px-6 py-4 border-r-2 border-[var(--color-ink)]">{item.material}</td>
                                                    <td className="px-6 py-4 border-r-2 border-[var(--color-ink)] text-center">{item.length}</td>
                                                    <td className="px-6 py-4 text-center font-black text-xl">{item.quantity}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Footer Signature Block */}
                        <div className="mt-16 pt-8 border-t-4 border-[var(--color-ink)] bg-[var(--color-bg)] p-8 print:bg-white print:border-t-2 flex flex-col sm:flex-row justify-between gap-8 md:gap-16">
                            <div className="flex-1">
                                <p className="text-[10px] font-bold uppercase tracking-widest mb-10 opacity-70">LIBERADO POR (LÍDER/PCP)</p>
                                <div className="border-b-2 border-[var(--color-ink)] h-2 w-full"></div>
                                <p className="text-xs uppercase mt-2 opacity-50">NOME E DATA</p>
                            </div>
                            <div className="flex-1">
                                <p className="text-[10px] font-bold uppercase tracking-widest mb-10 opacity-70">CORTADO POR (OPERADOR C/C)</p>
                                <div className="border-b-2 border-[var(--color-ink)] h-2 w-full"></div>
                                <p className="text-xs uppercase mt-2 opacity-50">NOME E DATA</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-6 mb-12 text-[10px] font-bold uppercase tracking-widest text-[var(--color-ink)] text-center opacity-40">
                    SISTEMA DE CORTE INDUSTRIAL NESTING1D // V1.0 // {new Date().toLocaleString('pt-BR')}
                </div>
            </div>
        </div>
    );
}
