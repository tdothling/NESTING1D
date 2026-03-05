'use client';

import { useEffect, useState, useMemo } from 'react';
import { Navbar } from '@/components/Navbar';
import { getProjects, getStock } from '@/lib/store';
import { Project, StockItem } from '@/lib/types';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
    LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, Treemap
} from 'recharts';
import {
    TrendingUp, CircleDollarSign, Scissors, Package, LayoutDashboard,
    Trash2, Wallet, PiggyBank, Receipt, Wrench, Factory, ArrowRight
} from 'lucide-react';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { ChartCard } from '@/components/dashboard/ChartCard';
import { GaugeChart } from '@/components/dashboard/GaugeChart';
import { WaterfallBar } from '@/components/dashboard/WaterfallBar';
import {
    calcExecutiveMetrics, calcFinancialMetrics, calcEfficiencyByProject,
    calcMaterialBreakdown, calcStockBreakdown, calcTimelineTrend
} from '@/lib/dashboard-analytics';
import Link from 'next/link';

type TabType = 'executivo' | 'financeiro' | 'eficiencia' | 'estoque' | 'tendencias';

export default function DashboardPage() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [stock, setStock] = useState<StockItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<TabType>('executivo');

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                const [projectsData, stockData] = await Promise.all([getProjects(), getStock()]);
                setProjects(projectsData);
                setStock(stockData);
            } catch (error) {
                console.error("Failed to load data", error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    // Compute metrics only when data changes
    const execMetrics = useMemo(() => calcExecutiveMetrics(projects, stock), [projects, stock]);
    const finMetrics = useMemo(() => calcFinancialMetrics(projects, stock), [projects, stock]);
    const effData = useMemo(() => calcEfficiencyByProject(projects, stock), [projects, stock]);
    const matBreakdown = useMemo(() => calcMaterialBreakdown(projects, stock), [projects, stock]);
    const stockBreakdown = useMemo(() => calcStockBreakdown(stock), [stock]);
    const timelineData = useMemo(() => calcTimelineTrend(projects, stock), [projects, stock]);

    // Format helpers
    const fmtMoney = (val: number) => `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const fmtKg = (val: number) => `${val.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} kg`;

    // Colors for charts
    const COLORS = {
        ink: '#141414',
        accent: '#f9411d',
        emerald: '#10b981',
        amber: '#f59e0b',
        red: '#ef4444',
        bg: '#E4E3E0',
        gray: '#9ca3af'
    };

    const CustomTooltip = ({ active, payload, label, formatter }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white border-2 border-[var(--color-ink)] p-3 shadow-[4px_4px_0px_0px_var(--color-ink)] font-mono text-xs">
                    <p className="font-bold border-b border-dashed border-[var(--color-ink)] pb-1 mb-2 uppercase">{label}</p>
                    {payload.map((entry: any, index: number) => (
                        <p key={index} style={{ color: entry.color }} className="font-black flex justify-between gap-4">
                            <span>{entry.name}:</span>
                            <span>{formatter ? formatter(entry.value) : entry.value}</span>
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[var(--color-bg)] selection:bg-[var(--color-ink)] selection:text-[var(--color-bg)]">
                <Navbar />
                <div className="flex justify-center items-center h-[calc(100vh-64px)]">
                    <div className="font-mono text-[var(--color-ink)] animate-pulse text-xl font-black uppercase tracking-widest border-4 border-dashed border-[var(--color-ink)] p-8">
                        Processando Analytics...
                    </div>
                </div>
            </div>
        );
    }

    const renderTabs = () => (
        <div className="flex overflow-x-auto border-b-4 border-[var(--color-ink)] mb-8 scrollbar-hide">
            {[
                { id: 'executivo', label: 'Executivo', icon: LayoutDashboard },
                { id: 'financeiro', label: 'Financeiro', icon: CircleDollarSign },
                { id: 'eficiencia', label: 'Eficiência', icon: Scissors },
                { id: 'estoque', label: 'Estoque', icon: Package },
                { id: 'tendencias', label: 'Tendências & ROI', icon: TrendingUp },
            ].map((tab) => {
                const isActive = activeTab === tab.id;
                const Icon = tab.icon;
                return (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as TabType)}
                        className={`flex items-center px-6 py-4 font-mono text-sm font-black uppercase tracking-widest border-r-2 border-dashed border-[var(--color-ink)] whitespace-nowrap transition-colors
              ${isActive
                                ? 'bg-[var(--color-ink)] text-[var(--color-bg)] border-b-4 border-b-[var(--color-accent)] -mb-1'
                                : 'bg-white text-[var(--color-ink)] hover:bg-[var(--color-bg)]'
                            }`}
                    >
                        <Icon className={`w-4 h-4 mr-2 ${isActive ? 'text-[var(--color-accent)]' : ''}`} />
                        {tab.label}
                    </button>
                );
            })}
        </div>
    );

    return (
        <div className="min-h-screen bg-[var(--color-bg)] selection:bg-[var(--color-ink)] selection:text-[var(--color-bg)] pb-12">
            <Navbar />

            <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                <div className="flex items-center space-x-4 mb-4">
                    <div className="w-3 h-8 bg-[var(--color-accent)]"></div>
                    <h1 className="text-3xl font-black text-[var(--color-ink)] font-mono uppercase tracking-widest">
                        Visão Geral Analytics
                    </h1>
                </div>

                {renderTabs()}

                {/* ========================================================= */}
                {/* TAB: EXECUTIVO */}
                {/* ========================================================= */}
                {activeTab === 'executivo' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* Top row: Gauge + Highlight KPIs */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-1 bg-white border-4 border-[var(--color-ink)] shadow-[8px_8px_0px_0px_var(--color-ink)] p-6 flex flex-col items-center justify-center min-h-[300px]">
                                <h3 className="w-full text-left font-mono font-black border-b-2 border-dashed border-[var(--color-ink)] pb-2 mb-6 uppercase tracking-widest">Aproveitamento Global</h3>
                                <GaugeChart value={execMetrics.avgEfficiency || 0} label="EFICIÊNCIA MÉDIA" />
                            </div>

                            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <KpiCard
                                    title="Projetos Processados"
                                    value={execMetrics.totalProjects}
                                    icon={Factory}
                                    variant="ink"
                                />
                                <KpiCard
                                    title="Valor em Estoque"
                                    value={fmtMoney(execMetrics.stockValueBRL)}
                                    subtitle={`PESO TOTAL: ${fmtKg(execMetrics.stockWeightKg)}`}
                                    icon={Wallet}
                                    variant="emerald"
                                />
                                <KpiCard
                                    title="Retalho Recuperado"
                                    value={fmtKg(execMetrics.totalReusableScrapKg)}
                                    icon={PiggyBank}
                                    variant="amber"
                                />
                                <KpiCard
                                    title="Sucata (Perda Real)"
                                    value={fmtKg(execMetrics.totalTrueWasteKg)}
                                    icon={Trash2}
                                    variant="red"
                                />
                            </div>
                        </div>

                        {/* Bottom Row: Composite savings Highlight */}
                        <ChartCard title="Impacto das Soldas" subtitle="Barras compostas por retalhos">
                            <div className="flex flex-col md:flex-row items-center justify-between">
                                <div className="flex items-center mb-6 md:mb-0">
                                    <div className="bg-[var(--color-accent)] text-white p-4 border-2 border-[var(--color-ink)] mr-6">
                                        <Wrench className="w-12 h-12" />
                                    </div>
                                    <div>
                                        <div className="font-mono text-5xl font-black text-[var(--color-ink)]">{execMetrics.compositeBarsCount}</div>
                                        <div className="font-mono text-sm font-bold uppercase tracking-widest opacity-70">Barras Novas Evitadas</div>
                                    </div>
                                </div>
                                <div className="w-full md:w-2/3 border-l-0 md:border-l-4 border-t-4 md:border-t-0 border-[var(--color-ink)] pt-6 md:pt-0 pl-0 md:pl-8 text-sm font-mono opacity-80 uppercase font-bold text-justify">
                                    O sistema permite a soldagem de múltiplos retalhos para formar um material equivalente a uma barra nova.
                                    Até o momento, {execMetrics.compositeBarsCount} barras inteiras deixaram de ser compradas graças a essa funcionalidade,
                                    reduzindo significativamente o custo da obra e o volume de sucata.
                                </div>
                            </div>
                        </ChartCard>
                    </div>
                )}

                {/* ========================================================= */}
                {/* TAB: FINANCEIRO */}
                {/* ========================================================= */}
                {activeTab === 'financeiro' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {finMetrics.totalPurchaseCostBRL === 0 && execMetrics.stockValueBRL === 0 && (
                            <div className="bg-amber-50 border-4 border-amber-500 p-4 font-mono text-sm font-bold text-amber-800 uppercase flex items-center shadow-[4px_4px_0px_0px_#f59e0b] mb-6">
                                <CircleDollarSign className="w-6 h-6 mr-3" />
                                Aviso: O preço por KG (pricePerKg) não está preenchido nos itens de estoque. As métricas financeiras estarão zeradas.
                            </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            <KpiCard title="Custo de Compra (Est.)" value={fmtMoney(finMetrics.totalPurchaseCostBRL)} icon={Receipt} variant="ink" />
                            <KpiCard title="Economia c/ Soldas" value={fmtMoney(finMetrics.compositeSavingsBRL)} icon={Wrench} variant="emerald" />
                            <KpiCard title="Retalho Retornado" value={fmtMoney(finMetrics.totalRecoveredValueBRL)} icon={PiggyBank} variant="amber" />
                            <KpiCard title="Prejuízo em Sucata" value={fmtMoney(finMetrics.totalScrapLossBRL)} icon={Trash2} variant="red" />
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <ChartCard title="Distribuição do Custo de Material">
                                <div className="h-80">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={[
                                                    { name: 'Peças Úteis', value: finMetrics.totalPurchaseCostBRL - finMetrics.totalScrapLossBRL - finMetrics.totalRecoveredValueBRL },
                                                    { name: 'Retalho Recuperado', value: finMetrics.totalRecoveredValueBRL },
                                                    { name: 'Sucata Perdida', value: finMetrics.totalScrapLossBRL }
                                                ]}
                                                cx="50%" cy="50%"
                                                innerRadius={80} outerRadius={110}
                                                paddingAngle={2}
                                                dataKey="value"
                                                stroke="var(--color-ink)"
                                                strokeWidth={2}
                                            >
                                                <Cell fill={COLORS.ink} />
                                                <Cell fill={COLORS.amber} />
                                                <Cell fill={COLORS.red} />
                                            </Pie>
                                            <RechartsTooltip content={<CustomTooltip formatter={fmtMoney} />} />
                                            <Legend wrapperStyle={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 'bold' }} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </ChartCard>

                            <ChartCard title="ROI do Programa" subtitle="Custo Evitado vs Perdido">
                                <div className="flex flex-col h-full justify-center space-y-8 px-8">
                                    <div>
                                        <div className="flex justify-between font-mono font-black text-sm uppercase mb-2">
                                            <span className="text-emerald-600">Economia Acumulada</span>
                                            <span className="text-emerald-600">{fmtMoney(finMetrics.totalRecoveredValueBRL + finMetrics.compositeSavingsBRL)}</span>
                                        </div>
                                        <div className="h-8 bg-emerald-50 border-2 border-emerald-600 w-full overflow-hidden relative shadow-[4px_4px_0px_0px_#059669]">
                                            <div className="h-full bg-emerald-500 absolute left-0" style={{ width: '100%' }}></div>
                                        </div>
                                        <div className="mt-2 text-[10px] font-mono text-emerald-800 uppercase font-bold">(Retalhos salvos + Barras não compradas devidas à solda)</div>
                                    </div>

                                    <div>
                                        <div className="flex justify-between font-mono font-black text-sm uppercase mb-2">
                                            <span className="text-red-600">Perda Irrecuperável (Sucata)</span>
                                            <span className="text-red-600">{fmtMoney(finMetrics.totalScrapLossBRL)}</span>
                                        </div>
                                        <div className="h-8 bg-red-50 border-2 border-red-600 w-full overflow-hidden relative shadow-[4px_4px_0px_0px_#dc2626]">
                                            {/* Calculate ratio relative to savings just to render a visual bar */}
                                            <div className="h-full bg-red-500 absolute left-0" style={{ width: `${Math.min(100, (finMetrics.totalScrapLossBRL / (finMetrics.totalRecoveredValueBRL + finMetrics.compositeSavingsBRL || 1)) * 100)}%` }}></div>
                                        </div>
                                    </div>

                                    <div className="bg-[var(--color-ink)] text-white p-4 border border-[var(--color-ink)] font-mono flex justify-between items-center shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] mt-auto">
                                        <span className="font-black uppercase tracking-widest">SALDO LÍQUIDO DO OTIMIZADOR</span>
                                        <span className={`text-xl font-black ${finMetrics.cumulativeSavingsBRL >= 0 ? 'text-[var(--color-bg)]' : 'text-red-400'}`}>
                                            {fmtMoney(finMetrics.cumulativeSavingsBRL)}
                                        </span>
                                    </div>
                                </div>
                            </ChartCard>
                        </div>
                    </div>
                )}

                {/* ========================================================= */}
                {/* TAB: EFICIÊNCIA */}
                {/* ========================================================= */}
                {activeTab === 'eficiencia' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* Last Project Waterfall */}
                        {projects.filter(p => !!p.result).length > 0 && (
                            <ChartCard title="Último Projeto Processado" subtitle={effData[effData.length - 1]?.projectName}>
                                <WaterfallBar
                                    total={100}
                                    unit="%"
                                    segments={[
                                        { label: 'Aproveitamento', value: effData[effData.length - 1]?.efficiency || 0, colorClass: 'bg-[var(--color-ink)] text-white' },
                                        { label: 'Retalho Recuperado', value: (effData[effData.length - 1]?.reusableScrapKg / (effData[effData.length - 1]?.wasteKg + effData[effData.length - 1]?.reusableScrapKg || 1)) * (100 - (effData[effData.length - 1]?.efficiency || 0)), colorClass: 'bg-amber-400 text-amber-900', pattern: 'repeating-linear-gradient(45deg, #fffbeb 0, #fffbeb 1px, #fcd34d 0, #fcd34d 50%)' },
                                        { label: 'Sucata', value: (effData[effData.length - 1]?.wasteKg / (effData[effData.length - 1]?.wasteKg + effData[effData.length - 1]?.reusableScrapKg || 1)) * (100 - (effData[effData.length - 1]?.efficiency || 0)), colorClass: 'bg-red-500 text-white', pattern: 'repeating-linear-gradient(45deg, #fee2e2 0, #fee2e2 1px, #fca5a5 0, #fca5a5 50%)' }
                                    ]}
                                />
                            </ChartCard>
                        )}

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <ChartCard title="Top 5 Materiais com Mais Desperdício" subtitle="Por peso em KG de sucata">
                                <div className="h-80">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={matBreakdown.slice(0, 5)} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke={COLORS.gray} opacity={0.3} />
                                            <XAxis type="number" tickFormatter={(val) => `${val}kg`} tick={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 'bold' }} />
                                            <YAxis type="category" dataKey="material" width={100} tick={{ fontFamily: 'var(--font-mono)', fontSize: 10, fill: COLORS.ink, fontWeight: 'bold' }} />
                                            <RechartsTooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} content={<CustomTooltip formatter={fmtKg} />} />
                                            <Bar dataKey="wasteKg" name="Sucata" fill={COLORS.red} stroke={COLORS.ink} strokeWidth={2} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </ChartCard>

                            <ChartCard title="Ranking de Projetos" subtitle="Ordenado pelos projetos mais recentes">
                                <div className="overflow-x-auto h-80 overflow-y-auto border-2 border-[var(--color-ink)] bg-white">
                                    <table className="min-w-full divide-y-2 divide-[var(--color-ink)] text-sm font-mono">
                                        <thead className="bg-[var(--color-bg)] top-0 sticky z-10 border-b-2 border-[var(--color-ink)] shadow-sm">
                                            <tr>
                                                <th className="px-4 py-3 text-left font-black uppercase">PROJETO</th>
                                                <th className="px-4 py-3 text-right font-black uppercase">EFICIÊNCIA</th>
                                                <th className="px-4 py-3 text-right font-black uppercase">SUCATA</th>
                                                <th className="px-4 py-3 text-center font-black uppercase">SOLDAS</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-dashed divide-[var(--color-ink)]">
                                            {[...effData].reverse().map((data) => (
                                                <tr key={data.projectId} className="hover:bg-[var(--color-bg)] transition-colors group">
                                                    <td className="px-4 py-3 font-bold truncate max-w-[150px]">
                                                        <Link href={`/optimize?id=${data.projectId}`} className="group-hover:text-[var(--color-accent)] group-hover:underline w-full block truncate">
                                                            {data.projectName}
                                                        </Link>
                                                    </td>
                                                    <td className={`px-4 py-3 text-right font-black ${data.efficiency >= 90 ? 'text-emerald-600' : data.efficiency >= 70 ? 'text-amber-600' : 'text-red-500'}`}>
                                                        {data.efficiency.toFixed(1)}%
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-bold opacity-80">{data.wasteKg.toFixed(1)} kg</td>
                                                    <td className="px-4 py-3 text-center">
                                                        {data.compositeBars > 0
                                                            ? <span className="bg-[var(--color-accent)] text-white px-2 py-0.5 text-xs font-black">{data.compositeBars}</span>
                                                            : <span className="text-gray-400">-</span>}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </ChartCard>
                        </div>
                    </div>
                )}

                {/* ========================================================= */}
                {/* TAB: ESTOQUE */}
                {/* ========================================================= */}
                {activeTab === 'estoque' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            <KpiCard title="Barras Totais" value={stockBreakdown.reduce((a, b) => a + b.barsCount, 0)} icon={Factory} variant="ink" />
                            <KpiCard title="Retalhos Totais" value={stockBreakdown.reduce((a, b) => a + b.scrapsCount, 0)} icon={Scissors} variant="ink" />
                            <KpiCard title="Peso em Estoque" value={fmtKg(stockBreakdown.reduce((a, b) => a + b.totalWeightKg, 0))} icon={Package} variant="accent" />
                            <KpiCard title="Capital Parado" value={fmtMoney(stockBreakdown.reduce((a, b) => a + b.totalValueBRL, 0))} icon={Wallet} variant="emerald" />
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <ChartCard title="Valor por Material">
                                <div className="h-96">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={stockBreakdown.slice(0, 10)} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke={COLORS.gray} opacity={0.3} />
                                            <XAxis type="number" tickFormatter={(val) => `R$${val / 1000}k`} tick={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 'bold' }} />
                                            <YAxis type="category" dataKey="material" width={100} tick={{ fontFamily: 'var(--font-mono)', fontSize: 10, fill: COLORS.ink, fontWeight: 'bold' }} />
                                            <RechartsTooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} content={<CustomTooltip formatter={fmtMoney} />} />
                                            <Bar dataKey="totalValueBRL" name="Valor" fill={COLORS.emerald} stroke={COLORS.ink} strokeWidth={2} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </ChartCard>

                            <ChartCard title="Composição do Estoque" subtitle="Top 5 Materiais (Barras vs Retalhos)">
                                <div className="overflow-x-auto h-96 overflow-y-auto border-2 border-[var(--color-ink)] bg-white">
                                    <table className="min-w-full divide-y-2 divide-[var(--color-ink)] text-sm font-mono">
                                        <thead className="bg-[var(--color-bg)] top-0 sticky z-10 border-b-2 border-[var(--color-ink)] shadow-sm">
                                            <tr>
                                                <th className="px-4 py-3 text-left font-black uppercase">MATERIAL</th>
                                                <th className="px-4 py-3 text-right font-black uppercase">BARRAS</th>
                                                <th className="px-4 py-3 text-right font-black uppercase">RETALHOS</th>
                                                <th className="px-4 py-3 text-right font-black uppercase">PESO (KG)</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-dashed divide-[var(--color-ink)]">
                                            {stockBreakdown.map((data) => (
                                                <tr key={data.material} className="hover:bg-[var(--color-bg)] transition-colors">
                                                    <td className="px-4 py-3 font-bold uppercase truncate max-w-[150px]">{data.material}</td>
                                                    <td className="px-4 py-3 text-right font-black">{data.barsCount}</td>
                                                    <td className="px-4 py-3 text-right font-black text-amber-600">{data.scrapsCount}</td>
                                                    <td className="px-4 py-3 text-right font-black opacity-80">{data.totalWeightKg.toFixed(1)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </ChartCard>
                        </div>
                    </div>
                )}

                {/* ========================================================= */}
                {/* TAB: TENDÊNCIAS */}
                {/* ========================================================= */}
                {activeTab === 'tendencias' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <ChartCard title="Evolução da Eficiência (Média Mensal)">
                            <div className="h-80 w-full pt-4">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={timelineData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={COLORS.gray} opacity={0.3} />
                                        <XAxis dataKey="date" tick={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 'bold' }} stroke={COLORS.ink} />
                                        <YAxis domain={[0, 100]} tickFormatter={(val) => `${val}%`} tick={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 'bold' }} stroke={COLORS.ink} />
                                        <RechartsTooltip content={<CustomTooltip formatter={(val: number) => `${val.toFixed(1)}%`} />} />
                                        <Legend wrapperStyle={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 'bold' }} />
                                        <Line type="monotone" dataKey="efficiency" name="Aproveitamento Global" stroke={COLORS.ink} strokeWidth={4} activeDot={{ r: 8, fill: COLORS.accent, stroke: COLORS.ink, strokeWidth: 2 }} dot={{ r: 5, fill: COLORS.bg, stroke: COLORS.ink, strokeWidth: 2 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </ChartCard>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <ChartCard title="Economia Acumulada no Mês">
                                <div className="h-64">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={timelineData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                            <defs>
                                                <linearGradient id="colorSavings" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor={COLORS.emerald} stopOpacity={0.8} />
                                                    <stop offset="95%" stopColor={COLORS.emerald} stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={COLORS.gray} opacity={0.3} />
                                            <XAxis dataKey="date" tick={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 'bold' }} stroke={COLORS.ink} />
                                            <YAxis tickFormatter={(val) => `R$${val / 1000}k`} tick={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 'bold' }} stroke={COLORS.ink} />
                                            <RechartsTooltip content={<CustomTooltip formatter={fmtMoney} />} />
                                            <Area type="step" dataKey="savingsBRL" name="Economia (R$)" stroke={COLORS.emerald} strokeWidth={3} fillOpacity={1} fill="url(#colorSavings)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </ChartCard>

                            <ChartCard title="Volume de Sucata Gerada">
                                <div className="h-64">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={timelineData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={COLORS.gray} opacity={0.3} />
                                            <XAxis dataKey="date" tick={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 'bold' }} stroke={COLORS.ink} />
                                            <YAxis tickFormatter={(val) => `${val}kg`} tick={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 'bold' }} stroke={COLORS.ink} />
                                            <RechartsTooltip content={<CustomTooltip formatter={fmtKg} />} />
                                            <Bar dataKey="wasteKg" name="Sucata Mensal" fill={COLORS.red} stroke={COLORS.ink} strokeWidth={2} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </ChartCard>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
