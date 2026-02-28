/**
 * Static catalog for W and HP hot-rolled profiles.
 * Source: Gerdau / NBR 15980 / ASTM A6
 * 
 * These profiles have complex geometries where a simple formula
 * approximation can deviate from the real weight, so we use
 * the manufacturer's tabulated values.
 */

import type { SteelProfile } from './index';

export const W_HP_CATALOG: SteelProfile[] = [
    // ── W 150 ──
    { name: 'W 150x13.0', category: 'w_hp', weightKgM: 13.0, dimensions: { height: 148, width: 100, thickness: 4.3, flangeThickness: 4.9 }, standardLengthMm: 12000, standard: 'NBR 15980' },
    { name: 'W 150x18.0', category: 'w_hp', weightKgM: 18.0, dimensions: { height: 153, width: 102, thickness: 5.8, flangeThickness: 7.1 }, standardLengthMm: 12000, standard: 'NBR 15980' },
    { name: 'W 150x22.5', category: 'w_hp', weightKgM: 22.5, dimensions: { height: 152, width: 152, thickness: 5.8, flangeThickness: 6.6 }, standardLengthMm: 12000, standard: 'NBR 15980' },
    { name: 'W 150x24.0', category: 'w_hp', weightKgM: 24.0, dimensions: { height: 160, width: 102, thickness: 6.6, flangeThickness: 10.3 }, standardLengthMm: 12000, standard: 'NBR 15980' },
    { name: 'W 150x29.8', category: 'w_hp', weightKgM: 29.8, dimensions: { height: 157, width: 153, thickness: 6.6, flangeThickness: 9.3 }, standardLengthMm: 12000, standard: 'NBR 15980' },
    { name: 'W 150x37.1', category: 'w_hp', weightKgM: 37.1, dimensions: { height: 162, width: 154, thickness: 8.1, flangeThickness: 11.6 }, standardLengthMm: 12000, standard: 'NBR 15980' },

    // ── W 200 ──
    { name: 'W 200x15.0', category: 'w_hp', weightKgM: 15.0, dimensions: { height: 200, width: 100, thickness: 4.3, flangeThickness: 5.2 }, standardLengthMm: 12000, standard: 'NBR 15980' },
    { name: 'W 200x19.3', category: 'w_hp', weightKgM: 19.3, dimensions: { height: 203, width: 102, thickness: 5.8, flangeThickness: 6.5 }, standardLengthMm: 12000, standard: 'NBR 15980' },
    { name: 'W 200x22.5', category: 'w_hp', weightKgM: 22.5, dimensions: { height: 206, width: 102, thickness: 6.2, flangeThickness: 8.0 }, standardLengthMm: 12000, standard: 'NBR 15980' },
    { name: 'W 200x26.6', category: 'w_hp', weightKgM: 26.6, dimensions: { height: 207, width: 133, thickness: 5.8, flangeThickness: 8.4 }, standardLengthMm: 12000, standard: 'NBR 15980' },
    { name: 'W 200x35.9', category: 'w_hp', weightKgM: 35.9, dimensions: { height: 201, width: 165, thickness: 6.2, flangeThickness: 10.2 }, standardLengthMm: 12000, standard: 'NBR 15980' },
    { name: 'W 200x46.1', category: 'w_hp', weightKgM: 46.1, dimensions: { height: 203, width: 203, thickness: 7.2, flangeThickness: 11.0 }, standardLengthMm: 12000, standard: 'NBR 15980' },
    { name: 'W 200x59.0', category: 'w_hp', weightKgM: 59.0, dimensions: { height: 210, width: 205, thickness: 9.1, flangeThickness: 14.2 }, standardLengthMm: 12000, standard: 'NBR 15980' },
    { name: 'W 200x71.0', category: 'w_hp', weightKgM: 71.0, dimensions: { height: 216, width: 206, thickness: 10.2, flangeThickness: 17.4 }, standardLengthMm: 12000, standard: 'NBR 15980' },

    // ── W 250 ──
    { name: 'W 250x17.9', category: 'w_hp', weightKgM: 17.9, dimensions: { height: 251, width: 101, thickness: 4.8, flangeThickness: 5.3 }, standardLengthMm: 12000, standard: 'NBR 15980' },
    { name: 'W 250x22.3', category: 'w_hp', weightKgM: 22.3, dimensions: { height: 254, width: 102, thickness: 5.8, flangeThickness: 6.9 }, standardLengthMm: 12000, standard: 'NBR 15980' },
    { name: 'W 250x25.3', category: 'w_hp', weightKgM: 25.3, dimensions: { height: 257, width: 102, thickness: 6.1, flangeThickness: 8.4 }, standardLengthMm: 12000, standard: 'NBR 15980' },
    { name: 'W 250x28.4', category: 'w_hp', weightKgM: 28.4, dimensions: { height: 260, width: 102, thickness: 6.4, flangeThickness: 10.0 }, standardLengthMm: 12000, standard: 'NBR 15980' },
    { name: 'W 250x32.7', category: 'w_hp', weightKgM: 32.7, dimensions: { height: 258, width: 146, thickness: 6.1, flangeThickness: 9.1 }, standardLengthMm: 12000, standard: 'NBR 15980' },
    { name: 'W 250x38.5', category: 'w_hp', weightKgM: 38.5, dimensions: { height: 262, width: 147, thickness: 6.6, flangeThickness: 11.2 }, standardLengthMm: 12000, standard: 'NBR 15980' },
    { name: 'W 250x44.8', category: 'w_hp', weightKgM: 44.8, dimensions: { height: 266, width: 148, thickness: 7.6, flangeThickness: 13.0 }, standardLengthMm: 12000, standard: 'NBR 15980' },

    // ── W 310 ──
    { name: 'W 310x21.0', category: 'w_hp', weightKgM: 21.0, dimensions: { height: 303, width: 101, thickness: 5.1, flangeThickness: 5.7 }, standardLengthMm: 12000, standard: 'NBR 15980' },
    { name: 'W 310x23.8', category: 'w_hp', weightKgM: 23.8, dimensions: { height: 305, width: 101, thickness: 5.6, flangeThickness: 6.7 }, standardLengthMm: 12000, standard: 'NBR 15980' },
    { name: 'W 310x28.3', category: 'w_hp', weightKgM: 28.3, dimensions: { height: 309, width: 102, thickness: 6.0, flangeThickness: 8.9 }, standardLengthMm: 12000, standard: 'NBR 15980' },
    { name: 'W 310x32.7', category: 'w_hp', weightKgM: 32.7, dimensions: { height: 313, width: 102, thickness: 6.6, flangeThickness: 10.8 }, standardLengthMm: 12000, standard: 'NBR 15980' },
    { name: 'W 310x38.7', category: 'w_hp', weightKgM: 38.7, dimensions: { height: 310, width: 165, thickness: 5.8, flangeThickness: 9.7 }, standardLengthMm: 12000, standard: 'NBR 15980' },
    { name: 'W 310x44.5', category: 'w_hp', weightKgM: 44.5, dimensions: { height: 313, width: 166, thickness: 6.6, flangeThickness: 11.2 }, standardLengthMm: 12000, standard: 'NBR 15980' },

    // ── W 360 ──
    { name: 'W 360x32.9', category: 'w_hp', weightKgM: 32.9, dimensions: { height: 349, width: 127, thickness: 5.8, flangeThickness: 8.5 }, standardLengthMm: 12000, standard: 'NBR 15980' },
    { name: 'W 360x39.0', category: 'w_hp', weightKgM: 39.0, dimensions: { height: 353, width: 128, thickness: 6.5, flangeThickness: 10.7 }, standardLengthMm: 12000, standard: 'NBR 15980' },
    { name: 'W 360x44.0', category: 'w_hp', weightKgM: 44.0, dimensions: { height: 352, width: 171, thickness: 6.9, flangeThickness: 9.8 }, standardLengthMm: 12000, standard: 'NBR 15980' },
    { name: 'W 360x51.0', category: 'w_hp', weightKgM: 51.0, dimensions: { height: 355, width: 171, thickness: 7.2, flangeThickness: 11.6 }, standardLengthMm: 12000, standard: 'NBR 15980' },

    // ── W 410 ──
    { name: 'W 410x38.8', category: 'w_hp', weightKgM: 38.8, dimensions: { height: 399, width: 140, thickness: 6.4, flangeThickness: 8.8 }, standardLengthMm: 12000, standard: 'NBR 15980' },
    { name: 'W 410x46.1', category: 'w_hp', weightKgM: 46.1, dimensions: { height: 403, width: 140, thickness: 7.0, flangeThickness: 11.2 }, standardLengthMm: 12000, standard: 'NBR 15980' },
    { name: 'W 410x53.0', category: 'w_hp', weightKgM: 53.0, dimensions: { height: 403, width: 177, thickness: 7.5, flangeThickness: 10.9 }, standardLengthMm: 12000, standard: 'NBR 15980' },
    { name: 'W 410x60.0', category: 'w_hp', weightKgM: 60.0, dimensions: { height: 407, width: 178, thickness: 7.7, flangeThickness: 12.8 }, standardLengthMm: 12000, standard: 'NBR 15980' },

    // ── W 460 ──
    { name: 'W 460x52.0', category: 'w_hp', weightKgM: 52.0, dimensions: { height: 450, width: 152, thickness: 7.6, flangeThickness: 10.8 }, standardLengthMm: 12000, standard: 'NBR 15980' },
    { name: 'W 460x60.0', category: 'w_hp', weightKgM: 60.0, dimensions: { height: 455, width: 153, thickness: 8.0, flangeThickness: 13.3 }, standardLengthMm: 12000, standard: 'NBR 15980' },
    { name: 'W 460x68.0', category: 'w_hp', weightKgM: 68.0, dimensions: { height: 459, width: 154, thickness: 9.1, flangeThickness: 15.4 }, standardLengthMm: 12000, standard: 'NBR 15980' },

    // ── W 530 ──
    { name: 'W 530x66.0', category: 'w_hp', weightKgM: 66.0, dimensions: { height: 525, width: 165, thickness: 8.9, flangeThickness: 11.4 }, standardLengthMm: 12000, standard: 'NBR 15980' },
    { name: 'W 530x74.0', category: 'w_hp', weightKgM: 74.0, dimensions: { height: 529, width: 166, thickness: 9.7, flangeThickness: 13.6 }, standardLengthMm: 12000, standard: 'NBR 15980' },
    { name: 'W 530x82.0', category: 'w_hp', weightKgM: 82.0, dimensions: { height: 528, width: 209, thickness: 9.5, flangeThickness: 13.3 }, standardLengthMm: 12000, standard: 'NBR 15980' },

    // ── W 610 ──
    { name: 'W 610x101.0', category: 'w_hp', weightKgM: 101.0, dimensions: { height: 603, width: 228, thickness: 10.5, flangeThickness: 14.9 }, standardLengthMm: 12000, standard: 'NBR 15980' },
    { name: 'W 610x113.0', category: 'w_hp', weightKgM: 113.0, dimensions: { height: 608, width: 228, thickness: 11.2, flangeThickness: 17.3 }, standardLengthMm: 12000, standard: 'NBR 15980' },

    // ══════════════════════════════════════
    // HP Profiles
    // ══════════════════════════════════════
    { name: 'HP 200x53.0', category: 'w_hp', weightKgM: 53.0, dimensions: { height: 204, width: 207, thickness: 11.3, flangeThickness: 11.3 }, standardLengthMm: 12000, standard: 'NBR 15980' },
    { name: 'HP 250x62.0', category: 'w_hp', weightKgM: 62.0, dimensions: { height: 246, width: 256, thickness: 10.5, flangeThickness: 10.7 }, standardLengthMm: 12000, standard: 'NBR 15980' },
    { name: 'HP 250x85.0', category: 'w_hp', weightKgM: 85.0, dimensions: { height: 254, width: 260, thickness: 14.4, flangeThickness: 14.4 }, standardLengthMm: 12000, standard: 'NBR 15980' },
    { name: 'HP 310x79.0', category: 'w_hp', weightKgM: 79.0, dimensions: { height: 299, width: 306, thickness: 11.0, flangeThickness: 11.0 }, standardLengthMm: 12000, standard: 'NBR 15980' },
    { name: 'HP 310x93.0', category: 'w_hp', weightKgM: 93.0, dimensions: { height: 303, width: 308, thickness: 13.1, flangeThickness: 13.1 }, standardLengthMm: 12000, standard: 'NBR 15980' },
    { name: 'HP 310x125.0', category: 'w_hp', weightKgM: 125.0, dimensions: { height: 312, width: 312, thickness: 17.4, flangeThickness: 17.4 }, standardLengthMm: 12000, standard: 'NBR 15980' },
];

/**
 * Search W/HP catalog by name (case-insensitive partial match).
 */
export function searchWHPCatalog(query: string): SteelProfile[] {
    const q = query.toLowerCase().trim();
    if (!q) return W_HP_CATALOG;
    return W_HP_CATALOG.filter(p => p.name.toLowerCase().includes(q));
}

/**
 * Find exact W/HP profile by name.
 */
export function findWHPProfile(name: string): SteelProfile | undefined {
    return W_HP_CATALOG.find(p => p.name.toLowerCase() === name.toLowerCase().trim());
}
