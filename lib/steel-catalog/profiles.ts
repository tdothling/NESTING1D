export type ProfileCategory =
    | 'ue'           // U enrijecido (formado a frio)
    | 'u_simples'    // U simples (formado a frio)
    | 'cartola'      // Perfil cartola (formado a frio)
    | 'z'            // Perfil Z (formado a frio)
    | 'w_hp'         // Perfil laminado W ou HP
    | 'cantoneira'   // Cantoneira abas iguais
    | 'barra_chata'  // Barra chata
    | 'barra_redonda'// Barra redonda
    | 'chapa';       // Chapa de aço

export interface SteelProfile {
    id: string;               // Unique id
    name: string;             // Display name (e.g. "Ue 200x75x25x3.00")
    category: ProfileCategory;
    weightKgM: number;        // Weight in kg/m
    standardLengthMm: number; // e.g. 6000
    height?: number;          // Web height
    width?: number;           // Flange/leg width
    thickness?: number;       // Wall/plate thickness
    lipHeight?: number;       // Stiffener lip height
    flangeThickness?: number; // Flange thickness (W/HP)
    diameter?: number;        // Diameter (round bar)
    area?: number;            // cm²
    standard?: string;        // e.g. "NBR 6355"
    supplier?: string;        // e.g. "Gerdau"
    aliases?: string[];       // e.g. ["Ue200x75"]
}

export const PROFILES_DB: SteelProfile[] = [
    // --- U ENRIJECIDO (NBR 6355) ---
    {
        id: 'ue-50-25-10-2.00',
        name: 'Ue 50x25x10x2.00',
        category: 'ue',
        weightKgM: 1.76,
        standardLengthMm: 6000,
        height: 50, width: 25, lipHeight: 10, thickness: 2.00,
        standard: 'NBR 6355', supplier: 'Gerdau/Genérico'
    },
    {
        id: 'ue-75-40-15-2.00',
        name: 'Ue 75x40x15x2.00',
        category: 'ue',
        weightKgM: 2.70,
        standardLengthMm: 6000,
        height: 75, width: 40, lipHeight: 15, thickness: 2.00,
        standard: 'NBR 6355', supplier: 'Gerdau/Genérico'
    },
    {
        id: 'ue-100-50-17-2.00',
        name: 'Ue 100x50x17x2.00',
        category: 'ue',
        weightKgM: 3.48,
        standardLengthMm: 6000,
        height: 100, width: 50, lipHeight: 17, thickness: 2.00,
        standard: 'NBR 6355', supplier: 'Gerdau/Genérico'
    },
    {
        id: 'ue-150-50-17-2.65',
        name: 'Ue 150x50x17x2.65',
        category: 'ue',
        weightKgM: 5.61,
        standardLengthMm: 6000,
        height: 150, width: 50, lipHeight: 17, thickness: 2.65,
        standard: 'NBR 6355', supplier: 'Gerdau/Genérico'
    },
    {
        id: 'ue-200-75-25-3.00',
        name: 'Ue 200x75x25x3.00',
        category: 'ue',
        weightKgM: 8.94,
        standardLengthMm: 6000,
        height: 200, width: 75, lipHeight: 25, thickness: 3.00,
        standard: 'NBR 6355', supplier: 'Gerdau/Genérico'
    },

    // --- W/HP (Laminados) ---
    {
        id: 'w-150-13.0',
        name: 'W 150x13.0',
        category: 'w_hp',
        weightKgM: 13.0,
        standardLengthMm: 12000,
        standard: 'NBR 15980', supplier: 'Gerdau'
    },
    {
        id: 'w-200-15.0',
        name: 'W 200x15.0',
        category: 'w_hp',
        weightKgM: 15.0,
        standardLengthMm: 12000,
        standard: 'NBR 15980', supplier: 'Gerdau'
    },
    {
        id: 'w-200-19.3',
        name: 'W 200x19.3',
        category: 'w_hp',
        weightKgM: 19.3,
        standardLengthMm: 12000,
        standard: 'NBR 15980', supplier: 'Gerdau'
    },
    {
        id: 'w-250-25.3',
        name: 'W 250x25.3',
        category: 'w_hp',
        weightKgM: 25.3,
        standardLengthMm: 12000,
        standard: 'NBR 15980', supplier: 'Gerdau'
    },

    // --- CANTONEIRAS ---
    {
        id: 'l-1-1/8',
        name: 'L 1"x1/8"',
        category: 'cantoneira',
        weightKgM: 1.19,
        standardLengthMm: 6000,
        width: 25.4, thickness: 3.18,
        supplier: 'Gerdau', aliases: ['Cantoneira 1']
    },
    {
        id: 'l-2-3/16',
        name: 'L 2"x3/16"',
        category: 'cantoneira',
        weightKgM: 3.63,
        standardLengthMm: 6000,
        width: 50.8, thickness: 4.76,
        supplier: 'Gerdau', aliases: ['Cantoneira 2']
    },

    // --- BARRAS REDONDAS ---
    {
        id: 'br-1/2',
        name: 'BR Ø1/2"',
        category: 'barra_redonda',
        weightKgM: 0.99,
        standardLengthMm: 6000,
        diameter: 12.7,
        supplier: 'Gerdau'
    }
];

export const PROFILE_LABELS: Record<ProfileCategory, string> = {
    'ue': 'U Enrijecido',
    'u_simples': 'U Simples',
    'cartola': 'Cartola',
    'z': 'Perfil Z',
    'w_hp': 'W / HP',
    'cantoneira': 'Cantoneira',
    'barra_chata': 'Barra Chata',
    'barra_redonda': 'Barra Redonda',
    'chapa': 'Chapa',
};

// UI Mapping for the Custom Builder in StepReview
export const REQUIRED_DIMENSIONS: Record<ProfileCategory, (keyof Omit<SteelProfile, 'id' | 'name' | 'category' | 'weightKgM' | 'standardLengthMm' | 'area' | 'standard' | 'supplier' | 'aliases'>)[]> = {
    'ue': ['height', 'width', 'lipHeight', 'thickness'],
    'u_simples': ['height', 'width', 'thickness'],
    'cartola': ['height', 'width', 'lipHeight', 'thickness'],
    'z': ['height', 'width', 'thickness'],
    'cantoneira': ['width', 'thickness'],
    'barra_chata': ['width', 'thickness'],
    'barra_redonda': ['diameter'],
    'chapa': ['thickness'],
    'w_hp': [], // Handled specifically by weight input
};

export const DIMENSION_LABELS: Record<string, string> = {
    height: 'Alma (H)',
    width: 'Mesa / Aba (B)',
    thickness: 'Espessura (T)',
    lipHeight: 'Enrijec. (D)',
    diameter: 'Diâmetro (Ø)',
    flangeThickness: 'Esp. Mesa',
};
