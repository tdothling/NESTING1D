import React from 'react';

interface ChartCardProps {
    title: string;
    subtitle?: string;
    children: React.ReactNode;
    darkHeader?: boolean;
    className?: string;
}

export function ChartCard({ title, subtitle, children, darkHeader = false, className = '' }: ChartCardProps) {
    return (
        <div className={`bg-white border-4 border-[var(--color-ink)] shadow-[8px_8px_0px_0px_var(--color-ink)] flex flex-col ${className}`}>
            <div className={`px-6 py-4 border-b-4 border-[var(--color-ink)] flex items-center justify-between ${darkHeader ? 'bg-[var(--color-ink)] text-white' : 'bg-[var(--color-bg)] text-[var(--color-ink)]'}`}>
                <div>
                    <h3 className={`text-lg font-black uppercase tracking-widest ${darkHeader ? 'text-white' : 'text-[var(--color-ink)]'}`}>
                        {title}
                    </h3>
                    {subtitle && (
                        <p className={`text-xs font-bold uppercase tracking-widest ${darkHeader ? 'opacity-80 text-white' : 'opacity-60 text-[var(--color-ink)]'}`}>
                            {subtitle}
                        </p>
                    )}
                </div>
                {!darkHeader && (
                    <div className="w-12 h-2 bg-[var(--color-accent)] hidden sm:block"></div>
                )}
            </div>
            <div className="p-6 flex-1 min-h-0">
                {children}
            </div>
        </div>
    );
}
