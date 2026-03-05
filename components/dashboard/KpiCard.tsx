import React from 'react';
import { LucideIcon } from 'lucide-react';

interface KpiCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: LucideIcon;
    variant?: 'ink' | 'accent' | 'emerald' | 'amber' | 'red';
    className?: string;
}

const variantStyles = {
    ink: {
        bg: 'bg-white',
        border: 'border-[var(--color-ink)]',
        iconBg: 'bg-[var(--color-bg)]',
        iconColor: 'text-[var(--color-ink)]',
        valueColor: 'text-[var(--color-ink)]',
        shadow: 'shadow-[4px_4px_0px_0px_var(--color-ink)]',
    },
    accent: {
        bg: 'bg-white',
        border: 'border-[var(--color-accent)]',
        iconBg: 'bg-[var(--color-accent)]/10',
        iconColor: 'text-[var(--color-accent)]',
        valueColor: 'text-[var(--color-accent)]',
        shadow: 'shadow-[4px_4px_0px_0px_var(--color-accent)]',
    },
    emerald: {
        bg: 'bg-white',
        border: 'border-emerald-600',
        iconBg: 'bg-emerald-50',
        iconColor: 'text-emerald-600',
        valueColor: 'text-emerald-600',
        shadow: 'shadow-[4px_4px_0px_0px_#059669]',
    },
    amber: {
        bg: 'bg-white',
        border: 'border-amber-500',
        iconBg: 'bg-amber-50',
        iconColor: 'text-amber-500',
        valueColor: 'text-amber-500',
        shadow: 'shadow-[4px_4px_0px_0px_#f59e0b]',
    },
    red: {
        bg: 'bg-white',
        border: 'border-red-600',
        iconBg: 'bg-red-50',
        iconColor: 'text-red-600',
        valueColor: 'text-red-600',
        shadow: 'shadow-[4px_4px_0px_0px_#dc2626]',
    }
};

export function KpiCard({ title, value, subtitle, icon: Icon, variant = 'ink', className = '' }: KpiCardProps) {
    const styles = variantStyles[variant];

    return (
        <div className={`border-4 ${styles.border} ${styles.bg} ${styles.shadow} p-5 flex flex-col justify-between transition-transform hover:-translate-y-1 ${className}`}>
            <div className="flex justify-between items-start mb-4">
                <h3 className="font-mono text-xs font-bold uppercase tracking-widest text-opacity-70 text-[var(--color-ink)]">
                    {title}
                </h3>
                <div className={`p-2 border-2 ${styles.border} ${styles.iconBg}`}>
                    <Icon className={`w-5 h-5 ${styles.iconColor}`} />
                </div>
            </div>

            <div>
                <div className={`font-mono text-4xl font-black ${styles.valueColor} tracking-tighter`}>
                    {value}
                </div>
                {subtitle && (
                    <div className="mt-2 text-[10px] font-bold uppercase tracking-widest text-[var(--color-ink)] opacity-60">
                        {subtitle}
                    </div>
                )}
            </div>
        </div>
    );
}
