import { CutRequest, StockItem, BarResult, Cut, PurchaseItem } from './types';

interface OptimizerOptions {
  standardBarLengths: Record<string, number>; // material -> length
  defaultStandardLength: number;
  kerf: number; // blade thickness, e.g., 3mm
  maxScrapLength: number; // lengths below this are true waste, lengths above or equal return to stock
  maxWeldsPerElement?: number; // max welds per composite element (default: 3, meaning up to 4 pieces)
}

export function optimizeCuts(
  requests: CutRequest[],
  stock: StockItem[],
  options: OptimizerOptions = { standardBarLengths: {}, defaultStandardLength: 6000, kerf: 0, maxScrapLength: 1000, maxWeldsPerElement: 3 }
): { results: BarResult[]; remainingStock: StockItem[]; itemsNotFit: CutRequest[]; purchaseList: PurchaseItem[]; totalTrueWaste: number; totalTrueWasteKg: number; totalReusableScrap: number } {

  const maxWeldsPerElement = options.maxWeldsPerElement ?? 3;

  // Group requests by material
  const requestsByMaterial: Record<string, CutRequest[]> = {};
  const materialWeights: Record<string, number> = {};
  const directPurchases: PurchaseItem[] = [];
  const materialProfileIds: Record<string, string | undefined> = {};

  requests.forEach(req => {
    // Check if item skips optimization (e.g., Plates)
    if (req.skipOptimization) {
      // For chapas: enrich material name with dimensions (largura × comprimento)
      let materialName = req.material;
      const dims = req.profileDimensions;
      if (dims && req.profileType === 'chapa') {
        const w = dims.width || 0;
        const t = dims.thickness || 0;
        // height (comprimento) now comes from req.length, not dimensions
        if (w > 0 && req.length > 0 && t > 0) {
          materialName = `Chapa e=${t.toFixed(2)}mm`;
        } else if (t > 0) {
          materialName = `Chapa e=${t.toFixed(2)}mm`;
        }
      }
      directPurchases.push({
        material: materialName,
        length: req.length,
        quantity: req.quantity,
        width: dims?.width,
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
    if (req.profileId) {
      materialProfileIds[mat] = req.profileId;
    }
  });

  let allResults: BarResult[] = [];
  let allItemsNotFit: CutRequest[] = [];
  let currentStock = stock.map(s => ({ ...s })); // Deep copy

  // Track how many NEW standard bars we need per material (for purchase list)
  const newBarsPurchased: Record<string, number> = {};

  // Process each material separately
  for (const material of Object.keys(requestsByMaterial)) {
    const materialRequests = requestsByMaterial[material];
    const standardLength = options.standardBarLengths[material] || options.defaultStandardLength;

    // Filter stock for this material
    const materialStockIndices = currentStock
      .map((s, index) => ({ ...s, originalIndex: index }))
      .filter(s => s.material.trim().toLowerCase() === material.toLowerCase());

    // Helper: consume one bar from stock or request a new one
    const consumeBar = (minLength: number): { sourceId: string; totalLength: number; isScrap: boolean } => {
      // Find best stock candidate
      let candidates = materialStockIndices.filter(
        s => currentStock[s.originalIndex].quantity > 0 && s.length >= minLength
      );

      // Sort: Scrap first, then Smallest Length (prefer fitting tightly)
      candidates.sort((a, b) => {
        if (a.isScrap !== b.isScrap) return a.isScrap ? -1 : 1;
        return a.length - b.length;
      });

      if (candidates.length > 0) {
        const best = candidates[0];
        currentStock[best.originalIndex].quantity -= 1;
        return { sourceId: best.id, totalLength: best.length, isScrap: best.isScrap };
      }

      // No stock available → new standard bar
      newBarsPurchased[material] = (newBarsPurchased[material] || 0) + 1;
      return { sourceId: 'new-standard', totalLength: standardLength, isScrap: false };
    };

    // Expand requests into individual items AND handle splitting logic
    let itemsToCut: { id: string; length: number; description?: string }[] = [];

    materialRequests.forEach((req) => {
      for (let i = 0; i < req.quantity; i++) {
        // Check if item needs splitting (longer than standard bar)
        if (req.length > standardLength) {
          const fullBarsNeeded = Math.floor(req.length / standardLength);
          const remainder = req.length % standardLength;

          // Each full split piece consumes a real bar (from stock or purchase)
          for (let b = 0; b < fullBarsNeeded; b++) {
            const source = consumeBar(standardLength);

            allResults.push({
              id: `${material.replace(/\s+/g, '-')}-split-full-${crypto.randomUUID()}`,
              material: material,
              profileId: materialProfileIds[material],
              weightKgM: materialWeights[material],
              length: source.totalLength,
              cuts: [{ length: standardLength, description: `${req.description || 'Peça Longa'} (Parte ${b + 1})` }],
              waste: source.totalLength - standardLength,
              trueWaste: source.totalLength - standardLength < options.maxScrapLength ? source.totalLength - standardLength : 0,
              trueWasteKg: 0,
              reusableScrap: source.totalLength - standardLength >= options.maxScrapLength ? source.totalLength - standardLength : 0,
              isScrapUsed: source.isScrap,
              sourceId: source.sourceId
            });
          }

          // Add remainder to items to be cut, if significant
          if (remainder > 0) {
            itemsToCut.push({
              id: `${req.id}-remainder-${i}`,
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
      profileId?: string;
      weightKgM?: number;
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
        const kerf = bin.cuts.length > 0 ? options.kerf : 0;
        const neededStrict = item.length + kerf;

        // Tolerância de encaixe perfeito: 
        // Se o que sobra na barra for exatamente o tamanho da peça (ex: 4000 corte, sobra 2000. Peça é 2000), 
        // a gente deixa encaixar ignorando o disco de corte (considera que a barra real na fábrica sempre vem com margem).
        const canFit = bin.remainingLength >= neededStrict || (bin.remainingLength >= item.length && bin.remainingLength < neededStrict);

        if (canFit) {
          // Calculate potential remaining. If it was a forced perfect fit, remaining becomes 0.
          const actualNeeded = bin.remainingLength >= neededStrict ? neededStrict : bin.remainingLength;
          const potentialRemaining = bin.remainingLength - actualNeeded;

          if (potentialRemaining < minRemaining) {
            minRemaining = potentialRemaining;
            bestBinIndex = i;
          }
        }
      }

      if (bestBinIndex !== -1) {
        const bin = openBins[bestBinIndex];
        const kerf = bin.cuts.length > 0 ? options.kerf : 0;
        const neededStrict = item.length + kerf;
        const actualNeeded = bin.remainingLength >= neededStrict ? neededStrict : bin.remainingLength;

        bin.cuts.push({ length: item.length, description: item.description });
        bin.remainingLength -= actualNeeded;
        placed = true;
      } else {
        // 2. Open a new bin using the consumeBar helper
        const source = consumeBar(item.length);

        if (source.totalLength >= item.length) {
          openBins.push({
            sourceId: source.sourceId,
            material: material,
            profileId: materialProfileIds[material],
            weightKgM: materialWeights[material],
            totalLength: source.totalLength,
            remainingLength: source.totalLength - item.length,
            cuts: [{ length: item.length, description: item.description }],
            isScrap: source.isScrap
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

    // =====================================================
    // PHASE 2: Composite Bar Composition (Welding Scraps)
    // =====================================================
    // After bin-packing, take reusable scraps from bins and combine them
    // via welding to form items, freeing the bin those items were in.
    //
    // Strategy:
    // 1. Collect all bins with reusable scrap (remainingLength >= maxScrapLength)
    // 2. For new-standard bins, try to extract items and compose them from scraps
    // 3. When a bin loses all its items, it is freed (no bar purchase needed)
    // 4. Iterate until no more compositions can be made

    if (maxWeldsPerElement > 0) {
      const maxPieces = maxWeldsPerElement + 1;

      interface ScrapSource {
        binIndex: number;
        length: number;
      }

      const getAvailableScraps = (): ScrapSource[] => {
        const scraps: ScrapSource[] = [];
        for (let i = 0; i < openBins.length; i++) {
          if (openBins[i].remainingLength >= options.maxScrapLength) {
            scraps.push({ binIndex: i, length: openBins[i].remainingLength });
          }
        }
        scraps.sort((a, b) => b.length - a.length);
        return scraps;
      };

      const findScrapCombination = (
        targetLength: number,
        availableScraps: ScrapSource[],
        excludeBinIndices: Set<number>
      ): { usedScraps: ScrapSource[]; parts: number[] } | null => {
        const filtered = availableScraps.filter(s => !excludeBinIndices.has(s.binIndex));
        if (filtered.length < 2) return null;

        // Try 2 scraps (1 weld)
        for (let i = 0; i < filtered.length; i++) {
          for (let j = i + 1; j < filtered.length; j++) {
            const total = filtered[i].length + filtered[j].length;
            const needed = targetLength + options.kerf; // 1 weld joint
            if (total >= needed) {
              const part1 = filtered[i].length;
              const part2 = targetLength - part1;
              if (part2 > 0 && (part2 + options.kerf) <= filtered[j].length) {
                return { usedScraps: [filtered[i], filtered[j]], parts: [part1, part2] };
              }
            }
          }
        }

        // Try 3 scraps (2 welds)
        if (maxPieces >= 3) {
          for (let i = 0; i < filtered.length; i++) {
            for (let j = i + 1; j < filtered.length; j++) {
              for (let k = j + 1; k < filtered.length; k++) {
                const total = filtered[i].length + filtered[j].length + filtered[k].length;
                const needed = targetLength + options.kerf * 2;
                if (total >= needed) {
                  const p1 = filtered[i].length;
                  const p2 = filtered[j].length;
                  const p3 = targetLength - p1 - p2;
                  if (p3 > 0 && (p3 + options.kerf) <= filtered[k].length) {
                    return { usedScraps: [filtered[i], filtered[j], filtered[k]], parts: [p1, p2, p3] };
                  }
                }
              }
            }
          }
        }

        // Try 4 scraps (3 welds)
        if (maxPieces >= 4) {
          for (let i = 0; i < filtered.length; i++) {
            for (let j = i + 1; j < filtered.length; j++) {
              for (let k = j + 1; k < filtered.length; k++) {
                for (let l = k + 1; l < filtered.length; l++) {
                  const total = filtered[i].length + filtered[j].length + filtered[k].length + filtered[l].length;
                  const needed = targetLength + options.kerf * 3;
                  if (total >= needed) {
                    const p1 = filtered[i].length;
                    const p2 = filtered[j].length;
                    const p3 = filtered[k].length;
                    const p4 = targetLength - p1 - p2 - p3;
                    if (p4 > 0 && (p4 + options.kerf) <= filtered[l].length) {
                      return { usedScraps: [filtered[i], filtered[j], filtered[k], filtered[l]], parts: [p1, p2, p3, p4] };
                    }
                  }
                }
              }
            }
          }
        }

        return null;
      };

      // Iteratively extract items from bins and compose them from scraps
      let changed = true;
      while (changed) {
        changed = false;
        const availableScraps = getAvailableScraps();
        if (availableScraps.length < 2) break;

        // Sort candidate bins: fewest cuts first (so we can fully free bins faster)
        const candidateEntries = openBins
          .map((bin, idx) => ({ bin, idx }))
          .filter(({ bin }) => bin.sourceId === 'new-standard')
          .sort((a, b) => a.bin.cuts.length - b.bin.cuts.length);

        for (const { bin, idx: binIdx } of candidateEntries) {
          for (let cutIdx = 0; cutIdx < bin.cuts.length; cutIdx++) {
            const cut = bin.cuts[cutIdx];
            const targetLength = cut.length;

            // COST-BENEFIT CHECK: Don't compose if buying a full bar for this item
            // would waste less than maxScrapLength. It's cheaper to buy the bar than
            // to weld multiple scraps together.
            // Example: 5994mm item in a 6000mm bar wastes only 6mm → just buy the bar.
            // Example: 2090mm item in a 6000mm bar wastes 3910mm → composing makes sense.
            const wasteIfNewBar = standardLength - targetLength;
            if (wasteIfNewBar < options.maxScrapLength) continue;

            const excludeBins = new Set([binIdx]);

            const combo = findScrapCombination(targetLength, availableScraps, excludeBins);
            if (combo) {
              // Consume scraps from source bins
              for (let s = 0; s < combo.usedScraps.length; s++) {
                const scrap = combo.usedScraps[s];
                const partLen = combo.parts[s];
                const kerfCharge = s > 0 ? options.kerf : 0;
                openBins[scrap.binIndex].remainingLength -= (partLen + kerfCharge);
              }

              // Create composite bar result
              const compositeCuts: Cut[] = combo.parts.map((partLen, pIdx) => ({
                length: partLen,
                description: `${cut.description || 'Peça'} (Solda ${pIdx + 1}/${combo.parts.length})`,
                isWeld: true
              }));

              allResults.push({
                id: `${material.replace(/\s+/g, '-')}-composite-${crypto.randomUUID()}`,
                material: material,
                profileId: materialProfileIds[material],
                weightKgM: materialWeights[material],
                length: targetLength,
                cuts: compositeCuts,
                waste: 0,
                trueWaste: 0,
                trueWasteKg: 0,
                reusableScrap: 0,
                isScrapUsed: true,
                sourceId: 'composite',
                isComposite: true,
                compositeParts: combo.parts
              });

              // Remove the cut from the source bin
              bin.cuts.splice(cutIdx, 1);
              // Give back the space (the cut's length + kerf if there's still cuts after it)
              bin.remainingLength += targetLength + (bin.cuts.length > 0 ? options.kerf : 0);

              // If bin has no more cuts, fully free it
              if (bin.cuts.length === 0) {
                openBins.splice(binIdx, 1);
              }

              changed = true;
              break;
            }
          }
          if (changed) break;
        }
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
        profileId: bin.profileId,
        weightKgM: bin.weightKgM,
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

  // Generate Purchase List from tracked new bar purchases
  // We group by material + standardLength (the bar you actually buy)
  const purchaseList: PurchaseItem[] = [...directPurchases];

  // Count only bars that are still in allResults with sourceId 'new-standard'
  // (composite bars freed some of them, so we recount)
  const purchaseMap: Record<string, number> = {};
  for (const bar of allResults) {
    if (bar.sourceId === 'new-standard') {
      const standardLength = options.standardBarLengths[bar.material] || options.defaultStandardLength;
      const key = `${bar.material}|${standardLength}`;
      purchaseMap[key] = (purchaseMap[key] || 0) + 1;
    }
  }

  for (const key of Object.keys(purchaseMap)) {
    const [mat, len] = key.split('|');
    purchaseList.push({
      material: mat,
      length: Number(len),
      quantity: purchaseMap[key]
    });
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

