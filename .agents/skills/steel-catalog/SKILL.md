---
name: steel-catalog
description: How to interact with the Steel Profiles Catalog, standardize names, and calculate weights for non-standard profiles.
---

# Steel Catalog Skill

This skill provides instructions on how to handle structural steel profiles in the NESTING1D application.

## Overview

The application uses `lib/steel-catalog` to centralize the knowledge of steel profiles, their canonical names, and their linear weights (`weightKgM`). This is crucial because:
1. The optimization algorithm needs accurate weight to calculate costs and tonnage.
2. The inventory needs canonical names to group similar bars and scraps properly.

## Core Concepts

**1. Standard Profiles (`profiles.ts`)**
The `PROFILES_DB` contains a list of standard commercial profiles (e.g., U Enrijecido 200x75x25x3.00, W 200x19.3). 

**2. Custom Builder (`custom-builder.ts`)**
Not all profiles are standard. If a user needs a U-profile with custom dimensions (e.g. folded from a plate), they use the `CustomProfileBuilder`. This logic uses standard formulas to calculate the linear weight based on generic dimensions (height, width, thickness).

**3. Canonical Naming Conventions**
When a profile is processed, it MUST follow the generated name from the builder:
- **U Enrijecido:** `Ue {h}x{b}x{d}x{t}`
- **U Simples:** `U {h}x{b}x{t}`
- **Cartola:** `Cartola {h}x{b}x{d}x{t}`
- **Z:** `Z {h}x{b}x{t}`
- **W/HP Laminado:** `W {h}x{weightKgM}` (e.g. W 200x15.0)
- **Cantoneira:** `L {b}x{t}`
- **Barra Chata:** `Chat. {b}x{t}`
- **Barra Redonda:** `BR Ø{d}`
- **Chapa:** `Chapa e={t}`

## How to use in Code

### Searching a Profile
To find a standard profile, use the `searchProfiles` function.
```typescript
import { searchProfiles } from '@/lib/steel-catalog';

const results = searchProfiles('Ue 200');
// Returns array of SteelProfile matching "Ue 200"
```

### Auto-calculating a Custom Profile
If a profile does not exist or has custom dimensions, use `buildCustomProfile` to get its precise weight and canonical name.

```typescript
import { buildCustomProfile, CustomProfileInput } from '@/lib/steel-catalog';

const input: CustomProfileInput = {
    type: 'ue',
    height: 150,
    width: 60,
    lipHeight: 20,
    thickness: 3.00
};

const profile = buildCustomProfile(input);
// profile.name === "Ue 150x60x20x3.00 (Custom)"
// profile.weightKgM === 6.67
```

## AI Extraction Parsing Rules

When parsing inputs (like from Gemini for PDFs), you MUST ensure the AI outputs the geometric breakdown of the profile so the application can pass it to the `custom-builder.ts` for standardization, rather than trusting the free-text name.

- Always map to `ProfileCategory` type.
- Ensure dimensions are in millimeters (`mm`).
- For W/HP beams, the weight is ALWAYS embedded in the commercial name (the last number after the `x`).
