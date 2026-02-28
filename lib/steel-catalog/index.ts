/**
 * Steel Catalog — Types & Barrel Export
 * 
 * Approach:
 * - Cold-formed profiles (Ue, Cartola, Z, etc.) → calculated from dimensions
 * - W/HP hot-rolled profiles → static catalog (Gerdau/NBR 15980)
 */

// ─── Types ─────────────────────────────────────────────────

export type ProfileCategory =
    | 'ue'            // U enrijecido (formado a frio)
    | 'u_simples'     // U simples (formado a frio, sem enrijecedor)
    | 'cartola'       // Perfil cartola (formado a frio)
    | 'z'             // Perfil Z (formado a frio)
    | 'cantoneira'    // Cantoneira abas iguais
    | 'barra_chata'   // Barra chata
    | 'barra_redonda' // Barra redonda
    | 'chapa'         // Chapa de aço
    | 'w_hp';         // Perfil laminado W ou HP

export interface ProfileDimensions {
    height?: number;          // Altura da alma (mm)
    width?: number;           // Largura da mesa/aba (mm)
    thickness?: number;       // Espessura da chapa/parede (mm)
    lipHeight?: number;       // Altura do enrijecedor (mm) — Ue, Cartola
    flangeThickness?: number; // Espessura da mesa (mm) — W/HP
    diameter?: number;        // Diâmetro (mm) — Barra redonda
}

export interface SteelProfile {
    name: string;
    category: ProfileCategory;
    weightKgM: number;
    dimensions: ProfileDimensions;
    standardLengthMm?: number;
    standard?: string;
    isCustom?: boolean;
    formula?: string;
}

export type CalculatedProfile = SteelProfile & {
    isCustom: true;
    formula: string;
};

/** Human-readable labels for UI */
export const PROFILE_LABELS: Record<ProfileCategory, string> = {
    ue: 'U Enrijecido',
    u_simples: 'U Simples',
    cartola: 'Perfil Cartola',
    z: 'Perfil Z',
    cantoneira: 'Cantoneira Abas Iguais',
    barra_chata: 'Barra Chata',
    barra_redonda: 'Barra Redonda',
    chapa: 'Chapa de Aço',
    w_hp: 'Perfil W / HP',
};

/** Which dimension fields are required per category */
export const REQUIRED_DIMENSIONS: Record<ProfileCategory, (keyof ProfileDimensions)[]> = {
    ue: ['height', 'width', 'thickness', 'lipHeight'],
    u_simples: ['height', 'width', 'thickness'],
    cartola: ['height', 'width', 'thickness', 'lipHeight'],
    z: ['height', 'width', 'thickness'],
    cantoneira: ['width', 'thickness'],
    barra_chata: ['width', 'thickness'],
    barra_redonda: ['diameter'],
    chapa: ['thickness', 'width'],
    w_hp: ['height', 'width', 'thickness', 'flangeThickness'],
};

/** Human-readable labels for dimension fields (for UI forms) */
export const DIMENSION_LABELS: Record<keyof ProfileDimensions, string> = {
    height: 'Altura da alma (mm)',
    width: 'Largura da mesa/aba (mm)',
    thickness: 'Espessura (mm)',
    lipHeight: 'Altura do enrijecedor (mm)',
    flangeThickness: 'Espessura da mesa (mm)',
    diameter: 'Diâmetro (mm)',
};

/** Default standard bar lengths per category */
export const DEFAULT_STANDARD_LENGTHS: Record<ProfileCategory, number> = {
    ue: 6000,
    u_simples: 6000,
    cartola: 6000,
    z: 6000,
    cantoneira: 6000,
    barra_chata: 6000,
    barra_redonda: 6000,
    chapa: 6000,
    w_hp: 12000,
};

// ─── Re-exports ────────────────────────────────────────────

export { calculateWeightKgM, buildProfile } from './calculator';
export { W_HP_CATALOG, searchWHPCatalog, findWHPProfile } from './w-hp-catalog';
