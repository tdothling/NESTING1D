'use client';

import { useState, useEffect, useRef } from 'react';
import { searchProfiles, SteelProfile } from '@/lib/steel-catalog';
import { Search } from 'lucide-react';

interface ProfileAutocompleteProps {
    value: string;
    onSelect: (profile: SteelProfile) => void;
    onChange: (value: string) => void;
    className?: string;
}

export function ProfileAutocomplete({ value, onSelect, onChange, className }: ProfileAutocompleteProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [results, setResults] = useState<SteelProfile[]>([]);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Basic search on value change
        if (isOpen) {
            setResults(searchProfiles(value));
        }
    }, [value, isOpen]);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative w-full" ref={containerRef}>
            <div className="relative">
                <input
                    type="text"
                    value={value}
                    onChange={(e) => {
                        onChange(e.target.value);
                        setIsOpen(true);
                    }}
                    onFocus={() => {
                        setIsOpen(true);
                        setResults(searchProfiles(value));
                    }}
                    placeholder="Ex: W 200x15.0"
                    className={className || "block w-full bg-transparent border-2 border-transparent hover:border-[var(--color-ink)] focus:border-[var(--color-ink)] focus:outline-none focus:ring-0 sm:text-base font-mono font-black uppercase text-[var(--color-ink)] transition-colors p-2"}
                />
                <Search className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-ink)] opacity-50 pointer-events-none" />
            </div>

            {isOpen && results.length > 0 && (
                <div className="absolute z-50 w-full mt-1 border-2 border-[var(--color-ink)] bg-white max-h-60 overflow-auto shadow-xl">
                    <ul className="divide-y-2 divide-[var(--color-ink)] divide-opacity-10">
                        {results.map((profile) => (
                            <li
                                key={profile.id}
                                onClick={() => {
                                    onSelect(profile);
                                    setIsOpen(false);
                                }}
                                className="p-3 hover:bg-[var(--color-ink)] hover:text-white cursor-pointer transition-colors group"
                            >
                                <div className="flex justify-between items-center">
                                    <span className="font-mono font-black uppercase tracking-widest text-sm">{profile.name}</span>
                                    <span className="font-mono text-xs opacity-70 group-hover:opacity-100">{profile.weightKgM} kg/m</span>
                                </div>
                                <div className="font-mono text-[10px] opacity-50 mt-1 uppercase">
                                    {profile.category} • {profile.supplier || 'Padrão'}
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
