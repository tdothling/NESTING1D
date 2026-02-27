import { StockItem, Project, OptimizationResult } from './types';
import { supabase } from './supabase';

export const getStock = async (): Promise<StockItem[]> => {
  const { data, error } = await supabase.from('stock').select('*').order('created_at', { ascending: false });
  if (error) {
    console.error('Error fetching stock:', error);
    return [];
  }

  return data.map(item => ({
    id: item.id,
    material: item.material,
    length: item.length,
    quantity: item.quantity,
    weightKgM: item.weight_kg_m,
    isScrap: item.is_scrap,
    originProjectId: item.origin_project_id
  }));
};

export const saveStock = async (stock: StockItem[]) => {
  const { error } = await supabase.from('stock').upsert(
    stock.map(item => ({
      id: item.id,
      material: item.material,
      length: item.length,
      quantity: item.quantity,
      weight_kg_m: item.weightKgM || 0,
      is_scrap: item.isScrap,
      origin_project_id: item.originProjectId || null
    }))
  );
  if (error) console.error('Error saving stock:', error);
};

export const saveStockItem = async (item: Omit<StockItem, 'id'>) => {
  const { error } = await supabase.from('stock').insert([{
    material: item.material,
    length: item.length,
    quantity: item.quantity,
    weight_kg_m: item.weightKgM || 0,
    is_scrap: item.isScrap,
    origin_project_id: item.originProjectId || null
  }]);

  if (error) console.error('Error saving stock:', error);
};

export const deleteStockItem = async (id: string) => {
  const { error } = await supabase.from('stock').delete().eq('id', id);
  if (error) console.error('Error deleting stock:', error);
};

export const getProjects = async (): Promise<Project[]> => {
  // To keep it simple for now, we just fetch projects. 
  // In a real scenario, you'd join with requests and optimization_bars.
  // For this quick migration, we'll store the complex `result` and `requests` as JSONB or 
  // we do the full relational fetch. Let's do a simplified relational fetch.

  const { data: projectsData, error } = await supabase.from('projects').select('*').order('created_at', { ascending: false });
  if (error) {
    console.error('Error fetching projects:', error);
    return [];
  }

  // We are returning basic project info here. Fully migrating the complex OptimizationResult 
  // to relational tables requires significant restructuring of the app state.
  // For the sake of this transition, we'll treat the DB as the source of truth for basic lists.
  return projectsData.map(p => ({
    id: p.id,
    name: p.name,
    createdAt: p.created_at,
    requests: [], // Will be fetched on demand or joined later
  }));
};

// ... further refactoring required for full relational mapping ...

export const addProject = async (project: Project) => {
  const { error } = await supabase.from('projects').insert([{
    id: project.id,
    name: project.name,
    created_at: project.createdAt,
    // Note: To avoid huge relational refactors across the entire frontend right now,
    // we just store the complex state payload into JSON columns.
    requests_json: project.requests,
    result_json: project.result || null
  }]);

  if (error) console.error('Error adding project:', error);
};

export const updateProject = async (project: Project) => {
  const { error } = await supabase.from('projects')
    .update({
      name: project.name,
      requests_json: project.requests,
      result_json: project.result || null
    })
    .eq('id', project.id);

  if (error) console.error('Error updating project:', error);
};

export const removeProject = async (id: string) => {
  const { error } = await supabase.from('projects').delete().eq('id', id);
  if (error) console.error('Error removing project:', error);
};

export const updateStockQuantity = async (id: string, newQuantity: number) => {
  const { error } = await supabase.from('stock').update({ quantity: newQuantity }).eq('id', id);
  if (error) console.error('Error updating stock:', error);
};

export const updateStockFromOptimization = async (result: OptimizationResult, projectId: string) => {
  const stock = await getStock();

  // 1. Consume used stock
  for (const bar of result.bars) {
    if (bar.sourceId && bar.sourceId !== 'new-standard') {
      const item = stock.find(s => s.id === bar.sourceId);
      if (item && item.quantity > 0) {
        await updateStockQuantity(item.id, item.quantity - 1);
        item.quantity -= 1; // local update just in case
      }
    }
  }

  // 2. Add reusable scraps back to stock
  const MIN_SCRAP_LENGTH = 50;

  for (const bar of result.bars) {
    if (bar.reusableScrap >= MIN_SCRAP_LENGTH) {
      const existingScrap = stock.find(s =>
        s.material === bar.material &&
        s.length === bar.reusableScrap &&
        s.isScrap === true &&
        s.originProjectId === projectId
      );

      if (existingScrap) {
        await updateStockQuantity(existingScrap.id, existingScrap.quantity + 1);
        existingScrap.quantity += 1;
      } else {
        await saveStockItem({
          material: bar.material,
          length: bar.reusableScrap,
          quantity: 1,
          isScrap: true,
          originProjectId: projectId
        });
      }
    }
  }
};

export const rollbackStock = async (projectId: string) => {
  const { data: pData } = await supabase.from('projects').select('*').eq('id', projectId).single();
  if (!pData || !pData.result_json) return;
  const result: OptimizationResult = pData.result_json;

  // Remove scraps generated
  await supabase.from('stock').delete().eq('is_scrap', true).eq('origin_project_id', projectId);

  // Add back consumed items
  const stock = await getStock();
  for (const bar of result.bars) {
    if (bar.sourceId && bar.sourceId !== 'new-standard') {
      const existing = stock.find(s => s.id === bar.sourceId);
      if (existing) {
        await updateStockQuantity(existing.id, existing.quantity + 1);
        existing.quantity += 1;
      } else {
        await saveStockItem({
          material: bar.material,
          length: bar.length,
          quantity: 1,
          isScrap: bar.isScrapUsed,
        });
      }
    }
  }
};
