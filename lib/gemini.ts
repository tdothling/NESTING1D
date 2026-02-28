import { CutRequest } from "./types";
import { calculateWeightKgM, searchWHPCatalog } from "./steel-catalog";
import type { ProfileCategory, ProfileDimensions } from "./steel-catalog";

const VALID_TYPES: ProfileCategory[] = [
  'ue', 'u_simples', 'cartola', 'z', 'cantoneira',
  'barra_chata', 'barra_redonda', 'chapa', 'w_hp'
];

export async function extractTableData(file: File): Promise<CutRequest[]> {
  // Convert file to base64
  const base64Data = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  try {
    const res = await fetch('/api/extract', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        base64Data,
        mimeType: file.type
      })
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Failed to extract data from Server');
    }

    const data = await res.json();

    // Map API response → CutRequest[] with profile dimensions and weight calculation
    return data.map((item: any) => {
      const profileType = VALID_TYPES.includes(item.profileType)
        ? (item.profileType as ProfileCategory)
        : undefined;

      // Build dimensions from flat API fields
      const profileDimensions: ProfileDimensions | undefined = profileType
        ? {
          height: item.profileHeight || undefined,
          width: item.profileWidth || undefined,
          thickness: item.profileThickness || undefined,
          lipHeight: item.profileLipHeight || undefined,
          flangeThickness: item.profileFlangeThickness || undefined,
          diameter: item.profileDiameter || undefined,
        }
        : undefined;

      // Auto-calculate weight
      let weightKgM = item.weightKgM || 0;

      if (profileType === 'w_hp') {
        // W/HP: search our static catalog by material name first
        const catalogResults = searchWHPCatalog(item.material);
        if (catalogResults.length > 0) {
          weightKgM = catalogResults[0].weightKgM;
        } else if (profileDimensions) {
          try { weightKgM = calculateWeightKgM('w_hp', profileDimensions); } catch { }
        }
      } else if (profileType === 'chapa' && profileDimensions) {
        // Chapa: total piece weight = width × length × thickness × 7850 / 1e9
        const w = profileDimensions.width || 0;
        const t = profileDimensions.thickness || 0;
        const l = item.length || 0;
        if (w > 0 && t > 0 && l > 0) {
          weightKgM = Math.round((w * l * t * 7850 / 1e9) * 100) / 100;
        }
      } else if (profileType && profileDimensions) {
        // All other profiles: formula
        try {
          weightKgM = calculateWeightKgM(profileType, profileDimensions);
        } catch {
          // Dimensions incomplete — leave weight as-is for manual edit
        }
      }

      return {
        id: crypto.randomUUID(),
        material: item.material,
        profileType,
        profileDimensions,
        length: item.length,
        quantity: item.quantity,
        weightKgM,
        description: item.description || '',
        skipOptimization: item.skipOptimization || false,
      };
    });
  } catch (error: any) {
    console.error("Client extraction error:", error);
    throw error;
  }
}
