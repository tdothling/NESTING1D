import { optimizeCuts } from './lib/optimizer';

const requests = [
    { id: '1', material: 'Steel', length: 2000, quantity: 1, skipOptimization: false }
];

const res = optimizeCuts(requests, [], {
    standardBarLengths: { Steel: 6000 },
    defaultStandardLength: 6000,
    kerf: 3,
    maxScrapLength: 1000
});

console.log(JSON.stringify(res, null, 2));
