import { ProfileCategory } from './profiles';

export interface CustomProfileInput {
    type: ProfileCategory;
    height?: number;       // Alma (h)
    width?: number;        // Mesa/Aba (b)
    thickness?: number;    // Espessura (t)
    lipHeight?: number;    // Enrijecedor (d)
    flangeThickness?: number; // Espessura da mesa (W/HP)
    diameter?: number;     // Barra redonda
}

export interface CalculatedProfile {
    id: string;
    name: string;
    category: ProfileCategory;
    weightKgM: number;
    isCustom: boolean;
}

const STEEL_DENSITY = 7.85; // kg/m³ * 10^-3 for mm units

export function buildCustomProfile(input: CustomProfileInput): CalculatedProfile {
    let weightKgM = 0;
    let name = '';

    const h = input.height || 0;
    const b = input.width || 0;
    const t = input.thickness || 0;
    const d = input.lipHeight || 0;
    const tf = input.flangeThickness || t;

    switch (input.type) {
        case 'ue':
            // [h + 2*b + 2*d] * t * 0.00785
            weightKgM = (h + 2 * b + 2 * d) * t * (STEEL_DENSITY / 1000);
            name = `Ue ${h}x${b}x${d}x${t.toFixed(2)} (Custom)`;
            break;

        case 'u_simples':
            // [h + 2*b] * t * 0.00785
            weightKgM = (h + 2 * b) * t * (STEEL_DENSITY / 1000);
            name = `U ${h}x${b}x${t.toFixed(2)} (Custom)`;
            break;

        case 'cartola':
            // [h + 2*b + 2*a] * t * 0.00785 (a = d here for simplicity)
            weightKgM = (h + 2 * b + 2 * d) * t * (STEEL_DENSITY / 1000);
            name = `Cartola ${h}x${b}x${d}x${t.toFixed(2)} (Custom)`;
            break;

        case 'z':
            // [h + 2*b] * t * 0.00785
            weightKgM = (h + 2 * b) * t * (STEEL_DENSITY / 1000);
            name = `Z ${h}x${b}x${t.toFixed(2)} (Custom)`;
            break;

        case 'cantoneira':
            // [a + b - t] * t * 0.00785 (assuming equal legs a=b=width)
            weightKgM = (b + b - t) * t * (STEEL_DENSITY / 1000);
            name = `L ${b}x${t.toFixed(2)} (Custom)`;
            break;

        case 'barra_chata':
            weightKgM = b * t * (STEEL_DENSITY / 1000);
            name = `Chat. ${b}x${t.toFixed(2)} (Custom)`;
            break;

        case 'barra_redonda':
            const dia = input.diameter || 0;
            weightKgM = Math.pow(dia, 2) * 0.006165;
            name = `BR Ø${dia} (Custom)`;
            break;

        case 'chapa':
            weightKgM = t * STEEL_DENSITY; // kg/m²
            name = `Chapa e=${t.toFixed(2)} (Custom)`;
            break;

        case 'w_hp':
            // Approximation for W shapes
            weightKgM = (h * t + 2 * b * tf) * (STEEL_DENSITY / 1000);
            name = `W/HP ${h}x${b} (Custom)`;
            break;

        default:
            throw new Error(`Unsupported custom profile type: ${input.type}`);
    }

    return {
        id: `custom-${input.type}-${crypto.randomUUID()}`,
        name,
        category: input.type,
        weightKgM: Number(weightKgM.toFixed(3)),
        isCustom: true
    };
}

export type ProfileDimensions = Omit<CustomProfileInput, 'type'>;

export function calculateWeightKgM(type: ProfileCategory, dims: ProfileDimensions): number {
    return buildCustomProfile({ type, ...dims }).weightKgM;
}
