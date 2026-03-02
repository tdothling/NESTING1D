import { optimizeCuts } from './lib/optimizer';

// =========================================================
// TEST: Cost-Benefit Check for Composition
// =========================================================
// Scenario 1: 5994mm items → should NOT compose (waste = 6mm, trivial)
// Scenario 2: 8090mm items → SHOULD compose remainders (waste = 3910mm per 2090mm item)

console.log('=== TESTE DE SENSO CRÍTICO ===\n');

// Scenario 1: Items nearly filling a standard bar (5994mm of 6000mm)
console.log('--- CENÁRIO 1: Peças de 5994mm (desperdício trivial) ---');
const result1 = optimizeCuts(
    [{ id: 'req-1', material: 'Perfil', length: 5994, quantity: 10, description: 'Coluna' }],
    [],
    { standardBarLengths: { 'Perfil': 6000 }, defaultStandardLength: 6000, kerf: 3, maxScrapLength: 1000, maxWeldsPerElement: 3 }
);

const composites1 = result1.results.filter(r => r.isComposite);
console.log(`Compostas: ${composites1.length} (deve ser 0)`);
console.log(`Barras a comprar: ${result1.purchaseList.map(p => `${p.quantity}x ${p.length}mm`).join(', ')}`);
console.log(`Resultado: ${composites1.length === 0 ? '✅ CORRETO — usou barras inteiras' : '❌ ERRO — compôs desnecessariamente'}\n`);

// Scenario 2: Items requiring splitting (8090mm = 6000 + 2090 remainder)
console.log('--- CENÁRIO 2: Peças de 8090mm (remainders aproveitáveis) ---');
const result2 = optimizeCuts(
    [{ id: 'req-2', material: 'Perfil', length: 8090, quantity: 10, description: 'Viga' }],
    [],
    { standardBarLengths: { 'Perfil': 6000 }, defaultStandardLength: 6000, kerf: 3, maxScrapLength: 1000, maxWeldsPerElement: 3 }
);

const composites2 = result2.results.filter(r => r.isComposite);
const purchaseNo = optimizeCuts(
    [{ id: 'req-2', material: 'Perfil', length: 8090, quantity: 10, description: 'Viga' }],
    [],
    { standardBarLengths: { 'Perfil': 6000 }, defaultStandardLength: 6000, kerf: 3, maxScrapLength: 1000, maxWeldsPerElement: 0 }
).purchaseList.reduce((s, p) => s + p.quantity, 0);
const purchaseYes = result2.purchaseList.reduce((s, p) => s + p.quantity, 0);

console.log(`Compostas: ${composites2.length} (deve ser > 0)`);
console.log(`Barras sem composição: ${purchaseNo}`);
console.log(`Barras com composição: ${purchaseYes}`);
console.log(`Economia: ${purchaseNo - purchaseYes} barras`);
composites2.forEach(b => console.log(`  🔥 ${b.length}mm = ${b.compositeParts?.join('mm + ')}mm`));
console.log(`Resultado: ${composites2.length > 0 ? '✅ CORRETO — compôs remainder' : '❌ ERRO — não aproveitou retalhos'}\n`);

// Scenario 3: Mixed — 5994 + 2090 together
console.log('--- CENÁRIO 3: Mix (5994mm + 8090mm) ---');
const result3 = optimizeCuts(
    [
        { id: 'req-3a', material: 'Perfil', length: 5994, quantity: 5, description: 'Coluna' },
        { id: 'req-3b', material: 'Perfil', length: 8090, quantity: 5, description: 'Viga' }
    ],
    [],
    { standardBarLengths: { 'Perfil': 6000 }, defaultStandardLength: 6000, kerf: 3, maxScrapLength: 1000, maxWeldsPerElement: 3 }
);

const composites3 = result3.results.filter(r => r.isComposite);
const bars5994 = result3.results.filter(r => !r.isComposite && r.cuts.some(c => c.length === 5994));
console.log(`Barras de 5994mm (inteiras): ${bars5994.length} (deve ser 5 — todas inteiras)`);
console.log(`Compostas (de remainder): ${composites3.length}`);
composites3.forEach(b => console.log(`  🔥 ${b.length}mm = ${b.compositeParts?.join('mm + ')}mm`));
console.log(`Resultado: ${bars5994.length === 5 && composites3.length > 0 ? '✅ CORRETO — 5994 inteiras + remainders compostos' : '⚠️ VERIFICAR resultados'}`);
