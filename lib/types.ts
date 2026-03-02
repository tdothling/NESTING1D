import type { ProfileCategory, ProfileDimensions } from './steel-catalog';

export interface StockItem {
  id: string;
  material: string;
  profileId?: string; // Reference to steel-catalog profile id
  length: number;
  quantity: number;
  weightKgM?: number; // Weight in Kg per meter
  pricePerMeter?: number; // Price in R$ per meter
  isScrap: boolean; // true if it's a scrap piece, false if it's a full bar
  originProjectId?: string; // ID of the project that generated this scrap
}

export interface CutRequest {
  id: string;
  material: string;
  profileId?: string; // Reference to steel-catalog profile id
  isCustomProfile?: boolean; // True if calculated via builder
  profileType?: ProfileCategory;       // Steel profile type (ue, u_simples, z, etc.)
  profileDimensions?: ProfileDimensions; // Dimensions for weight calculation
  length: number;
  quantity: number;
  weightKgM?: number; // Linear weight (Kg/m) — auto-calculated or manual
  description?: string;
  skipOptimization?: boolean; // If true, this item goes straight to purchase list (e.g., steel plates)
}

export interface Cut {
  length: number;
  description?: string;
  color?: string;
}

export interface BarResult {
  id: string;
  material: string; // Added material
  profileId?: string;
  weightKgM?: number;
  length: number;
  cuts: Cut[];
  waste: number;
  trueWaste: number; // The amount of waste that is unrecoverable (sucata) in mm
  trueWasteKg: number; // The amount of waste that is unrecoverable (sucata) in Kg
  reusableScrap: number; // The amount of waste that goes back to stock
  isScrapUsed: boolean;
  sourceId?: string; // ID of the stock item used
}

export interface PurchaseItem {
  material: string;
  length: number;
  quantity: number;
}

export interface OptimizationResult {
  bars: BarResult[];
  totalWaste: number;
  totalTrueWaste: number; // Total unrecoverable waste across all bars in mm
  totalTrueWasteKg: number; // Total unrecoverable waste across all bars in Kg
  totalReusableScrap: number; // Total scrap returned to stock across all bars
  totalStockUsed: number;
  itemsNotFit: CutRequest[];
  purchaseList: PurchaseItem[]; // Added purchase list
}

export interface ProjectSettings {
  standardBarLengths: Record<string, number>;
  maxScrapLength: number;
}

export interface Project {
  id: string;
  name: string;
  createdAt: string;
  requests: CutRequest[];
  result?: OptimizationResult;
  settings?: ProjectSettings;
}
