import React, { useCallback } from 'react';
import { CutRequest } from '@/lib/types';
import { Plus, Trash2, ArrowRight, RefreshCw, ChevronDown, ChevronUp, Calculator } from 'lucide-react';
import {
    PROFILE_LABELS,
    REQUIRED_DIMENSIONS,
    DIMENSION_LABELS,
    calculateWeightKgM,
} from '@/lib/steel-catalog';
import type { ProfileCategory, ProfileDimensions } from '@/lib/steel-catalog';

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

const PROFILE_TYPES = Object.keys(PROFILE_LABELS) as ProfileCategory[];

/** Sub-component: Expandable Profile Dimension Editor */
function ProfileDimensionEditor({
    req,
    updateRequest,
}: {
    req: CutRequest;
    updateRequest: (id: string, field: keyof CutRequest, value: any) => void;
}) {
    const [expanded, setExpanded] = React.useState(!!req.profileType);

    const handleTypeChange = useCallback((newType: string) => {
        const profileType = newType === '' ? undefined : (newType as ProfileCategory);
        updateRequest(req.id, 'profileType', profileType);

        // Reset dimensions when type changes
        updateRequest(req.id, 'profileDimensions', undefined);
        updateRequest(req.id, 'weightKgM', 0);

        if (profileType) {
            setExpanded(true);
        }
    }, [req.id, updateRequest]);

    const handleDimensionChange = useCallback((dimKey: keyof ProfileDimensions, value: number) => {
        const newDims = { ...(req.profileDimensions || {}), [dimKey]: value || undefined };
        updateRequest(req.id, 'profileDimensions', newDims);

        // Try to recalculate weight
        if (req.profileType) {
            try {
                const weight = calculateWeightKgM(req.profileType, newDims);
                updateRequest(req.id, 'weightKgM', weight);
            } catch {
                // Incomplete dimensions — don't update weight
            }
        }
    }, [req.id, req.profileType, req.profileDimensions, updateRequest]);

    const recalcWeight = useCallback(() => {
        if (req.profileType && req.profileDimensions) {
            try {
                const weight = calculateWeightKgM(req.profileType, req.profileDimensions);
                updateRequest(req.id, 'weightKgM', weight);
            } catch {
                // incomplete
            }
        }
    }, [req.id, req.profileType, req.profileDimensions, updateRequest]);

    const requiredDims = req.profileType ? REQUIRED_DIMENSIONS[req.profileType] : [];

    return (
        <div className="space-y-2 font-mono">
            {/* Toggle + Type selector row */}
            <div className="flex items-center gap-2">
                <button
                    onClick={() => setExpanded(!expanded)}
                    className="text-[var(--color-ink)] hover:bg-[var(--color-ink)] hover:text-white border-2 border-[var(--color-ink)] p-0.5 transition-colors"
                    title={expanded ? 'Recolher dimensões' : 'Expandir dimensões'}
                >
                    {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>

                <select
                    value={req.profileType || ''}
                    onChange={(e) => handleTypeChange(e.target.value)}
                    className="block w-full border-2 border-[var(--color-ink)] outline-none rounded-none text-xs py-1.5 focus:ring-0 focus:border-[var(--color-accent)] font-bold uppercase tracking-widest bg-white"
                >
                    <option value="">TIPO DE PERFIL...</option>
                    {PROFILE_TYPES.map(type => (
                        <option key={type} value={type}>{PROFILE_LABELS[type]}</option>
                    ))}
                </select>
            </div>

            {/* Dimension inputs — only shown when expanded and type is selected */}
            {expanded && req.profileType && (
                <div className="bg-[var(--color-bg)] p-4 border-l-4 border-[var(--color-ink)] mt-2">
                    {req.profileType === 'w_hp' ? (
                        /* W/HP: weight comes from the profile name, show direct weight input */
                        <div className="bg-white border-2 border-[var(--color-ink)] p-3">
                            <label className="block text-[10px] font-black text-[var(--color-ink)] uppercase tracking-widest mb-2">
                                PESO LINEAR (KG/M)
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                value={req.weightKgM || ''}
                                placeholder="EX: 19.3"
                                onChange={(e) => updateRequest(req.id, 'weightKgM', Number(e.target.value))}
                                className="block w-full border-2 border-[var(--color-ink)] bg-transparent rounded-none text-base py-2 px-3 focus:ring-0 focus:border-[var(--color-accent)] font-black outline-none transition-colors"
                            />
                            <p className="text-[10px] text-[var(--color-ink)] opacity-60 mt-2 uppercase tracking-widest font-bold">
                                W200X<span className="text-[var(--color-accent)] font-black">19.3</span> → 19.3 KG/M
                            </p>
                        </div>
                    ) : (
                        /* Other profiles: dimension inputs */
                        <div className="grid grid-cols-2 gap-3 bg-white border-2 border-[var(--color-ink)] p-3">
                            {requiredDims.map(dimKey => (
                                <div key={dimKey}>
                                    <label className="block text-[10px] font-black text-[var(--color-ink)] uppercase tracking-widest mb-2 truncate" title={DIMENSION_LABELS[dimKey]}>
                                        {DIMENSION_LABELS[dimKey]}
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={req.profileDimensions?.[dimKey] || ''}
                                        placeholder="0"
                                        onChange={(e) => handleDimensionChange(dimKey, Number(e.target.value))}
                                        className="block w-full border-2 border-[var(--color-ink)] bg-transparent rounded-none text-base py-2 px-3 focus:ring-0 focus:border-[var(--color-accent)] font-black outline-none transition-colors"
                                    />
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Calculated weight display (for non W/HP) */}
                    {req.profileType !== 'w_hp' && req.weightKgM && req.weightKgM > 0 ? (
                        <div className="flex items-center justify-between pt-3 mt-3 border-t-2 border-dashed border-[var(--color-ink)] border-opacity-30">
                            <span className="text-[10px] font-black text-[var(--color-ink)] uppercase tracking-widest">PESO CALCULADO:</span>
                            <span className="text-sm font-black text-[var(--color-bg)] bg-[var(--color-ink)] border-2 border-[var(--color-ink)] px-3 py-1 shadow-[2px_2px_0px_0px_var(--color-accent)]">{req.weightKgM} KG/M</span>
                        </div>
                    ) : (
                        <div className="flex items-center justify-between pt-3 mt-3 border-t-2 border-dashed border-[var(--color-ink)] border-opacity-30">
                            <span className="text-[10px] font-black text-[var(--color-accent)] uppercase tracking-widest flex items-center">
                                <span className="w-2 h-2 bg-[var(--color-accent)] mr-2 inline-block"></span>
                                AGUARDANDO MEDIDAS
                            </span>
                            <button
                                onClick={recalcWeight}
                                className="text-[var(--color-ink)] hover:text-white hover:bg-[var(--color-ink)] border-2 border-[var(--color-ink)] p-2 transition-colors focus:ring-0 outline-none"
                                title="RECALCULAR PESO"
                            >
                                <Calculator className="h-4 w-4" />
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
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
        <div className="space-y-8 font-mono max-w-7xl mx-auto">
            {/* Header section */}
            <div className="mb-6 border-l-8 border-[var(--color-ink)] pl-4">
                <h2 className="text-3xl font-black uppercase tracking-widest text-[var(--color-ink)] block">
                    REVISÃO DE DADOS
                </h2>
                <p className="text-sm font-bold opacity-60 uppercase tracking-widest mt-1">
                    CONFIRME AS MEDIDAS E QUANTIDADES ANTES DE CONTINUAR
                </p>
            </div>

            {/* Multiplier Tool */}
            <div className="bg-white border-4 border-[var(--color-ink)] p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-[4px_4px_0px_0px_var(--color-ink)]">
                <div>
                    <h3 className="text-sm font-black text-[var(--color-ink)] uppercase tracking-widest">MULTIPLICADOR DE PROJETO LOTE</h3>
                    <p className="text-xs font-bold opacity-70 mt-1 uppercase tracking-widest">CRIANDO MÚLTIPLAS CÓPIAS DO MESMO CONJUNTO?</p>
                </div>
                <div className="flex items-center space-x-3 w-full sm:w-auto">
                    <span className="text-lg font-black text-[var(--color-ink)]">×</span>
                    <input
                        type="number"
                        min="1"
                        className="w-24 rounded-none border-2 border-[var(--color-ink)] outline-none focus:border-[var(--color-accent)] focus:ring-0 text-lg font-black px-3 py-2 text-center"
                        value={globalMultiplier}
                        onChange={(e) => setGlobalMultiplier(Math.max(1, Number(e.target.value)))}
                    />
                    <button
                        onClick={applyMultiplier}
                        disabled={globalMultiplier <= 1 || requests.length === 0}
                        className="flex-1 sm:flex-none px-4 py-2 border-2 border-[var(--color-ink)] text-sm font-black uppercase tracking-widest text-white bg-[var(--color-ink)] hover:bg-[var(--color-accent)] hover:border-[var(--color-accent)] disabled:opacity-50 disabled:bg-gray-400 disabled:border-gray-400 disabled:hover:translate-x-0 disabled:hover:translate-y-0 transition-all active:scale-95 shadow-[4px_4px_0px_0px_var(--color-ink)] disabled:shadow-none hover:shadow-none hover:translate-y-[4px] hover:translate-x-[4px]"
                    >
                        APLICAR
                    </button>
                </div>
            </div>

            {/* Editor Table container */}
            <div className="bg-white border-4 border-[var(--color-ink)] shadow-[8px_8px_0px_0px_var(--color-ink)] relative overflow-hidden">
                <div className="px-6 py-4 flex justify-between items-center bg-[var(--color-ink)] text-white border-b-4 border-[var(--color-ink)]">
                    <h3 className="text-lg font-black uppercase tracking-widest">LISTA DE CORTES</h3>
                    <button onClick={addRequest} className="inline-flex items-center px-4 py-2 border-2 border-white text-xs font-black uppercase tracking-widest text-[var(--color-ink)] bg-white hover:bg-[var(--color-accent)] hover:text-white hover:border-[var(--color-accent)] transition-colors active:scale-95">
                        <Plus className="h-4 w-4 mr-2" /> NOVA LINHA
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y-2 divide-[var(--color-ink)]">
                        <thead className="bg-[var(--color-bg)] border-b-2 border-[var(--color-ink)]">
                            <tr>
                                <th scope="col" className="px-4 py-4 text-left text-xs font-black text-[var(--color-ink)] uppercase tracking-widest border-r-2 border-[var(--color-ink)] w-[15%]">MATERIAL</th>
                                <th scope="col" className="px-4 py-4 text-left text-xs font-black text-[var(--color-ink)] uppercase tracking-widest border-r-2 border-[var(--color-ink)] w-[25%]">PERFIL / DIMENSÕES</th>
                                <th scope="col" className="px-4 py-4 text-left text-xs font-black text-[var(--color-ink)] uppercase tracking-widest border-r-2 border-[var(--color-ink)] w-[10%]">COMP. (MM)</th>
                                <th scope="col" className="px-4 py-4 text-left text-xs font-black text-[var(--color-ink)] uppercase tracking-widest border-r-2 border-[var(--color-ink)] w-[10%]">QTD</th>
                                <th scope="col" className="px-4 py-4 text-left text-xs font-black text-[var(--color-ink)] uppercase tracking-widest border-r-2 border-[var(--color-ink)] w-[10%]">PESO (KG/M)</th>
                                <th scope="col" className="px-4 py-4 text-center text-xs font-black text-[var(--color-ink)] uppercase tracking-widest border-r-2 border-[var(--color-ink)] w-[10%]" title="Pular Otimização de Barra (ex: Chapas já cortadas)">DIR. COMPRA</th>
                                <th scope="col" className="px-4 py-4 text-left text-xs font-black text-[var(--color-ink)] uppercase tracking-widest border-r-2 border-[var(--color-ink)] w-[15%]">DESCRIÇÃO</th>
                                <th scope="col" className="px-4 py-4 w-[5%]"></th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y-2 divide-[var(--color-ink)]">
                            {requests.map((req, index) => (
                                <tr key={req.id} className="align-top hover:bg-[var(--color-bg)] transition-colors">
                                    <td className="px-4 py-4 border-r-2 border-[var(--color-ink)]">
                                        <div className="flex gap-2">
                                            <span className="text-[10px] font-bold text-[var(--color-ink)] opacity-50 pt-2 w-4">{index + 1}.</span>
                                            <input
                                                type="text"
                                                value={req.material}
                                                onChange={(e) => updateRequest(req.id, 'material', e.target.value)}
                                                className="block w-full border-b-2 border-[var(--color-ink)] border-t-0 border-l-0 border-r-0 bg-transparent rounded-none outline-none focus:ring-0 focus:border-[var(--color-accent)] text-sm font-bold uppercase"
                                                placeholder="MATERIAL"
                                            />
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 border-r-2 border-[var(--color-ink)]">
                                        <ProfileDimensionEditor
                                            req={req}
                                            updateRequest={updateRequest}
                                        />
                                    </td>
                                    <td className="px-4 py-4 border-r-2 border-[var(--color-ink)]">
                                        <input
                                            type="number"
                                            value={req.length || ''}
                                            onChange={(e) => updateRequest(req.id, 'length', Number(e.target.value))}
                                            className="block w-full border-2 border-[var(--color-ink)] bg-white rounded-none outline-none focus:ring-0 focus:border-[var(--color-accent)] text-lg font-black px-2 py-1 text-right"
                                            placeholder="0"
                                        />
                                    </td>
                                    <td className="px-4 py-4 border-r-2 border-[var(--color-ink)]">
                                        <input
                                            type="number"
                                            value={req.quantity || ''}
                                            onChange={(e) => updateRequest(req.id, 'quantity', Number(e.target.value))}
                                            className="block w-full border-2 border-[var(--color-ink)] bg-white rounded-none outline-none focus:ring-0 focus:border-[var(--color-accent)] text-lg font-black px-2 py-1 text-center"
                                            placeholder="0"
                                        />
                                    </td>
                                    <td className="px-4 py-4 border-r-2 border-[var(--color-ink)]">
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={req.weightKgM || ''}
                                            placeholder="AUTO"
                                            onChange={(e) => updateRequest(req.id, 'weightKgM', Number(e.target.value))}
                                            className={`block w-full border-2 border-[var(--color-ink)] rounded-none outline-none focus:ring-0 focus:border-[var(--color-accent)] text-sm font-bold px-2 py-2 text-center uppercase tracking-widest ${req.weightKgM && req.weightKgM > 0 ? 'bg-green-100' : 'bg-white'}`}
                                        />
                                    </td>
                                    <td className="px-4 py-4 text-center border-r-2 border-[var(--color-ink)] align-middle">
                                        <label className="flex items-center justify-center cursor-pointer relative top-2">
                                            <input
                                                type="checkbox"
                                                checked={req.skipOptimization || false}
                                                onChange={(e) => updateRequest(req.id, 'skipOptimization', e.target.checked)}
                                                className="sr-only peer"
                                            />
                                            <div className="w-8 h-8 border-2 border-[var(--color-ink)] bg-white peer-checked:bg-[var(--color-accent)] flex items-center justify-center transition-colors">
                                                {(req.skipOptimization) && (
                                                    <span className="text-white text-lg font-black block leading-none relative bottom-[1px]">✓</span>
                                                )}
                                            </div>
                                        </label>
                                    </td>
                                    <td className="px-4 py-4 border-r-2 border-[var(--color-ink)]">
                                        <input
                                            type="text"
                                            value={req.description || ''}
                                            onChange={(e) => updateRequest(req.id, 'description', e.target.value)}
                                            className="block w-full border-b-2 border-dashed border-[var(--color-ink)] border-t-0 border-l-0 border-r-0 bg-transparent rounded-none outline-none focus:ring-0 focus:border-[var(--color-accent)] text-xs font-bold uppercase tracking-widest px-1 py-1"
                                            placeholder="REFERÊNCIA..."
                                        />
                                    </td>
                                    <td className="px-4 py-4 text-center align-middle">
                                        <button
                                            onClick={() => removeRequest(req.id)}
                                            className="text-[var(--color-ink)] hover:text-white border-2 border-transparent hover:border-[var(--color-accent)] hover:bg-[var(--color-accent)] p-2 transition-colors inline-block relative top-2"
                                            title="REMOVER LINHA"
                                        >
                                            <Trash2 className="h-5 w-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {requests.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="px-6 py-12 text-center">
                                        <div className="border-4 border-dashed border-[var(--color-ink)] border-opacity-30 p-8 inline-block bg-[var(--color-bg)]">
                                            <p className="font-black text-[var(--color-ink)] uppercase tracking-widest opacity-50 mb-4">NENHUMA PEÇA REGISTRADA</p>
                                            <button onClick={addRequest} className="px-6 py-2 border-2 border-[var(--color-ink)] bg-white text-[var(--color-ink)] font-black uppercase tracking-widest hover:bg-[var(--color-ink)] hover:text-white transition-colors">
                                                <Plus className="h-4 w-4 inline mr-2 relative bottom-[1px]" /> ADICIONAR PRIMEIRA PEÇA
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Optimization Settings — only for materials that go through the optimizer */}
            {(() => {
                const optimizableMaterials = uniqueMaterials.filter(mat =>
                    requests.some(r => r.material.trim() === mat && !r.skipOptimization)
                );
                if (optimizableMaterials.length === 0) return null;
                return (
                    <div className="bg-white border-4 border-[var(--color-ink)] shadow-[6px_6px_0px_0px_var(--color-ink)] p-8">
                        <h3 className="text-xl font-black text-[var(--color-ink)] uppercase tracking-widest mb-2">SETUP DE ESTOQUE</h3>
                        <p className="text-sm font-bold opacity-70 uppercase tracking-widest mb-8 border-b-2 border-[var(--color-ink)] pb-4">
                            DEFINA O TAMANHO COMERCIAL PADRÃO PARA CADA TIPO DE MATERIAL
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {optimizableMaterials.map((material, idx) => (
                                <div key={material} className="bg-[var(--color-bg)] p-4 border-2 border-[var(--color-ink)] relative">
                                    <div className="absolute -top-3 -left-3 bg-[var(--color-ink)] text-white w-6 h-6 flex items-center justify-center font-black text-xs border border-[var(--color-bg)]">
                                        {idx + 1}
                                    </div>
                                    <label htmlFor={`len-${material}`} className="block text-sm font-black text-[var(--color-ink)] uppercase tracking-widest truncate mb-3" title={material}>
                                        {material}
                                    </label>
                                    <div className="flex">
                                        <input
                                            type="number"
                                            id={`len-${material}`}
                                            className="flex-1 bg-white border-2 border-[var(--color-ink)] outline-none focus:border-[var(--color-accent)] focus:ring-0 rounded-none text-lg font-black px-3 py-2 text-right"
                                            placeholder="6000"
                                            value={standardBarLengths[material] || 6000}
                                            onChange={(e) => setStandardBarLengths(prev => ({ ...prev, [material]: Number(e.target.value) }))}
                                        />
                                        <div className="bg-[var(--color-ink)] text-white font-black text-sm flex items-center px-4 border-y-2 border-r-2 border-[var(--color-ink)]">
                                            MM
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-8 border-t-4 border-dashed border-[var(--color-ink)] border-opacity-30 pt-8">
                            <div className="bg-[var(--color-bg)] p-5 border-2 border-[var(--color-ink)] max-w-md">
                                <label htmlFor="max-scrap" className="block text-sm font-black text-[var(--color-accent)] uppercase tracking-widest mb-2 flex items-center">
                                    <span className="w-2 h-2 bg-[var(--color-accent)] inline-block mr-2"></span>
                                    TOLERÂNCIA DE SUCATA
                                </label>
                                <p className="text-xs font-bold text-[var(--color-ink)] opacity-70 mb-4 uppercase tracking-widest leading-relaxed">
                                    RETALHOS MENORES QUE ESTE VALOR SERÃO DESCARTADOS. MAIORES VOLTAM AO ESTOQUE.
                                </p>
                                <div className="flex">
                                    <input
                                        type="number"
                                        id="max-scrap"
                                        className="flex-1 bg-white border-2 border-[var(--color-ink)] outline-none focus:border-[var(--color-accent)] focus:ring-0 rounded-none text-lg font-black px-3 py-2 text-right"
                                        placeholder="1000"
                                        value={maxScrapLength}
                                        onChange={(e) => setMaxScrapLength(Number(e.target.value))}
                                    />
                                    <div className="bg-[var(--color-ink)] text-white font-black text-sm flex items-center px-4 border-y-2 border-r-2 border-[var(--color-ink)]">
                                        MM
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })()}

            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 border-t-4 border-[var(--color-ink)]">
                <button
                    onClick={onBack}
                    className="w-full sm:w-auto px-6 py-3 border-2 border-[var(--color-ink)] text-sm font-black uppercase tracking-widest text-[var(--color-ink)] hover:bg-[var(--color-ink)] hover:text-white transition-colors active:scale-95"
                >
                    &larr; VOLTAR
                </button>
                <button
                    onClick={onOptimize}
                    disabled={loading || requests.length === 0}
                    className="w-full sm:w-auto px-8 py-4 border-4 border-[var(--color-ink)] text-lg font-black uppercase tracking-widest text-white bg-[var(--color-accent)] hover:bg-[var(--color-ink)] disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 flex items-center justify-center shadow-[6px_6px_0px_0px_var(--color-ink)] hover:shadow-none hover:translate-y-[6px] hover:translate-x-[6px] disabled:shadow-[6px_6px_0px_0px_var(--color-ink)] disabled:translate-y-0 disabled:translate-x-0"
                >
                    {loading ? (
                        <>
                            <RefreshCw className="w-6 h-6 mr-3 animate-spin" /> PROCESSANDO DADOS...
                        </>
                    ) : (
                        <>
                            INICIAR MOTOR DE CORTE <ArrowRight className="ml-3 h-6 w-6" />
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
