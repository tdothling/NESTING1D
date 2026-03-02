import { CutRequest } from "./types";
import { calculateWeightKgM, buildCustomProfile, searchProfiles, SteelProfile } from "./steel-catalog";
import type { ProfileCategory, ProfileDimensions, CustomProfileInput } from "./steel-catalog";

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

      // Auto-calculate weight and resolve catalog profile
      let weightKgM = item.weightKgM || 0;
      let matchedProfileId: string | undefined = undefined;
      let isCustomProfile = false;
      let canonicalMaterialName = item.material;

      if (profileType === 'w_hp') {
        // W/HP: weight is in the profile name (e.g. W200x19.3 = 19.3 kg/m)
        // Search catalog for a match just in case
        const matches = searchProfiles(`W ${item.profileHeight}x${item.weightKgM}`, profileType);
        if (matches.length > 0) {
          matchedProfileId = matches[0].id;
          canonicalMaterialName = matches[0].name;
          weightKgM = matches[0].weightKgM;
        }
      } else if (profileType && profileDimensions) {
        // Build a custom profile representation first to calculate exact weight
        try {
          const customParams: CustomProfileInput = { type: profileType, ...profileDimensions };
          const calculated = buildCustomProfile(customParams);
          weightKgM = calculated.weightKgM;

          // Now, try to see if this "custom" shape actually exists in our standard catalog
          // by searching with the dimensions/weight. 
          // For a simpler phase 1, we just do a fuzzy search using the AI's raw material name
          const matches = searchProfiles(item.material, profileType);

          if (matches.length > 0 && Math.abs(matches[0].weightKgM - weightKgM) < 0.5) {
            // Close enough match in weight, assume it's the standard catalog item
            matchedProfileId = matches[0].id;
            canonicalMaterialName = matches[0].name;
            weightKgM = matches[0].weightKgM; // Use catalog precise weight
          } else {
            // Truly a custom profile (not in catalog)
            isCustomProfile = true;
            canonicalMaterialName = calculated.name;
          }
        } catch {
          // Dimensions incomplete — leave weight as-is for manual edit
        }
      }

      return {
        id: crypto.randomUUID(),
        material: canonicalMaterialName, // Use standardized name
        profileId: matchedProfileId,
        isCustomProfile,
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
