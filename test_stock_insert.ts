import { supabase } from './lib/supabase';

async function checkCols() {
    const { data, error } = await supabase.from('stock').select('profile_id, weight_kg_m, price_per_meter, origin_project_id').limit(1);
    console.log('Select error:', error);
}

checkCols();
