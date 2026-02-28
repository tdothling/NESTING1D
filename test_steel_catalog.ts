/**
 * Test script for the steel catalog calculator.
 * Run: npx tsx test_steel_catalog.ts
 */

import { calculateWeightKgM, buildProfile, searchWHPCatalog, W_HP_CATALOG } from './lib/steel-catalog';

let passed = 0;
let failed = 0;

function assert(label: string, actual: number, expected: number, tolerance = 0.1) {
    const ok = Math.abs(actual - expected) <= tolerance;
    if (ok) {
        console.log(`  ✅ ${label}: ${actual} kg/m (esperado ~${expected})`);
        passed++;
    } else {
        console.error(`  ❌ ${label}: ${actual} kg/m (esperado ~${expected}, diferença: ${Math.abs(actual - expected).toFixed(3)})`);
        failed++;
    }
}

console.log('\n═══ Teste: Calculadora de Perfis de Aço ═══\n');

// ── U Enrijecido ──
console.log('▸ U Enrijecido');
// Ue 200x75x25x3.00 → esperado ~5.89 kg/m (catálogo Gerdau)
assert('Ue 200x75x25x3.00',
    calculateWeightKgM('ue', { height: 200, width: 75, lipHeight: 25, thickness: 3.0 }),
    5.89, 0.15
);
// Ue 250x85x25x4.75 → esperado ~8.52 kg/m (do plano)
assert('Ue 250x85x25x4.75',
    calculateWeightKgM('ue', { height: 250, width: 85, lipHeight: 25, thickness: 4.75 }),
    8.52, 0.2
);

// ── Cantoneira ──
console.log('\n▸ Cantoneira');
// L 100x100x10 → esperado ~15.00 kg/m (Gerdau)
assert('L 100x100x10',
    calculateWeightKgM('cantoneira', { width: 100, thickness: 10 }),
    15.00, 0.2
);

// ── Barra Redonda ──
console.log('\n▸ Barra Redonda');
// BR Ø25.40 (1") → esperado ~3.98 kg/m (Gerdau)
assert('BR Ø25.40',
    calculateWeightKgM('barra_redonda', { diameter: 25.40 }),
    3.98, 0.1
);
// BR Ø12.70 (1/2") → esperado ~0.99 kg/m
assert('BR Ø12.70',
    calculateWeightKgM('barra_redonda', { diameter: 12.70 }),
    0.99, 0.1
);

// ── Barra Chata ──
console.log('\n▸ Barra Chata');
// BC 50.8x6.35 (2"x1/4") → ~2.53 kg/m
assert('BC 50.8x6.35',
    calculateWeightKgM('barra_chata', { width: 50.8, thickness: 6.35 }),
    2.53, 0.1
);

// ── Chapa ──
console.log('\n▸ Chapa');
// Chapa e=6.35mm, largura 1000mm → ~49.85 kg/m²
assert('Chapa 6.35mm x 1000mm',
    calculateWeightKgM('chapa', { thickness: 6.35, width: 1000 }),
    49.85, 0.5
);

// ── buildProfile ──
console.log('\n▸ buildProfile()');
const profile = buildProfile('ue', { height: 200, width: 75, lipHeight: 25, thickness: 3.0 });
console.log(`  Nome gerado: "${profile.name}"`);
console.log(`  Fórmula: ${profile.formula}`);
console.log(`  isCustom: ${profile.isCustom}`);

// ── W/HP Catalog ──
console.log('\n▸ Catálogo W/HP');
console.log(`  Total de perfis: ${W_HP_CATALOG.length}`);
const results = searchWHPCatalog('W 310');
console.log(`  Busca "W 310": ${results.length} resultados`);
results.forEach(r => console.log(`    ${r.name} → ${r.weightKgM} kg/m`));

// ── Summary ──
console.log(`\n═══ Resultado: ${passed} passou, ${failed} falhou ═══\n`);
process.exit(failed > 0 ? 1 : 0);
