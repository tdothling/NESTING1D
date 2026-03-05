import React from 'react';

interface WaterfallSegment {
    label: string;
    value: number; // in mm or kg
    colorClass: string;
    pattern?: string;
    description?: string;
}

interface WaterfallBarProps {
    segments: WaterfallSegment[];
    total: number;
    height?: string;
    unit?: string;
}

export function WaterfallBar({ segments, total, height = 'h-12', unit = 'MM' }: WaterfallBarProps) {
    if (total <= 0) return null;

    return (
        <div className="w-full relative">
            <div className={`w-full ${height} bg-gray-200 flex overflow-hidden border-2 border-[var(--color-ink)] shadow-[4px_4px_0px_0px_var(--color-ink)]`}>
                {segments.map((segment, idx) => {
                    const widthPercent = (segment.value / total) * 100;
                    if (widthPercent <= 0) return null;

                    return (
                        <div
                            key={idx}
                            style={{
                                width: `${widthPercent}%`,
                                ...(segment.pattern ? {
                                    backgroundImage: segment.pattern,
                                    backgroundSize: '10px 10px'
                                } : {})
                            }}
                            className={`h-full flex items-center justify-center text-xs font-mono relative group transition-colors border-r-2 border-[var(--color-ink)] ${segment.colorClass}`}
                        >
                            {/* Only show label inside if we have enough space (e.g. > 5%) */}
                            {widthPercent > 5 && (
                                <div className="bg-white/80 px-1 border border-current font-black truncate max-w-full">
                                    {segment.value.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}
                                </div>
                            )}

                            {/* Tooltip */}
                            <div className="absolute bottom-full mb-2 hidden group-hover:block bg-white text-[var(--color-ink)] text-xs p-2 whitespace-nowrap z-50 border-2 border-[var(--color-ink)] shadow-[4px_4px_0px_0px_var(--color-ink)] font-bold text-left">
                                <div className="uppercase border-b-2 border-dashed border-[var(--color-ink)] pb-1 mb-1">
                                    {segment.label}
                                </div>
                                <div className="font-black text-sm">VALOR: {segment.value.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} {unit}</div>
                                <div className="text-[var(--color-accent)] mt-1">{widthPercent.toFixed(1)}% DO MATERIAL TOTAL</div>
                                {segment.description && (
                                    <div className="text-[10px] opacity-70 mt-1 uppercase max-w-[200px] whitespace-normal">
                                        {segment.description}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
