import { optimizeCuts } from './lib/optimizer';

// =========================================================
// TEST: Composite Bar Composition (Welding Scraps)
// =========================================================
// Scenario: User needs 10 bars of 8090mm. Standard bar = 6000mm.
// Each 8090mm = 1 full bar (6000mm) + remainder (2090mm).
// Remainders go to bin-packing: 2 × 2090 = 4180 from a 6000mm bar → 1817mm scrap.
// WITHOUT composition: 1817mm goes to stock unused.
// WITH composition: 1817mm + 273mm (from another scrap) = 2090mm → fewer new bars needed.

const requests = [
    { id: 'req-1', material: 'Perfil U 100x50', length: 8090, quantity: 10, description: 'Viga Principal' }
];

console.log('=== TESTE DE COMPOSIÇÃO COM SOLDAS ===\n');

// Test WITHOUT composition (maxWeldsPerElement = 0)
const resultNoComposite = optimizeCuts(requests, [], {
    standardBarLengths: { 'Perfil U 100x50': 6000 },
    defaultStandardLength: 6000,
    kerf: 3,
    maxScrapLength: 1000,
    maxWeldsPerElement: 0
});

console.log('--- SEM COMPOSIÇÃO (maxWeldsPerElement=0) ---');
console.log(`Total de barras: ${resultNoComposite.results.length}`);
console.log(`Retalho aproveitável: ${resultNoComposite.totalReusableScrap}mm`);
console.log(`Sucata real: ${resultNoComposite.totalTrueWaste}mm`);
console.log(`Barras a comprar: ${resultNoComposite.purchaseList.map(p => `${p.quantity}x ${p.material} ${p.length}mm`).join(', ')}`);

const scrapBarsNo = resultNoComposite.results.filter(r => r.reusableScrap > 0);
console.log(`Barras com retalho: ${scrapBarsNo.length}`);
scrapBarsNo.forEach(b => {
    console.log(`  - ${b.length}mm: cortes [${b.cuts.map(c => c.length).join(', ')}] → sobra ${b.reusableScrap}mm`);
});

console.log('\n--- COM COMPOSIÇÃO (maxWeldsPerElement=3) ---');

// Test WITH composition
const resultComposite = optimizeCuts(requests, [], {
    standardBarLengths: { 'Perfil U 100x50': 6000 },
    defaultStandardLength: 6000,
    kerf: 3,
    maxScrapLength: 1000,
    maxWeldsPerElement: 3
});

console.log(`Total de barras: ${resultComposite.results.length}`);
console.log(`Retalho aproveitável: ${resultComposite.totalReusableScrap}mm`);
console.log(`Sucata real: ${resultComposite.totalTrueWaste}mm`);
console.log(`Barras a comprar: ${resultComposite.purchaseList.map(p => `${p.quantity}x ${p.material} ${p.length}mm`).join(', ')}`);

const compositeBars = resultComposite.results.filter(r => r.isComposite);
console.log(`Barras compostas (soldadas): ${compositeBars.length}`);
compositeBars.forEach(b => {
    console.log(`  - ${b.length}mm SOLDADA: partes [${b.compositeParts?.join(' + ')}mm]`);
});

const scrapBars = resultComposite.results.filter(r => r.reusableScrap > 0);
console.log(`Barras com retalho restante: ${scrapBars.length}`);
scrapBars.forEach(b => {
    console.log(`  - ${b.length}mm: cortes [${b.cuts.map(c => c.length).join(', ')}] → sobra ${b.reusableScrap}mm`);
});

// Summary comparison
console.log('\n=== COMPARAÇÃO ===');
const purchaseNo = resultNoComposite.purchaseList.reduce((sum, p) => sum + p.quantity, 0);
const purchaseYes = resultComposite.purchaseList.reduce((sum, p) => sum + p.quantity, 0);
console.log(`Barras a comprar SEM composição: ${purchaseNo}`);
console.log(`Barras a comprar COM composição: ${purchaseYes}`);
console.log(`Economia: ${purchaseNo - purchaseYes} barras`);
console.log(`Retalho para estoque SEM: ${resultNoComposite.totalReusableScrap}mm`);
console.log(`Retalho para estoque COM: ${resultComposite.totalReusableScrap}mm`);
