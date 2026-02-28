import * as XLSX from 'xlsx';
import { CutRequest } from './types';

/**
 * Parses an Excel (.xlsx) or CSV file into CutRequest[].
 * Expects columns: Material, Comprimento (or Length), Quantidade (or Qty), Descrição (optional), Peso (optional).
 * Column matching is case-insensitive and accent-insensitive.
 */
export function parseSpreadsheet(file: File): Promise<CutRequest[]> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                const rows: Record<string, any>[] = XLSX.utils.sheet_to_json(firstSheet);

                if (rows.length === 0) {
                    reject(new Error('Planilha vazia. Nenhuma linha encontrada.'));
                    return;
                }

                const requests: CutRequest[] = rows
                    .map((row) => {
                        const material = findCol(row, ['material', 'perfil', 'profile', 'descricao', 'descrição', 'description', 'item']);
                        const length = findNumCol(row, ['comprimento', 'length', 'comp', 'comp.', 'tamanho', 'size']);
                        const quantity = findNumCol(row, ['quantidade', 'qty', 'qtd', 'qtde', 'quant', 'quantity']) || 1;
                        const description = findCol(row, ['obs', 'observacao', 'observação', 'desc', 'nota', 'note', 'marca']);
                        const weight = findNumCol(row, ['peso', 'weight', 'kg/m', 'kgm', 'peso linear']);

                        if (!material || !length || length <= 0) return null;

                        return {
                            id: crypto.randomUUID(),
                            material: String(material).trim(),
                            length: Math.round(length),
                            quantity: Math.max(1, Math.round(quantity)),
                            description: description ? String(description).trim() : '',
                            weightKgM: weight && weight > 0 ? weight : undefined,
                        } as CutRequest;
                    })
                    .filter(Boolean) as CutRequest[];

                if (requests.length === 0) {
                    reject(new Error('Nenhum item válido encontrado. Verifique se as colunas "Material" e "Comprimento" existem na planilha.'));
                    return;
                }

                resolve(requests);
            } catch (err) {
                reject(err);
            }
        };

        reader.onerror = () => reject(new Error('Erro ao ler o arquivo.'));
        reader.readAsArrayBuffer(file);
    });
}

/**
 * Normalize a string for fuzzy column matching (remove accents, lowercase).
 */
function normalize(str: string): string {
    return str
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '');
}

/**
 * Find a column value by trying multiple possible header names.
 */
function findCol(row: Record<string, any>, candidates: string[]): string | undefined {
    const normalizedCandidates = candidates.map(normalize);
    for (const key of Object.keys(row)) {
        const nKey = normalize(key);
        if (normalizedCandidates.some(c => nKey.includes(c) || c.includes(nKey))) {
            return row[key] != null ? String(row[key]) : undefined;
        }
    }
    return undefined;
}

/**
 * Find a numeric column value by trying multiple possible header names.
 */
function findNumCol(row: Record<string, any>, candidates: string[]): number | undefined {
    const val = findCol(row, candidates);
    if (val == null) return undefined;
    const num = parseFloat(String(val).replace(',', '.'));
    return isNaN(num) ? undefined : num;
}
