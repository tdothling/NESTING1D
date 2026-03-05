import { StockItem, Project, OptimizationResult, ProjectSummary } from './types';
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
    profileId: item.profile_id || undefined,
    length: item.length,
    quantity: item.quantity,
    weightKgM: item.weight_kg_m,
    pricePerKg: item.price_per_kg,
    isScrap: item.is_scrap,
    originProjectId: item.origin_project_id
  }));
};

export const saveStock = async (stock: StockItem[]) => {
  const { error } = await supabase.from('stock').upsert(
    stock.map(item => ({
      id: item.id,
      material: item.material,
      profile_id: item.profileId || null,
      length: item.length,
      quantity: item.quantity,
      weight_kg_m: item.weightKgM || 0,
      price_per_kg: item.pricePerKg || 0,
      is_scrap: item.isScrap,
      origin_project_id: item.originProjectId || null
    }))
  );
  if (error) console.error('Error saving stock:', error);
};

export const saveStockItem = async (item: Omit<StockItem, 'id'>) => {
  if (item.quantity <= 0) return;
  const { error } = await supabase.from('stock').insert([{
    material: item.material,
    profile_id: item.profileId || null,
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
  const { data: projectsData, error } = await supabase.from('projects').select('*').order('created_at', { ascending: false });
  if (error) {
    console.error('Error fetching projects:', error);
    return [];
  }

  return projectsData.map(p => ({
    id: p.id,
    name: p.name,
    createdAt: p.created_at,
    requests: p.requests_json || [],
    result: p.result_json || undefined,
    settings: p.settings_json || undefined,
  }));
};

export const getProjectsSummary = async (): Promise<ProjectSummary[]> => {
  // Only select the lightweight columns needed for list views
  const { data: projectsData, error } = await supabase.from('projects').select('id, name, created_at, requests_json, result_json->totalStockUsed').order('created_at', { ascending: false });
  if (error) {
    console.error('Error fetching projects summary:', error);
    return [];
  }

  return projectsData.map(p => ({
    id: p.id,
    name: p.name,
    createdAt: p.created_at,
    requestCount: p.requests_json ? Array.isArray(p.requests_json) ? p.requests_json.length : 0 : 0,
    totalStockUsed: p.totalStockUsed ? Number(p.totalStockUsed) : null,
    hasResult: p.totalStockUsed !== null && p.totalStockUsed !== undefined
  }));
};

export const getProjectById = async (id: string): Promise<Project | null> => {
  const { data, error } = await supabase.from('projects').select('*').eq('id', id).single();

  if (error || !data) {
    console.error('Error fetching project by ID:', error);
    return null;
  }

  return {
    id: data.id,
    name: data.name,
    createdAt: data.created_at,
    requests: data.requests_json || [],
    result: data.result_json || undefined,
    settings: data.settings_json || undefined,
  };
};

// ... further refactoring required for full relational mapping ...

export const addProject = async (project: Project) => {
  const { error } = await supabase.from('projects').insert([{
    id: project.id,
    name: project.name,
    created_at: project.createdAt,
    requests_json: project.requests,
    result_json: project.result || null,
    settings_json: project.settings || null
  }]);

  if (error) console.error('Error adding project:', error);
};

export const updateProject = async (project: Project) => {
  const { error } = await supabase.from('projects')
    .update({
      name: project.name,
      requests_json: project.requests,
      result_json: project.result || null,
      settings_json: project.settings || null
    })
    .eq('id', project.id);

  if (error) console.error('Error updating project:', error);
};

export const removeProject = async (id: string) => {
  const { error } = await supabase.from('projects').delete().eq('id', id);
  if (error) console.error('Error removing project:', error);
};

export const saveNewStockItems = async (items: Omit<StockItem, 'id'>[]) => {
  if (items.length === 0) return;
  const { error } = await supabase.from('stock').insert(
    items.map(item => ({
      material: item.material,
      profile_id: item.profileId || null,
      length: item.length,
      quantity: item.quantity,
      weight_kg_m: item.weightKgM || 0,
      price_per_kg: item.pricePerKg || 0,
      is_scrap: item.isScrap,
      origin_project_id: item.originProjectId || null
    }))
  );
  if (error) console.error('Error saving new stock items:', error);
};

export const updateStockQuantity = async (id: string, newQuantity: number) => {
  const { error } = await supabase.from('stock').update({ quantity: newQuantity }).eq('id', id);
  if (error) console.error('Error updating stock:', error);
};

export const updateStockFromOptimization = async (result: OptimizationResult, projectId: string) => {
  const stock = await getStock();
  const modifiedStockIds = new Set<string>();

  // 1. Consume used stock (Grouped)
  for (const bar of result.bars) {
    if (bar.sourceId && bar.sourceId !== 'new-standard') {
      const item = stock.find(s => s.id === bar.sourceId);
      if (item && item.quantity > 0) {
        item.quantity -= 1; // Update local memory reference
        modifiedStockIds.add(item.id);
      }
    }
  }

  // 2. Add reusable scraps back to stock (Grouped)
  const MIN_SCRAP_LENGTH = 50;
  const newScrapsToAdd: Record<string, Omit<StockItem, 'id'>> = {};

  for (const bar of result.bars) {
    if (bar.reusableScrap >= MIN_SCRAP_LENGTH) {
      let sourceProfileId: string | undefined = bar.profileId;
      let sourceWeightKgM: number = bar.weightKgM || 0;
      let sourcePricePerKg: number = 0;

      if (bar.sourceId && bar.sourceId !== 'new-standard') {
        const sourceItem = stock.find(s => s.id === bar.sourceId);
        if (sourceItem) {
          sourceProfileId = sourceItem.profileId || sourceProfileId;
          sourceWeightKgM = sourceItem.weightKgM || sourceWeightKgM;
          sourcePricePerKg = sourceItem.pricePerKg || 0;
        }
      }

      const existingScrap = stock.find(s =>
        s.material === bar.material &&
        s.length === bar.reusableScrap &&
        s.isScrap === true &&
        s.profileId === sourceProfileId
      );

      if (existingScrap) {
        existingScrap.quantity += 1;
        modifiedStockIds.add(existingScrap.id);
      } else {
        const hash = `${bar.material}|${sourceProfileId || 'no-profile'}|${bar.reusableScrap}`;
        if (!newScrapsToAdd[hash]) {
          newScrapsToAdd[hash] = {
            material: bar.material,
            profileId: sourceProfileId,
            weightKgM: sourceWeightKgM,
            pricePerKg: sourcePricePerKg,
            length: bar.reusableScrap,
            quantity: 1,
            isScrap: true,
            originProjectId: projectId
          };
        } else {
          newScrapsToAdd[hash].quantity += 1;
        }
      }
    }
  }

  // Execute Bulk Upserts
  const itemsToUpsert = stock.filter(s => modifiedStockIds.has(s.id));
  if (itemsToUpsert.length > 0) {
    await saveStock(itemsToUpsert);
  }

  // Execute Bulk Inserts
  const newItemsToInsert = Object.values(newScrapsToAdd);
  if (newItemsToInsert.length > 0) {
    await saveNewStockItems(newItemsToInsert);
  }
};

export const rollbackStock = async (projectId: string) => {
  const { data: pData } = await supabase.from('projects').select('*').eq('id', projectId).single();
  if (!pData || !pData.result_json) return;
  const result: OptimizationResult = pData.result_json;

  // 1. Remove scraps generated
  const stock = await getStock();
  const modifiedStockIds = new Set<string>();
  const idsToDelete = new Set<string>();
  const MIN_SCRAP_LENGTH = 50;

  for (const bar of result.bars) {
    if (bar.reusableScrap >= MIN_SCRAP_LENGTH) {
      let sourceProfileId: string | undefined = bar.profileId;
      if (bar.sourceId && bar.sourceId !== 'new-standard') {
        const sourceItem = stock.find(s => s.id === bar.sourceId);
        if (sourceItem) sourceProfileId = sourceItem.profileId || sourceProfileId;
      }

      const existingScrap = stock.find(s =>
        s.material === bar.material &&
        s.length === bar.reusableScrap &&
        s.isScrap === true &&
        s.profileId === sourceProfileId
      );
      if (existingScrap) {
        existingScrap.quantity -= 1;
        if (existingScrap.quantity <= 0) {
          idsToDelete.add(existingScrap.id);
          modifiedStockIds.delete(existingScrap.id);
        } else {
          modifiedStockIds.add(existingScrap.id);
        }
      }
    }
  }

  // 2. Add back consumed items
  const newItemsToInsert: Omit<StockItem, 'id'>[] = [];
  for (const bar of result.bars) {
    if (bar.sourceId && bar.sourceId !== 'new-standard') {
      const existing = stock.find(s => s.id === bar.sourceId);
      if (existing) {
        existing.quantity += 1;
        if (idsToDelete.has(existing.id)) {
          idsToDelete.delete(existing.id); // it resurrected!
        }
        modifiedStockIds.add(existing.id);
      } else {
        newItemsToInsert.push({
          material: bar.material,
          profileId: bar.profileId,
          weightKgM: bar.weightKgM,
          pricePerKg: 0,
          length: bar.length,
          quantity: 1,
          isScrap: bar.isScrapUsed,
        });
      }
    }
  }

  // Execute Deletes
  if (idsToDelete.size > 0) {
    const idArray = Array.from(idsToDelete);
    await supabase.from('stock').delete().in('id', idArray);
  }

  // Execute Upserts
  const itemsToUpsert = stock.filter(s => modifiedStockIds.has(s.id));
  if (itemsToUpsert.length > 0) {
    await saveStock(itemsToUpsert);
  }

  // Execute Inserts
  const groupedInserts: Record<string, Omit<StockItem, 'id'>> = {};
  for (const item of newItemsToInsert) {
    const hash = `${item.material}|${item.profileId || 'no'}|${item.length}|${item.isScrap}`;
    if (!groupedInserts[hash]) {
      groupedInserts[hash] = item;
    } else {
      groupedInserts[hash].quantity += 1;
    }
  }
  const groupedArray = Object.values(groupedInserts);
  if (groupedArray.length > 0) {
    await saveNewStockItems(groupedArray);
  }
};
