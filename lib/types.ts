export interface StockItem {
  id: string;
  material: string;
  length: number;
  quantity: number;
  isScrap: boolean; // true if it's a scrap piece, false if it's a full bar
}

export interface CutRequest {
  id: string;
  material: string;
  length: number;
  quantity: number;
  description?: string;
}

export interface Cut {
  length: number;
  description?: string;
  color?: string;
}

export interface BarResult {
  id: string;
  material: string; // Added material
  length: number;
  cuts: Cut[];
  waste: number;
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
  totalStockUsed: number;
  itemsNotFit: CutRequest[];
  purchaseList: PurchaseItem[]; // Added purchase list
}

export interface Project {
  id: string;
  name: string;
  createdAt: string;
  requests: CutRequest[];
  result?: OptimizationResult;
}
