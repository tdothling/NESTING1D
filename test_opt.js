const { optimizeCuts } = require('./lib/optimizer');

const stock = [
    { id: 'stock-1', material: 'Perfil', length: 6300, quantity: 1, isScrap: false }
];

const requests = [
    { id: 'req-1', material: 'Perfil', length: 6000, quantity: 1, description: '' }
];

const options = {
    standardBarLengths: { 'Perfil': 6000 },
    defaultStandardLength: 6000,
    kerf: 3,
    maxScrapLength: 1000
};

const result1 = optimizeCuts(requests, stock, options);
console.log("Scenario 1 (6300 stock, 6000 req):", JSON.stringify(result1, null, 2));

const stock2 = [];
const requests2 = [
    { id: 'req-2', material: 'Perfil', length: 6300, quantity: 1, description: '' }
];

const result2 = optimizeCuts(requests2, stock2, options);
console.log("Scenario 2 (6000 standard, 6300 req):", JSON.stringify(result2, null, 2));
