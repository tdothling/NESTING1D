import { StockItem, Project, OptimizationResult } from './types';

const STORAGE_KEYS = {
  STOCK: 'nesting-1d-stock',
  PROJECTS: 'nesting-1d-projects',
};

export const getStock = (): StockItem[] => {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(STORAGE_KEYS.STOCK);
  return data ? JSON.parse(data) : [];
};

export const saveStock = (stock: StockItem[]) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.STOCK, JSON.stringify(stock));
};

export const getProjects = (): Project[] => {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(STORAGE_KEYS.PROJECTS);
  return data ? JSON.parse(data) : [];
};

export const saveProjects = (projects: Project[]) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
};

export const addProject = (project: Project) => {
  const projects = getProjects();
  projects.unshift(project);
  saveProjects(projects);
};

export const updateProject = (project: Project) => {
  const projects = getProjects();
  const index = projects.findIndex((p) => p.id === project.id);
  if (index !== -1) {
    projects[index] = project;
    saveProjects(projects);
  }
};

export const removeProject = (id: string) => {
  const projects = getProjects();
  const filteredProjects = projects.filter((p) => p.id !== id);
  saveProjects(filteredProjects);
};

export const updateStockFromOptimization = (result: OptimizationResult) => {
  const stock = getStock();
  
  // 1. Consume used stock
  result.bars.forEach(bar => {
    if (bar.sourceId && bar.sourceId !== 'new-standard') {
      const itemIndex = stock.findIndex(s => s.id === bar.sourceId);
      if (itemIndex !== -1) {
        if (stock[itemIndex].quantity > 0) {
           stock[itemIndex].quantity -= 1;
        }
      }
    }
  });

  // Remove items with 0 quantity
  const cleanStock = stock.filter(s => s.quantity > 0);

  // 2. Add scraps (waste) back to stock
  // Only add if waste is significant (e.g. > 100mm) to avoid clutter?
  // We'll use > 50mm as a safe default to avoid tiny shavings.
  const MIN_SCRAP_LENGTH = 50;
  
  result.bars.forEach(bar => {
    if (bar.waste >= MIN_SCRAP_LENGTH) {
      // Check if a similar scrap already exists to group them
      const existingScrapIndex = cleanStock.findIndex(s => 
        s.material === bar.material && 
        s.length === bar.waste && 
        s.isScrap === true
      );

      if (existingScrapIndex !== -1) {
        cleanStock[existingScrapIndex].quantity += 1;
      } else {
        cleanStock.push({
          id: crypto.randomUUID(),
          material: bar.material,
          length: bar.waste,
          quantity: 1,
          isScrap: true
        });
      }
    }
  });

  saveStock(cleanStock);
};
