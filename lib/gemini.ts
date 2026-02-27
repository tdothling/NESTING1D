import { CutRequest } from "./types";

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

    // Add IDs
    return data.map((item: any) => ({
      id: crypto.randomUUID(),
      material: item.material,
      length: item.length,
      quantity: item.quantity,
      weightKgM: item.weightKgM || 0,
      description: item.description || '',
      skipOptimization: item.skipOptimization || false,
    }));
  } catch (error: any) {
    console.error("Client extraction error:", error);
    throw error;
  }
}
