import { optimizeCuts } from './optimizer';
import { CutRequest, StockItem } from './types';

// Web Worker context
self.onmessage = (e: MessageEvent) => {
    const { requests, currentStock, settings } = e.data;

    try {
        const optimization = optimizeCuts(requests, currentStock, settings);

        // Post result back to main thread
        self.postMessage({
            type: 'SUCCESS',
            payload: optimization
        });
    } catch (error: any) {
        self.postMessage({
            type: 'ERROR',
            error: error.message || 'Erro desconhecido na otimização'
        });
    }
};
