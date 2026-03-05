'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';

interface GaugeChartProps {
    value: number; // 0 a 100
    label?: string;
}

export function GaugeChart({ value, label = 'APROVEITAMENTO' }: GaugeChartProps) {
    const [animatedValue, setAnimatedValue] = useState(0);

    useEffect(() => {
        // Delay setting the value to allow the animation to play
        const timeout = setTimeout(() => {
            setAnimatedValue(value);
        }, 100);
        return () => clearTimeout(timeout);
    }, [value]);

    // Constantes do arco
    const radius = 80;
    const strokeWidth = 24;
    const circumference = Math.PI * radius; // Somente metade do círculo (semicírculo superior)
    const arcDashArray = `${circumference} ${circumference}`;

    // Rotação do ponteiro: de -90 a +90 graus (0% a 100%)
    const minAngle = -90;
    const maxAngle = 90;
    const angle = minAngle + (animatedValue / 100) * (maxAngle - minAngle);

    // Determinar a cor baseada no valor
    let colorClass = 'text-red-500';
    let fillColor = '#ef4444'; // red-500
    if (value >= 90) {
        colorClass = 'text-emerald-500';
        fillColor = '#10b981'; // emerald-500
    } else if (value >= 70) {
        colorClass = 'text-amber-500';
        fillColor = '#f59e0b'; // amber-500
    }

    return (
        <div className="flex flex-col items-center justify-center relative w-full pb-4">
            <div className="relative w-64 h-36 overflow-hidden flex items-end justify-center">

                {/* Background Arc */}
                <svg className="absolute top-0 w-64 h-64" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <linearGradient id="gauge-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#ef4444" /> {/* red-500 */}
                            <stop offset="50%" stopColor="#f59e0b" /> {/* amber-500 */}
                            <stop offset="100%" stopColor="#10b981" /> {/* emerald-500 */}
                        </linearGradient>
                    </defs>
                    <path
                        d={`M 20 ${100} A ${radius} ${radius} 0 0 1 180 ${100}`}
                        fill="none"
                        stroke="#e5e7eb" // gray-200
                        strokeWidth={strokeWidth}
                        strokeLinecap="butt"
                    />
                    {/* Colored Arc (mask or fill) - we fill the whole gradient but mask it to only show up to 'value' */}
                    <motion.path
                        d={`M 20 ${100} A ${radius} ${radius} 0 0 1 180 ${100}`}
                        fill="none"
                        stroke="url(#gauge-gradient)"
                        strokeWidth={strokeWidth}
                        strokeLinecap="butt"
                        strokeDasharray={arcDashArray}
                        initial={{ strokeDashoffset: circumference }}
                        animate={{ strokeDashoffset: circumference - (animatedValue / 100) * circumference }}
                        transition={{ duration: 1.5, ease: 'easeOut' }}
                    />
                </svg>

                {/* Ponteiro (Needle) */}
                <motion.div
                    className="absolute bottom-0 w-2 h-20 origin-bottom rounded-t-full hidden" // Hidden in favor of SVG needle
                    style={{ backgroundColor: 'var(--color-ink)' }}
                    initial={{ rotate: minAngle }}
                    animate={{ rotate: angle }}
                    transition={{ duration: 1.5, ease: 'easeOut', type: 'spring', bounce: 0.2 }}
                />

                <svg className="absolute top-0 w-64 h-64" viewBox="0 0 200 200">
                    <motion.g
                        initial={{ rotate: minAngle }}
                        animate={{ rotate: angle }}
                        transition={{ duration: 1.5, ease: 'easeOut' }}
                        style={{ originX: '100px', originY: '100px' }}
                    >
                        {/* Agulha */}
                        <path d="M 96 100 L 100 25 L 104 100 Z" fill="var(--color-ink)" />
                        {/* Parafuso central */}
                        <circle cx="100" cy="100" r="8" fill="var(--color-ink)" />
                        <circle cx="100" cy="100" r="3" fill="var(--color-bg)" />
                    </motion.g>
                </svg>

                {/* Center Label inside Semicircle */}
                <div className="absolute bottom-2 flex flex-col items-center">
                    <span className={`font-mono text-4xl font-black ${colorClass} tracking-tighter drop-shadow-sm`}>
                        {value.toFixed(1)}<span className="text-xl">%</span>
                    </span>
                </div>
            </div>

            <div className="mt-4 flex flex-col items-center border-t-2 border-[var(--color-ink)] border-dashed pt-4 w-full">
                <span className="font-mono text-xs font-bold uppercase tracking-widest text-[var(--color-ink)] opacity-70">
                    {label}
                </span>
                <div className="flex space-x-4 mt-2">
                    <div className="flex items-center text-[10px] font-black uppercase text-red-500"><span className="w-2 h-2 bg-red-500 mr-1"></span> &lt; 70%</div>
                    <div className="flex items-center text-[10px] font-black uppercase text-amber-500"><span className="w-2 h-2 bg-amber-500 mr-1"></span> 70-89%</div>
                    <div className="flex items-center text-[10px] font-black uppercase text-emerald-500"><span className="w-2 h-2 bg-emerald-500 mr-1"></span> &ge; 90%</div>
                </div>
            </div>
        </div>
    );
}
