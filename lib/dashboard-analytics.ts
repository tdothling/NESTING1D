import { Project, StockItem, OptimizationResult, BarResult } from './types';


// Since we cannot directly import MIN_SCRAP_LENGTH from store (it's hardcoded inside the functions),
// we will define it here for calculations if needed, though most numbers come pre-calculated in BarResult.
const SCRAP_THRESHOLD = 50;

/**
 * Interface Definitions for Dashboard Analytics
 */
export interface ExecutiveMetrics {
    avgEfficiency: number;           // % aproveitamento médio
    totalTrueWasteKg: number;        // sucata total em kg
    totalReusableScrapKg: number;    // retalho total em kg
    compositeBarsCount: number;      // barras compostas (economizadas)
    totalProjects: number;
    stockValueBRL: number;           // valor total do estoque em R$
    stockWeightKg: number;           // peso total do estoque em kg
}

export interface FinancialMetrics {
    totalPurchaseCostBRL: number;    // custo de material comprado
    totalScrapLossBRL: number;       // valor da sucata perdida
    totalRecoveredValueBRL: number;  // valor do retalho recuperado
    compositeSavingsBRL: number;     // economia por barras compostas
    cumulativeSavingsBRL: number;    // economia acumulada
}

export interface EfficiencyByProject {
    projectId: string;
    projectName: string;
    date: string;
    efficiency: number;              // %
    wasteKg: number;
    reusableScrapKg: number;
    barsUsed: number;
    compositeBars: number;
}

export interface MaterialBreakdown {
    material: string;
    totalUsedMm: number;
    wasteKg: number;
    efficiency: number;
    totalCostBRL: number;
}

export interface StockBreakdown {
    material: string;
    barsCount: number;
    scrapsCount: number;
    totalWeightKg: number;
    totalValueBRL: number;
}

export interface TimelineTrend {
    date: string;
    efficiency: number;
    savingsBRL: number;
    projectsCount: number;
    wasteKg: number;
}

/**
 * Calculators
 */

export function calcExecutiveMetrics(projects: Project[], stock: StockItem[]): ExecutiveMetrics {
    let totalTrueWasteKg = 0;
    let totalReusableScrapKg = 0;
    let compositeBarsCount = 0;

    let totalEfficiencySum = 0;
    let projectsWithResults = 0;

    projects.forEach(p => {
        if (p.result) {
            projectsWithResults++;
            totalTrueWasteKg += p.result.totalTrueWasteKg || 0;

            const projectEfficiency = calcProjectEfficiency(p.result);
            totalEfficiencySum += projectEfficiency;

            p.result.bars.forEach(bar => {
                if (bar.isComposite) compositeBarsCount++;
                // To accurately get reusable scrap kg: scrap length (mm) / 1000 * weightKgM
                if (bar.reusableScrap >= SCRAP_THRESHOLD && bar.weightKgM) {
                    totalReusableScrapKg += (bar.reusableScrap / 1000) * bar.weightKgM;
                }
            });
        }
    });

    const avgEfficiency = projectsWithResults > 0 ? (totalEfficiencySum / projectsWithResults) : 0;

    let stockValueBRL = 0;
    let stockWeightKg = 0;

    stock.forEach(item => {
        const weight = (item.length / 1000) * (item.weightKgM || 0) * item.quantity;
        stockWeightKg += weight;
        stockValueBRL += weight * (item.pricePerKg || 0);
    });

    return {
        avgEfficiency,
        totalTrueWasteKg,
        totalReusableScrapKg,
        compositeBarsCount,
        totalProjects: projects.length,
        stockValueBRL,
        stockWeightKg
    };
}

export function calcFinancialMetrics(projects: Project[], stock: StockItem[]): FinancialMetrics {
    let totalPurchaseCostBRL = 0;
    let totalScrapLossBRL = 0;
    let totalRecoveredValueBRL = 0;
    let compositeSavingsBRL = 0;

    projects.forEach(p => {
        if (p.result) {
            // Purchase Cost
            p.result.purchaseList?.forEach(item => {
                const stockRef = stock.find(s => s.material.trim().toLowerCase() === item.material.trim().toLowerCase() && s.pricePerKg && s.pricePerKg > 0);
                if (stockRef && stockRef.pricePerKg) {
                    totalPurchaseCostBRL += (item.length / 1000) * (stockRef.weightKgM || 0) * stockRef.pricePerKg * item.quantity;
                }
            });

            p.result.bars.forEach(bar => {
                const stockRef = stock.find(s => s.material.trim().toLowerCase() === bar.material.trim().toLowerCase() && s.pricePerKg && s.pricePerKg > 0);
                if (stockRef && stockRef.pricePerKg) {
                    const price = stockRef.pricePerKg;

                    // Scrap Loss
                    if (bar.trueWasteKg > 0) {
                        totalScrapLossBRL += bar.trueWasteKg * price;
                    }

                    // Recovered Value
                    if (bar.reusableScrap >= SCRAP_THRESHOLD && bar.weightKgM) {
                        totalRecoveredValueBRL += (bar.reusableScrap / 1000) * bar.weightKgM * price;
                    }

                    // Composite Savings (Bar that was not bought)
                    if (bar.isComposite && bar.weightKgM) {
                        const standardLen = p.settings?.standardBarLengths?.[bar.material] || 6000;
                        compositeSavingsBRL += (standardLen / 1000) * bar.weightKgM * price;
                    }
                }
            });
        }
    });

    return {
        totalPurchaseCostBRL,
        totalScrapLossBRL,
        totalRecoveredValueBRL,
        compositeSavingsBRL,
        cumulativeSavingsBRL: totalRecoveredValueBRL + compositeSavingsBRL - totalScrapLossBRL
    };
}

export function calcEfficiencyByProject(projects: Project[], stock: StockItem[]): EfficiencyByProject[] {
    return projects.filter(p => !!p.result).map(p => {
        const result = p.result!;
        let reusableScrapKg = 0;
        let compositeCount = 0;

        result.bars.forEach(bar => {
            if (bar.isComposite) compositeCount++;
            if (bar.reusableScrap >= SCRAP_THRESHOLD && bar.weightKgM) {
                reusableScrapKg += (bar.reusableScrap / 1000) * bar.weightKgM;
            }
        });

        return {
            projectId: p.id,
            projectName: p.name || 'Projeto sem nome',
            date: p.createdAt,
            efficiency: calcProjectEfficiency(result),
            wasteKg: result.totalTrueWasteKg || 0,
            reusableScrapKg,
            barsUsed: result.totalStockUsed || 0,
            compositeBars: compositeCount
        };
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

export function calcMaterialBreakdown(projects: Project[], stock: StockItem[]): MaterialBreakdown[] {
    const map: Record<string, { usedMm: number, trueWasteMm: number, wasteKg: number, costBRL: number }> = {};

    projects.forEach(p => {
        if (p.result) {
            p.result.bars.forEach(bar => {
                if (!map[bar.material]) {
                    map[bar.material] = { usedMm: 0, trueWasteMm: 0, wasteKg: 0, costBRL: 0 };
                }

                // Items requested sum = bar length - waste
                const usedInBar = bar.length - bar.waste;

                map[bar.material].usedMm += usedInBar;
                map[bar.material].trueWasteMm += bar.trueWaste;
                map[bar.material].wasteKg += bar.trueWasteKg;

                const stockRef = stock.find(s => s.material.trim().toLowerCase() === bar.material.trim().toLowerCase() && s.pricePerKg && s.pricePerKg > 0);
                if (stockRef && stockRef.pricePerKg) {
                    // we attribute the cost of the entire bar used
                    map[bar.material].costBRL += (bar.length / 1000) * (bar.weightKgM || 0) * stockRef.pricePerKg;
                }
            });
        }
    });

    return Object.keys(map).map(mat => {
        const data = map[mat];
        const totalMaterial = data.usedMm + data.trueWasteMm; // approximate
        const efficiency = totalMaterial > 0 ? (data.usedMm / totalMaterial) * 100 : 0;
        return {
            material: mat,
            totalUsedMm: data.usedMm,
            wasteKg: data.wasteKg,
            efficiency,
            totalCostBRL: data.costBRL
        };
    }).sort((a, b) => b.wasteKg - a.wasteKg);
}

export function calcStockBreakdown(stock: StockItem[]): StockBreakdown[] {
    const map: Record<string, { bars: number, scraps: number, weight: number, value: number }> = {};

    stock.forEach(item => {
        if (!map[item.material]) {
            map[item.material] = { bars: 0, scraps: 0, weight: 0, value: 0 };
        }

        if (item.isScrap) {
            map[item.material].scraps += item.quantity;
        } else {
            map[item.material].bars += item.quantity;
        }

        const weight = (item.length / 1000) * (item.weightKgM || 0) * item.quantity;
        map[item.material].weight += weight;
        map[item.material].value += weight * (item.pricePerKg || 0);
    });

    return Object.keys(map).map(mat => ({
        material: mat,
        barsCount: map[mat].bars,
        scrapsCount: map[mat].scraps,
        totalWeightKg: map[mat].weight,
        totalValueBRL: map[mat].value
    })).sort((a, b) => b.totalValueBRL - a.totalValueBRL);
}

export function calcTimelineTrend(projects: Project[], stock: StockItem[]): TimelineTrend[] {
    // Group by "Month-Year"
    const grouped: Record<string, { efficiencies: number[], savings: number, projectsCount: number, wasteKg: number }> = {};

    projects.filter(p => !!p.result).forEach(p => {
        const dateObj = new Date(p.createdAt);
        const m = dateObj.getMonth() + 1;
        const y = dateObj.getFullYear();
        const period = `${y}-${m.toString().padStart(2, '0')}`; // YYYY-MM

        if (!grouped[period]) {
            grouped[period] = { efficiencies: [], savings: 0, projectsCount: 0, wasteKg: 0 };
        }

        grouped[period].projectsCount++;
        grouped[period].wasteKg += p.result!.totalTrueWasteKg;
        grouped[period].efficiencies.push(calcProjectEfficiency(p.result!));

        p.result!.bars.forEach(bar => {
            const stockRef = stock.find(s => s.material.trim().toLowerCase() === bar.material.trim().toLowerCase() && s.pricePerKg && s.pricePerKg > 0);
            if (stockRef && stockRef.pricePerKg) {
                const price = stockRef.pricePerKg;
                if (bar.reusableScrap >= SCRAP_THRESHOLD && bar.weightKgM) {
                    grouped[period].savings += (bar.reusableScrap / 1000) * bar.weightKgM * price;
                }
                if (bar.isComposite && bar.weightKgM) {
                    const standardLen = p.settings?.standardBarLengths?.[bar.material] || 6000;
                    grouped[period].savings += (standardLen / 1000) * bar.weightKgM * price;
                }
                if (bar.trueWasteKg > 0) {
                    grouped[period].savings -= bar.trueWasteKg * price;
                }
            }
        });
    });

    return Object.keys(grouped).sort().map(period => {
        const data = grouped[period];
        const avgEff = data.efficiencies.length > 0 ? data.efficiencies.reduce((a, b) => a + b, 0) / data.efficiencies.length : 0;

        // Format period from YYYY-MM to localized MMM YYYY if needed, but keeping simple for chart
        return {
            date: period,
            efficiency: avgEff,
            savingsBRL: data.savings,
            projectsCount: data.projectsCount,
            wasteKg: data.wasteKg
        };
    });
}

// Helpers
function calcProjectEfficiency(result: OptimizationResult): number {
    const totalBarLength = result.bars.reduce((acc, b) => acc + b.length, 0);
    if (totalBarLength === 0) return 0;
    return (1 - (result.totalTrueWaste / totalBarLength)) * 100;
}
