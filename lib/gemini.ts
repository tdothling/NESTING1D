import { CutRequest } from "./types";
import { calculateWeightKgM } from "./steel-catalog";
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

      // Auto-calculate weight if we have type + dimensions
      let weightKgM = item.weightKgM || 0;
      if (profileType && profileDimensions) {
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
