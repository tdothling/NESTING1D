'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getProjects } from '@/lib/store';
import { Project, BarResult } from '@/lib/types';

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

    if (loading) return <div className="p-10 text-center font-mono">Carregando ficha...</div>;
    if (!project || !project.result) return <div className="p-10 text-center font-mono text-red-600">Projeto não encontrado ou sem resultado.</div>;

    const result = project.result;

    // Group bars by material
    const barsByMaterial: Record<string, BarResult[]> = {};
    result.bars.forEach(bar => {
        if (!barsByMaterial[bar.material]) barsByMaterial[bar.material] = [];
        barsByMaterial[bar.material].push(bar);
    });

    return (
        <>
            {/* Print Styles */}
            <style jsx global>{`
        @media print {
          @page {
            size: A4 landscape;
            margin: 10mm;
          }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
          .page-break { page-break-before: always; }
        }
      `}</style>

            <div className="max-w-[1100px] mx-auto p-6 font-mono text-gray-900 bg-white">
                {/* Print Button */}
                <div className="no-print mb-6 flex justify-between items-center">
                    <button
                        onClick={() => window.history.back()}
                        className="text-sm text-gray-500 hover:text-gray-700"
                    >
                        &larr; Voltar
                    </button>
                    <button
                        onClick={() => window.print()}
                        className="px-6 py-2 bg-[var(--color-accent)] text-white rounded-md font-medium hover:bg-orange-600 transition-colors"
                    >
                        🖨️ Imprimir Ficha
                    </button>
                </div>

                {/* Header */}
                <div className="border-2 border-gray-900 p-4 mb-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-2xl font-bold uppercase tracking-wider">Ficha de Corte</h1>
                            <p className="text-lg mt-1">{project.name}</p>
                        </div>
                        <div className="text-right text-sm">
                            <p><strong>Data:</strong> {new Date(project.createdAt).toLocaleDateString('pt-BR')}</p>
                            <p><strong>Total de Barras:</strong> {result.totalStockUsed}</p>
                            <p><strong>Aproveitamento:</strong> {Math.round((1 - (result.totalTrueWaste / (result.bars.reduce((acc, b) => acc + b.length, 0) || 1))) * 100)}%</p>
                        </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-300 flex gap-8 text-sm">
                        <p>Responsável: ____________________</p>
                        <p>Assinatura: ____________________</p>
                        <p className="ml-auto">Status: <span className="inline-block w-4 h-4 border border-gray-900 align-middle mr-1"></span> Concluído</p>
                    </div>
                </div>

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
                        <div key={material} className={matIdx > 0 ? 'page-break' : ''}>
                            <h2 className="text-xl font-bold uppercase bg-gray-900 text-white px-4 py-2 mb-4 tracking-wider">
                                {material}
                            </h2>

                            <div className="space-y-5">
                                {Object.values(groupedBars).map((bar, barIdx) => (
                                    <div key={bar.id} className="border border-gray-300 rounded p-4 relative">
                                        {/* Grouping Indicator */}
                                        {bar.groupQuantity > 1 && (
                                            <div className="absolute -top-3 -left-3 bg-[var(--color-accent)] text-white font-bold px-3 py-1 rounded shadow-md text-sm border-2 border-white transform rotate-[-5deg]">
                                                CORTAR {bar.groupQuantity} BARRAS IGUAIS
                                            </div>
                                        )}

                                        {/* Bar Header */}
                                        <div className="flex justify-between items-center mb-2 text-sm mt-1">
                                            <span className="font-bold text-base">
                                                {bar.groupQuantity > 1 ? `Lote #${barIdx + 1}` : `Barra #${barIdx + 1}`} — {bar.length}mm {bar.isScrapUsed ? '(RETALHO)' : '(NOVA)'}
                                            </span>
                                            <div className="flex gap-4">
                                                {bar.reusableScrap > 0 && (
                                                    <span className="text-amber-700 font-bold">Sobra: {bar.reusableScrap}mm → Estoque</span>
                                                )}
                                                {bar.trueWaste > 0 && (
                                                    <span className="text-red-700 font-bold">Sucata: {bar.trueWaste}mm</span>
                                                )}
                                                {bar.waste === 0 && (
                                                    <span className="text-green-700 font-bold">Sem Perda ✓</span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Visual Bar */}
                                        <div className={`h-14 bg-gray-200 rounded flex overflow-hidden border-2 mb-3 ${bar.groupQuantity > 1 ? 'border-orange-500 ring-4 ring-orange-100 ring-offset-1' : 'border-gray-400'}`}>
                                            {bar.cuts.map((cut, cutIdx) => (
                                                <div
                                                    key={cutIdx}
                                                    style={{ width: `${(cut.length / bar.length) * 100}%` }}
                                                    className="h-full bg-gray-800 border-r-2 border-white flex items-center justify-center text-white text-sm font-bold"
                                                >
                                                    {cut.length}
                                                </div>
                                            ))}
                                            {bar.waste > 0 && (
                                                <div
                                                    style={{ width: `${(bar.waste / bar.length) * 100}%` }}
                                                    className="h-full bg-red-200 flex items-center justify-center text-red-800 text-xs font-bold border-l-2 border-red-300"
                                                >
                                                    {bar.waste}
                                                </div>
                                            )}
                                        </div>

                                        {/* Cut Checklist */}
                                        <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm font-medium">
                                            {bar.cuts.map((cut, cutIdx) => (
                                                <div key={cutIdx} className="flex items-center gap-2">
                                                    <span className="inline-block w-4 h-4 border-2 border-gray-900 rounded-sm flex-shrink-0"></span>
                                                    <span>
                                                        Cortar <strong>{cut.length}mm</strong> {cut.description ? `— ${cut.description}` : ''}
                                                    </span>
                                                </div>
                                            ))}
                                            {bar.reusableScrap > 0 && (
                                                <div className="flex items-center gap-2 text-amber-700">
                                                    <span className="inline-block w-4 h-4 border-2 border-amber-700 rounded-sm flex-shrink-0"></span>
                                                    <span>Devolver <strong>{bar.reusableScrap}mm</strong> ao estoque.</span>
                                                </div>
                                            )}
                                            {bar.trueWaste > 0 && (
                                                <div className="flex items-center gap-2 text-red-600">
                                                    <span className="inline-block w-4 h-4 border-2 border-red-600 rounded-sm flex-shrink-0"></span>
                                                    <span>Descartar sucata de <strong>{bar.trueWaste}mm</strong></span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}

                {/* Purchase List Summary */}
                {result.purchaseList && result.purchaseList.length > 0 && (
                    <div className="page-break">
                        <h2 className="text-xl font-bold uppercase bg-gray-900 text-white px-4 py-2 mb-4 tracking-wider">
                            Lista de Compra
                        </h2>
                        <table className="w-full border-collapse text-sm">
                            <thead>
                                <tr className="bg-gray-100">
                                    <th className="border border-gray-300 px-4 py-2 text-left">Material</th>
                                    <th className="border border-gray-300 px-4 py-2 text-left">Comprimento (mm)</th>
                                    <th className="border border-gray-300 px-4 py-2 text-left">Quantidade</th>
                                </tr>
                            </thead>
                            <tbody>
                                {result.purchaseList.map((item, idx) => (
                                    <tr key={idx}>
                                        <td className="border border-gray-300 px-4 py-2 font-bold">{item.material}</td>
                                        <td className="border border-gray-300 px-4 py-2">{item.length}</td>
                                        <td className="border border-gray-300 px-4 py-2 font-bold">{item.quantity}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Footer */}
                <div className="mt-8 pt-4 border-t border-gray-300 text-xs text-gray-500 text-center">
                    Gerado por NESTING1D — {new Date().toLocaleString('pt-BR')}
                </div>
            </div>
        </>
    );
}
