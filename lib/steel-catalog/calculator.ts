/**
 * Steel Profile Weight Calculator
 * 
 * Calculates weight (kg/m) for cold-formed and simple profiles
 * based on cross-section geometry and steel density (7850 kg/m³).
 * 
 * Formulas source: NBR 6355, Gerdau technical catalogs
 */

import type { ProfileCategory, ProfileDimensions, CalculatedProfile } from './index';

/** Steel density constant: 7850 kg/m³ → 0.00785 kg/cm³ */
const STEEL_DENSITY_FACTOR = 0.00785; // kg per (mm² · m)

/**
 * Validates that all required dimensions for a given profile type are present.
 * Throws descriptive errors if something is missing.
 */
function validateDimensions(type: ProfileCategory, d: ProfileDimensions): void {
    const required: Record<ProfileCategory, (keyof ProfileDimensions)[]> = {
        ue: ['height', 'width', 'thickness', 'lipHeight'],
        cartola: ['height', 'width', 'thickness', 'lipHeight'],
        z: ['height', 'width', 'thickness'],
        cantoneira: ['width', 'thickness'],
        barra_chata: ['width', 'thickness'],
        barra_redonda: ['diameter'],
        chapa: ['thickness', 'width'],
        w_hp: ['height', 'width', 'thickness', 'flangeThickness'],
    };

    const missing = (required[type] || []).filter(k => d[k] == null || d[k]! <= 0);
    if (missing.length > 0) {
        throw new Error(
            `Dimensões obrigatórias faltando para perfil "${type}": ${missing.join(', ')}`
        );
    }
}

/**
 * Calculates the linear development (total unfolded centerline length in mm)
 * of the cross-section for cold-formed profiles.
 * 
 * NBR 6355 dimensions are EXTERNAL (h, b, d include thickness).
 * The centerline development subtracts thickness at each bend/corner.
 * 
 * For a U Enrijecido with N=4 bends:
 *   dev = (h - 2t) + 2×(b - t) + 2×(d - t)  (simplified: h + 2b + 2d - 6t)
 */
function getLinearDevelopment(type: ProfileCategory, d: ProfileDimensions): number {
    const t = d.thickness!;
    switch (type) {
        // U Enrijecido: 4 dobras → h - 2t + 2×(b - t) + 2×(d - t)
        case 'ue':
            return (d.height! - 2 * t) + 2 * (d.width! - t) + 2 * (d.lipHeight! - t);

        // Cartola: 4 dobras → h - 2t + 2×(b - t) + 2×(d - t)
        case 'cartola':
            return (d.height! - 2 * t) + 2 * (d.width! - t) + 2 * (d.lipHeight! - t);

        // Z: 2 dobras → h - 2t + 2×(b - t)
        case 'z':
            return (d.height! - 2 * t) + 2 * (d.width! - t);

        // Cantoneira: 1 dobra → 2×aba - t (centerline)
        case 'cantoneira':
            return 2 * d.width! - t;

        // Barra Chata: seção retangular simples
        case 'barra_chata':
            return d.width!;

        default:
            return 0;
    }
}

/**
 * Core calculator: returns kg/m for any supported profile type.
 */
export function calculateWeightKgM(
    type: ProfileCategory,
    dimensions: ProfileDimensions
): number {
    validateDimensions(type, dimensions);
    const d = dimensions;

    switch (type) {
        // Cold-formed profiles: linear development × thickness × density
        case 'ue':
        case 'cartola':
        case 'z':
        case 'cantoneira':
        case 'barra_chata': {
            const dev = getLinearDevelopment(type, d);
            return round(dev * d.thickness! * STEEL_DENSITY_FACTOR, 2);
        }

        // Barra Redonda: π/4 × Ø² × density
        // Ø(mm)² × π/4 × 7850 / 1_000_000  =  Ø² × 0.006165 kg/m
        case 'barra_redonda': {
            return round(d.diameter! * d.diameter! * 0.006165, 2);
        }

        // Chapa: treated as kg/m² for a given width
        // weight = width(m) × thickness(mm) × 7.85 kg/(m·mm)
        case 'chapa': {
            const widthM = d.width! / 1000;
            return round(widthM * d.thickness! * 7.85, 2);
        }

        // W/HP: approximation by areas (alma + 2×mesas)
        // [h × tw + 2 × bf × tf] × 0.00785
        case 'w_hp': {
            const webArea = d.height! * d.thickness!;
            const flangeArea = 2 * d.width! * d.flangeThickness!;
            return round((webArea + flangeArea) * STEEL_DENSITY_FACTOR, 2);
        }

        default:
            throw new Error(`Tipo de perfil não suportado: ${type}`);
    }
}

/**
 * Builds a full CalculatedProfile from type + dimensions.
 */
export function buildProfile(
    type: ProfileCategory,
    dimensions: ProfileDimensions
): CalculatedProfile {
    const weightKgM = calculateWeightKgM(type, dimensions);
    const name = generateName(type, dimensions);
    const formula = getFormulaDescription(type);

    return {
        name,
        category: type,
        weightKgM,
        dimensions,
        formula,
        isCustom: true,
    };
}

// ─── Helpers ───────────────────────────────────────────────

function round(value: number, decimals: number): number {
    const factor = Math.pow(10, decimals);
    return Math.round(value * factor) / factor;
}

/** Generates a canonical name like "Ue 200x75x25x3.00" */
function generateName(type: ProfileCategory, d: ProfileDimensions): string {
    const prefix: Record<ProfileCategory, string> = {
        ue: 'Ue',
        cartola: 'Cartola',
        z: 'Z',
        cantoneira: 'L',
        barra_chata: 'BC',
        barra_redonda: 'BR',
        chapa: 'CH',
        w_hp: 'W',
    };

    const p = prefix[type] || type;

    switch (type) {
        case 'ue':
        case 'cartola':
            return `${p} ${d.height}x${d.width}x${d.lipHeight}x${fmt(d.thickness!)}`;
        case 'z':
            return `${p} ${d.height}x${d.width}x${fmt(d.thickness!)}`;
        case 'cantoneira':
            return `${p} ${d.width}x${d.width}x${fmt(d.thickness!)}`;
        case 'barra_chata':
            return `${p} ${d.width}x${fmt(d.thickness!)}`;
        case 'barra_redonda':
            return `${p} Ø${d.diameter}`;
        case 'chapa':
            return `${p} e=${fmt(d.thickness!)}mm (L=${d.width}mm)`;
        case 'w_hp':
            return `${p} ${d.height}x${d.width}x${fmt(d.thickness!)}x${fmt(d.flangeThickness!)}`;
        default:
            return `${p} custom`;
    }
}

function fmt(n: number): string {
    return Number.isInteger(n) ? n.toString() : n.toFixed(2);
}

function getFormulaDescription(type: ProfileCategory): string {
    const formulas: Record<ProfileCategory, string> = {
        ue: '[h + 2b + 2d] × t × 0.00785',
        cartola: '[h + 2b + 2a] × t × 0.00785',
        z: '[h + 2b] × t × 0.00785',
        cantoneira: '[2a - t] × t × 0.00785',
        barra_chata: 'largura × esp × 0.00785',
        barra_redonda: 'Ø² × 0.006165 / 1000',
        chapa: 'largura(m) × esp(mm) × 7.85',
        w_hp: '[h×tw + 2×bf×tf] × 0.00785',
    };
    return formulas[type] || 'custom';
}
