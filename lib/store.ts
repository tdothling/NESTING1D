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
    profileId: item.profile_id || undefined,
    length: item.length,
    quantity: item.quantity,
    weightKgM: item.weight_kg_m,
    pricePerMeter: item.price_per_meter,
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
      price_per_meter: item.pricePerMeter || 0,
      is_scrap: item.isScrap,
      origin_project_id: item.originProjectId || null
    }))
  );
  if (error) console.error('Error saving stock:', error);
};

export const saveStockItem = async (item: Omit<StockItem, 'id'>) => {
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

export const updateStockQuantity = async (id: string, newQuantity: number) => {
  const { error } = await supabase.from('stock').update({ quantity: newQuantity }).eq('id', id);
  if (error) console.error('Error updating stock:', error);
};

export const updateStockFromOptimization = async (result: OptimizationResult, projectId: string) => {
  const stock = await getStock();

  // 1. Consume used stock (Grouped)
  const consumedStockUpdates: Record<string, number> = {};
  for (const bar of result.bars) {
    if (bar.sourceId && bar.sourceId !== 'new-standard') {
      const item = stock.find(s => s.id === bar.sourceId);
      if (item && item.quantity > 0) {
        // Keep tracking the new decremented quantity
        consumedStockUpdates[item.id] = (consumedStockUpdates[item.id] ?? item.quantity) - 1;
        item.quantity -= 1; // Update local memory reference
      }
    }
  }

  // Execute consumed stock updates
  for (const id of Object.keys(consumedStockUpdates)) {
    await updateStockQuantity(id, consumedStockUpdates[id]);
  }


  // 2. Add reusable scraps back to stock (Grouped)
  const MIN_SCRAP_LENGTH = 50;

  const existingScrapUpdates: Record<string, number> = {};
  const newScrapsToAdd: Record<string, { material: string, profileId?: string, weightKgM?: number, length: number, quantity: number }> = {};

  for (const bar of result.bars) {
    if (bar.reusableScrap >= MIN_SCRAP_LENGTH) {
      // Find the source item in stock to get its profileId and weight
      let sourceProfileId: string | undefined = undefined;
      let sourceWeightKgM: number = 0;

      if (bar.sourceId && bar.sourceId !== 'new-standard') {
        const sourceItem = stock.find(s => s.id === bar.sourceId);
        if (sourceItem) {
          sourceProfileId = sourceItem.profileId;
          sourceWeightKgM = sourceItem.weightKgM || 0;
        }
      }

      const existingScrap = stock.find(s =>
        s.material === bar.material &&
        s.length === bar.reusableScrap &&
        s.isScrap === true &&
        s.originProjectId === projectId &&
        s.profileId === sourceProfileId
      );

      if (existingScrap) {
        existingScrapUpdates[existingScrap.id] = (existingScrapUpdates[existingScrap.id] ?? existingScrap.quantity) + 1;
        existingScrap.quantity += 1;
      } else {
        const hash = `${bar.material}|${sourceProfileId || 'no-profile'}|${bar.reusableScrap}`;
        if (!newScrapsToAdd[hash]) {
          newScrapsToAdd[hash] = {
            material: bar.material,
            profileId: sourceProfileId,
            weightKgM: sourceWeightKgM,
            length: bar.reusableScrap,
            quantity: 1
          };
        } else {
          newScrapsToAdd[hash].quantity += 1;
        }
      }
    }
  }

  // Execute existing scrap increments
  for (const id of Object.keys(existingScrapUpdates)) {
    await updateStockQuantity(id, existingScrapUpdates[id]);
  }

  // Execute grouped new scrap additions (instead of 14 separate DB writes of qty 1)
  for (const hash of Object.keys(newScrapsToAdd)) {
    const scrapInfo = newScrapsToAdd[hash];
    await saveStockItem({
      material: scrapInfo.material,
      profileId: scrapInfo.profileId,
      weightKgM: scrapInfo.weightKgM,
      length: scrapInfo.length,
      quantity: scrapInfo.quantity,
      isScrap: true,
      originProjectId: projectId
    });
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
