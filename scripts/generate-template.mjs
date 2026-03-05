import XLSX from 'xlsx';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ── Sheet 1: Template with example data ──
const templateData = [
    { Material: 'UE 100x50x17x2.65', Comprimento: 3500, Largura: '', Quantidade: 4, Peso: '', Obs: 'Viga principal' },
    { Material: 'UE 100x50x17x2.65', Comprimento: 2100, Largura: '', Quantidade: 6, Peso: '', Obs: 'Travessa' },
    { Material: 'UE 150x60x20x3.00', Comprimento: 6000, Largura: '', Quantidade: 2, Peso: '', Obs: 'Coluna' },
    { Material: 'W 200x19.3', Comprimento: 4500, Largura: '', Quantidade: 3, Peso: 19.3, Obs: 'Viga metálica' },
    { Material: 'W 200x19.3', Comprimento: 3200, Largura: '', Quantidade: 2, Peso: 19.3, Obs: '' },
    { Material: 'L 2x1/8', Comprimento: 1200, Largura: '', Quantidade: 10, Peso: '', Obs: 'Cantoneira reforço' },
    { Material: 'L 3x3/16', Comprimento: 800, Largura: '', Quantidade: 8, Peso: '', Obs: 'Mão francesa' },
    { Material: 'U 100x50x3', Comprimento: 2800, Largura: '', Quantidade: 6, Peso: '', Obs: 'Perfil U simples' },
    { Material: 'BC 3x1/4', Comprimento: 500, Largura: '', Quantidade: 12, Peso: '', Obs: 'Barra chata' },
    { Material: 'BR 1/2', Comprimento: 600, Largura: '', Quantidade: 5, Peso: '', Obs: 'Barra redonda' },
    { Material: 'CART 100x50x2', Comprimento: 3000, Largura: '', Quantidade: 4, Peso: '', Obs: 'Perfil cartola' },
    { Material: 'CH 3/16', Comprimento: 1000, Largura: 1200, Quantidade: 3, Peso: '', Obs: 'Chapa — largura obrigatória' },
];

// ── Sheet 2: Reference table for profile naming ──
const referenceData = [
    { 'Tipo de Perfil': 'UE (Enrijecido)', 'Formato do Nome': 'UE AxBxCxD', 'Exemplo': 'UE 100x50x17x2.65', 'Descrição': 'A=Altura, B=Largura, C=Enrijecedor, D=Espessura' },
    { 'Tipo de Perfil': 'U Simples', 'Formato do Nome': 'U AxBxC', 'Exemplo': 'U 100x50x3', 'Descrição': 'A=Altura, B=Largura, C=Espessura' },
    { 'Tipo de Perfil': 'Cantoneira', 'Formato do Nome': 'L AxB', 'Exemplo': 'L 2x1/8', 'Descrição': 'A=Aba (pol), B=Espessura (pol)' },
    { 'Tipo de Perfil': 'Barra Chata', 'Formato do Nome': 'BC AxB', 'Exemplo': 'BC 3x1/4', 'Descrição': 'A=Largura (pol), B=Espessura (pol)' },
    { 'Tipo de Perfil': 'Barra Redonda', 'Formato do Nome': 'BR D', 'Exemplo': 'BR 1/2', 'Descrição': 'D=Diâmetro (pol)' },
    { 'Tipo de Perfil': 'W / HP', 'Formato do Nome': 'W AxB', 'Exemplo': 'W 200x19.3', 'Descrição': 'A=Altura (mm), B=Peso linear (kg/m)' },
    { 'Tipo de Perfil': 'Cartola', 'Formato do Nome': 'CART AxBxC', 'Exemplo': 'CART 100x50x2', 'Descrição': 'A=Altura, B=Largura, C=Espessura' },
    { 'Tipo de Perfil': 'Chapa', 'Formato do Nome': 'CH E', 'Exemplo': 'CH 3/16', 'Descrição': 'E=Espessura (pol ou mm)' },
    { 'Tipo de Perfil': 'Perfil Z', 'Formato do Nome': 'Z AxBxC', 'Exemplo': 'Z 150x60x2', 'Descrição': 'A=Altura, B=Largura, C=Espessura' },
];

// ── Sheet 3: Instructions ──
const instructionsData = [
    { 'Instruções de Uso': '📐 TEMPLATE PARA IMPORTAÇÃO DE PERFIS - NESTING 1D' },
    { 'Instruções de Uso': '' },
    { 'Instruções de Uso': '▸ ABA "Lista de Cortes": Preencha com os perfis do seu projeto.' },
    { 'Instruções de Uso': '▸ ABA "Referência de Nomes": Consulte o formato correto para cada tipo de perfil.' },
    { 'Instruções de Uso': '' },
    { 'Instruções de Uso': '⚠️  REGRAS IMPORTANTES:' },
    { 'Instruções de Uso': '' },
    { 'Instruções de Uso': '1. COMPRIMENTO deve ser em MILÍMETROS (mm).' },
    { 'Instruções de Uso': '2. QUANTIDADE é opcional (padrão = 1 se não informada).' },
    { 'Instruções de Uso': '3. PESO é opcional — o sistema calcula automaticamente para a maioria dos perfis.' },
    { 'Instruções de Uso': '   → Para W/HP, preencha o peso manualmente (ex: 19.3 para W200x19.3).' },
    { 'Instruções de Uso': '4. Use NOMES IDÊNTICOS para perfis do mesmo tipo. Perfis com nomes iguais serão otimizados juntos.' },
    { 'Instruções de Uso': '   → ✅ Correto: "UE 100x50x17x2.65" em todas as linhas do mesmo perfil.' },
    { 'Instruções de Uso': '   → ❌ Errado:  "UE 100x50" em uma linha e "Ue100x50" em outra.' },
    { 'Instruções de Uso': '5. A coluna OBS é opcional — use para marcas, referências ou anotações.' },
    { 'Instruções de Uso': '' },
    { 'Instruções de Uso': '💡 Aceita arquivos .xlsx e .csv — use o formato que preferir.' },
];

// Create workbook
const wb = XLSX.utils.book_new();

// Sheet 1 — Lista de Cortes
const ws1 = XLSX.utils.json_to_sheet(templateData);
// Set column widths
ws1['!cols'] = [
    { wch: 25 }, // Material
    { wch: 15 }, // Comprimento
    { wch: 12 }, // Largura
    { wch: 12 }, // Quantidade
    { wch: 10 }, // Peso
    { wch: 25 }, // Obs
];
XLSX.utils.book_append_sheet(wb, ws1, 'Lista de Cortes');

// Sheet 2 — Referência de Nomes
const ws2 = XLSX.utils.json_to_sheet(referenceData);
ws2['!cols'] = [
    { wch: 20 }, // Tipo
    { wch: 20 }, // Formato
    { wch: 25 }, // Exemplo
    { wch: 50 }, // Descrição
];
XLSX.utils.book_append_sheet(wb, ws2, 'Referência de Nomes');

// Sheet 3 — Instruções
const ws3 = XLSX.utils.json_to_sheet(instructionsData);
ws3['!cols'] = [{ wch: 90 }];
XLSX.utils.book_append_sheet(wb, ws3, 'Instruções');

// Write file
const outputPath = join(__dirname, '..', 'TEMPLATE_IMPORTACAO.xlsx');
XLSX.writeFile(wb, outputPath);

console.log(`✅ Template criado com sucesso: ${outputPath}`);
