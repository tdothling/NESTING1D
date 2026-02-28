/**
 * Test script for the steel catalog calculator.
 * Run: npx tsx test_steel_catalog.ts
 */

import { calculateWeightKgM, buildProfile } from './lib/steel-catalog';

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

// ── U Enrijecido (centerline formula) ──
console.log('▸ U Enrijecido');
assert('Ue 200x75x25x3.00',
    calculateWeightKgM('ue', { height: 200, width: 75, lipHeight: 25, thickness: 3.0 }),
    9.0, 0.2
);
assert('Ue 250x85x25x4.75',
    calculateWeightKgM('ue', { height: 250, width: 85, lipHeight: 25, thickness: 4.75 }),
    16.46, 0.3
);

// ── U Simples (centerline formula) ──
console.log('\n▸ U Simples');
assert('U 200x75x3.00',
    calculateWeightKgM('u_simples', { height: 200, width: 75, thickness: 3.0 }),
    7.96, 0.2
);

// ── Cantoneira ──
console.log('\n▸ Cantoneira');
assert('L 100x100x10',
    calculateWeightKgM('cantoneira', { width: 100, thickness: 10 }),
    15.00, 0.2
);

// ── Barra Redonda ──
console.log('\n▸ Barra Redonda');
assert('BR Ø25.40',
    calculateWeightKgM('barra_redonda', { diameter: 25.40 }),
    3.98, 0.1
);
assert('BR Ø12.70',
    calculateWeightKgM('barra_redonda', { diameter: 12.70 }),
    0.99, 0.1
);

// ── Barra Chata ──
console.log('\n▸ Barra Chata');
assert('BC 50.8x6.35',
    calculateWeightKgM('barra_chata', { width: 50.8, thickness: 6.35 }),
    2.53, 0.1
);

// ── Chapa ──
console.log('\n▸ Chapa');
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

// ── Summary ──
console.log(`\n═══ Resultado: ${passed} passou, ${failed} falhou ═══\n`);
process.exit(failed > 0 ? 1 : 0);

