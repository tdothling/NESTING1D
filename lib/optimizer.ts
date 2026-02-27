import { CutRequest, StockItem, BarResult, Cut, PurchaseItem } from './types';

interface OptimizerOptions {
  standardBarLengths: Record<string, number>; // material -> length
  defaultStandardLength: number;
  kerf: number; // blade thickness, e.g., 3mm
  maxScrapLength: number; // lengths below this are true waste, lengths above or equal return to stock
}

export function optimizeCuts(
  requests: CutRequest[],
  stock: StockItem[],
  options: OptimizerOptions = { standardBarLengths: {}, defaultStandardLength: 6000, kerf: 3, maxScrapLength: 1000 }
): { results: BarResult[]; remainingStock: StockItem[]; itemsNotFit: CutRequest[]; purchaseList: PurchaseItem[]; totalTrueWaste: number; totalTrueWasteKg: number; totalReusableScrap: number } {

  // Group requests by material
  const requestsByMaterial: Record<string, CutRequest[]> = {};
  const materialWeights: Record<string, number> = {};
  const directPurchases: PurchaseItem[] = [];

  requests.forEach(req => {
    // Check if item skips optimization (e.g., Plates)
    if (req.skipOptimization) {
      directPurchases.push({
        material: req.material,
        length: req.length,
        quantity: req.quantity
      });
      return; // Skip adding to requestsByMaterial
    }

    const mat = req.material.trim();
    if (!requestsByMaterial[mat]) {
      requestsByMaterial[mat] = [];
    }
    requestsByMaterial[mat].push(req);

    // Track linear weight if provided in the requests
    if (req.weightKgM && req.weightKgM > 0) {
      materialWeights[mat] = req.weightKgM;
    }
  });

  let allResults: BarResult[] = [];
  let allItemsNotFit: CutRequest[] = [];
  let currentStock = stock.map(s => ({ ...s })); // Deep copy

  // Process each material separately
  for (const material of Object.keys(requestsByMaterial)) {
    const materialRequests = requestsByMaterial[material];
    const standardLength = options.standardBarLengths[material] || options.defaultStandardLength;

    // Filter stock for this material
    const materialStockIndices = currentStock
      .map((s, index) => ({ ...s, originalIndex: index }))
      .filter(s => s.material.trim().toLowerCase() === material.toLowerCase());

    // Expand requests into individual items AND handle splitting logic
    let itemsToCut: { id: string; length: number; description?: string }[] = [];

    materialRequests.forEach((req) => {
      for (let i = 0; i < req.quantity; i++) {
        // Check if item needs splitting
        if (req.length > standardLength) {
          // Calculate how many full bars are needed
          const fullBarsNeeded = Math.floor(req.length / standardLength);
          const remainder = req.length % standardLength;

          // Create "virtual" full bars immediately
          for (let b = 0; b < fullBarsNeeded; b++) {
            allResults.push({
              id: `${material.replace(/\s+/g, '-')}-split-full-${crypto.randomUUID()}`,
              material: material,
              length: standardLength,
              cuts: [{ length: standardLength, description: `${req.description || 'Peça Longa'} (Parte ${b + 1})` }],
              waste: 0,
              trueWaste: 0,
              trueWasteKg: 0,
              reusableScrap: 0,
              isScrapUsed: false,
              sourceId: 'new-standard'
            });
          }

          // Add remainder to items to be cut, if significant
          if (remainder > 0) {
            itemsToCut.push({
              id: `${req.id}-remainder`,
              length: remainder,
              description: `${req.description || 'Peça Longa'} (Final)`,
            });
          }
        } else {
          // Normal item
          itemsToCut.push({
            id: req.id,
            length: req.length,
            description: req.description,
          });
        }
      }
    });

    // Sort items descending (Best Fit Decreasing strategy)
    itemsToCut.sort((a, b) => b.length - a.length);

    let openBins: {
      sourceId: string;
      material: string;
      totalLength: number;
      remainingLength: number;
      cuts: Cut[];
      isScrap: boolean;
    }[] = [];

    for (const item of itemsToCut) {
      let placed = false;

      // 1. Try to fit in an existing open bin (Best Fit)
      let bestBinIndex = -1;
      let minRemaining = Infinity;

      for (let i = 0; i < openBins.length; i++) {
        const bin = openBins[i];
        const needed = item.length + (bin.cuts.length > 0 ? options.kerf : 0);

        if (bin.remainingLength >= needed) {
          const potentialRemaining = bin.remainingLength - needed;
          if (potentialRemaining < minRemaining) {
            minRemaining = potentialRemaining;
            bestBinIndex = i;
          }
        }
      }

      if (bestBinIndex !== -1) {
        const bin = openBins[bestBinIndex];
        const needed = item.length + (bin.cuts.length > 0 ? options.kerf : 0);
        bin.cuts.push({ length: item.length, description: item.description });
        bin.remainingLength -= needed;
        placed = true;
      } else {
        // 2. Open a new bin
        // Find best stock candidate
        let candidates = [];

        for (const stockItem of materialStockIndices) {
          if (currentStock[stockItem.originalIndex].quantity > 0 && stockItem.length >= item.length) {
            candidates.push(stockItem);
          }
        }

        // Sort candidates: Scrap first, then Smallest Length
        candidates.sort((a, b) => {
          if (a.isScrap !== b.isScrap) return a.isScrap ? -1 : 1;
          return a.length - b.length;
        });

        let selectedSource = null;

        if (candidates.length > 0) {
          const best = candidates[0];
          currentStock[best.originalIndex].quantity -= 1;

          selectedSource = {
            sourceId: best.id,
            totalLength: best.length,
            isScrap: best.isScrap
          };
        } else {
          // Use new standard bar
          selectedSource = {
            sourceId: 'new-standard',
            totalLength: standardLength,
            isScrap: false
          };
        }

        if (selectedSource.totalLength >= item.length) {
          openBins.push({
            sourceId: selectedSource.sourceId,
            material: material,
            totalLength: selectedSource.totalLength,
            remainingLength: selectedSource.totalLength - item.length,
            cuts: [{ length: item.length, description: item.description }],
            isScrap: selectedSource.isScrap
          });
          placed = true;
        }
      }

      if (!placed) {
        allItemsNotFit.push({
          id: item.id,
          material: material,
          length: item.length,
          quantity: 1,
          description: item.description
        });
      }
    }

    // Convert openBins to BarResult
    const weightPerMeter = materialWeights[material] || 0;

    const materialResults: BarResult[] = openBins.map((bin, idx) => {
      const isReusable = bin.remainingLength >= options.maxScrapLength;
      const trueWaste = isReusable ? 0 : bin.remainingLength;
      const trueWasteKg = trueWaste > 0 ? (trueWaste / 1000) * weightPerMeter : 0;

      return {
        id: `${material.replace(/\s+/g, '-')}-${idx}-${crypto.randomUUID()}`,
        material: bin.material,
        length: bin.totalLength,
        cuts: bin.cuts,
        waste: bin.remainingLength,
        trueWaste: trueWaste,
        trueWasteKg: Number(trueWasteKg.toFixed(3)),
        reusableScrap: isReusable ? bin.remainingLength : 0,
        isScrapUsed: bin.isScrap,
        sourceId: bin.sourceId
      };
    });

    allResults = [...allResults, ...materialResults];
  }

  // Generate Purchase List
  const purchaseMap: Record<string, Record<number, number>> = {};

  allResults.forEach(bar => {
    if (bar.sourceId === 'new-standard') {
      if (!purchaseMap[bar.material]) {
        purchaseMap[bar.material] = {};
      }
      if (!purchaseMap[bar.material][bar.length]) {
        purchaseMap[bar.material][bar.length] = 0;
      }
      purchaseMap[bar.material][bar.length]++;
    }
  });

  const purchaseList: PurchaseItem[] = [...directPurchases];
  for (const mat in purchaseMap) {
    for (const len in purchaseMap[mat]) {
      purchaseList.push({
        material: mat,
        length: Number(len),
        quantity: purchaseMap[mat][len]
      });
    }
  }

  const totalTrueWaste = allResults.reduce((acc, bar) => acc + bar.trueWaste, 0);
  const totalTrueWasteKg = Number(allResults.reduce((acc, bar) => acc + bar.trueWasteKg, 0).toFixed(3));
  const totalReusableScrap = allResults.reduce((acc, bar) => acc + bar.reusableScrap, 0);

  return {
    results: allResults,
    remainingStock: currentStock,
    itemsNotFit: allItemsNotFit,
    purchaseList,
    totalTrueWaste,
    totalTrueWasteKg,
    totalReusableScrap
  };
}
