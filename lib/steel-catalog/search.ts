import { PROFILES_DB, SteelProfile, ProfileCategory } from './profiles';

export function searchProfiles(query: string, category?: ProfileCategory): SteelProfile[] {
    let filtered = PROFILES_DB;

    if (category) {
        filtered = filtered.filter(p => p.category === category);
    }

    if (!query) return filtered;

    const normalizedQuery = query.toLowerCase().trim();

    // Simple substring matching on name and aliases
    return filtered.filter(p => {
        if (p.name.toLowerCase().includes(normalizedQuery)) return true;
        if (p.aliases?.some(alias => alias.toLowerCase().includes(normalizedQuery))) return true;
        if (p.id.toLowerCase().includes(normalizedQuery)) return true;
        return false;
    }).slice(0, 20); // Limit results
}

export function getProfile(idOrName: string): SteelProfile | undefined {
    const norm = idOrName.toLowerCase().trim();
    return PROFILES_DB.find(p =>
        p.id.toLowerCase() === norm ||
        p.name.toLowerCase() === norm
    );
}

export function getCategories(): ProfileCategory[] {
    return [
        'ue', 'u_simples', 'cartola', 'z', 'w_hp',
        'cantoneira', 'barra_chata', 'barra_redonda', 'chapa'
    ];
}
