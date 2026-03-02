import { updateStockFromOptimization, getStock } from './lib/store';
import { supabase } from './lib/supabase';

async function testFull() {
    const result = {
        bars: [
            {
                id: "Steel-0-121c...202",
                material: "Steel",
                length: 6000,
                cuts: [{ length: 2000 }],
                waste: 4000,
                trueWaste: 0,
                trueWasteKg: 0,
                reusableScrap: 4000,
                isScrapUsed: false,
                sourceId: "new-standard"
            }
        ],
        totalWaste: 4000,
        totalTrueWaste: 0,
        totalTrueWasteKg: 0,
        totalReusableScrap: 4000,
        totalStockUsed: 1,
        itemsNotFit: [],
        purchaseList: []
    };

    const projectId = "test-project-123";

    console.log('Running updateStockFromOptimization...');
    try {
        await updateStockFromOptimization(result as any, projectId);
        console.log('Finished updateStockFromOptimization.');
    } catch (e) {
        console.error(e);
    }

    const stock = await getStock();
    const inserted = stock.filter(s => s.originProjectId === projectId);
    console.log('Stock inserted for project:', inserted);

    // Cleanup
    await supabase.from('stock').delete().eq('origin_project_id', projectId);
}

testFull();
