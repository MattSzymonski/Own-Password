import { Plus } from 'lucide-react';
import { Button } from '@/components/animate-ui/components/buttons/button';
import type { PasswoodPassword } from '../cryptor';
import PasswordEntry from './PasswordEntry';
import TagFilter from './TagFilter';
import { useState, useRef, useEffect } from 'react';

interface PasswordListProps {
    passwords: PasswoodPassword[];
    searchQuery: string;
    allTags: string[];
    selectedTags: Set<string>;
    onSearchChange: (query: string) => void;
    onToggleTag: (tag: string) => void;
    onClearFilters: () => void;
    onAddNew: () => void;
    onEdit: (password: PasswoodPassword) => void;
    onDelete: (id: string) => void;
}

export default function PasswordList({
    passwords,
    searchQuery,
    allTags,
    selectedTags,
    onSearchChange,
    onToggleTag,
    onClearFilters,
    onAddNew,
    onEdit,
    onDelete
}: PasswordListProps) {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [showTopGradient, setShowTopGradient] = useState(false);
    const [showBottomGradient, setShowBottomGradient] = useState(false);

    const handleScroll = () => {
        const container = scrollContainerRef.current;
        if (!container) return;

        const { scrollTop, scrollHeight, clientHeight } = container;

        // Show top gradient if scrolled down
        setShowTopGradient(scrollTop > 0);

        // Show bottom gradient if not scrolled to bottom
        setShowBottomGradient(scrollTop + clientHeight < scrollHeight - 1);
    };

    useEffect(() => {
        const container = scrollContainerRef.current;
        if (!container) return;

        // Check initial state
        handleScroll();

        // Add scroll listener
        container.addEventListener('scroll', handleScroll);

        // Check on resize
        const resizeObserver = new ResizeObserver(handleScroll);
        resizeObserver.observe(container);

        return () => {
            container.removeEventListener('scroll', handleScroll);
            resizeObserver.disconnect();
        };
    }, [passwords]);

    return (
        <div className="bg-neutral-900 rounded-2xl p-6 shadow-xl border border-neutral-800 h-full flex flex-col">
            <div className="flex justify-between items-center mb-6 flex-shrink-0">
                <h3 className="text-2xl font-semibold text-neutral-50">
                    Passwords
                </h3>
                <Button
                    onClick={onAddNew}
                    className="px-6 py-3 bg-neutral-50 hover:bg-neutral-200 text-neutral-950 rounded-lg font-medium shadow-lg flex items-center gap-2"
                >
                    <Plus className="w-5 h-5" />
                    Add New Password
                </Button>
            </div>

            {/* Search Bar */}
            <div className="mb-4 flex-shrink-0">
                <input
                    type="text"
                    placeholder="Search passwords..."
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="w-full px-4 py-3 bg-neutral-950 border border-neutral-700 rounded-lg text-neutral-50 placeholder-neutral-500 focus:outline-none focus:border-neutral-50"
                />
            </div>

            {/* Tags Filter */}
            <TagFilter
                allTags={allTags}
                selectedTags={selectedTags}
                onToggleTag={onToggleTag}
                onClearFilters={onClearFilters}
                filteredCount={passwords.length}
            />

            {passwords.length === 0 ? (
                <div className="text-center py-12 text-neutral-400 flex-1 flex items-center justify-center">
                    {searchQuery || selectedTags.size > 0
                        ? 'No passwords match your filters'
                        : 'No passwords yet. Add your first password!'}
                </div>
            ) : (
                <div className="relative flex-1 overflow-hidden">
                    {/* Top gradient overlay */}
                    {showTopGradient && (
                        <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-neutral-900 to-transparent pointer-events-none z-10" />
                    )}

                    {/* Password list */}
                    <div
                        ref={scrollContainerRef}
                        className="space-y-3 overflow-y-auto pr-2 h-full"
                    >
                        {passwords.map((password) => (
                            <PasswordEntry
                                key={password.id}
                                password={password}
                                onEdit={onEdit}
                                onDelete={onDelete}
                            />
                        ))}
                    </div>

                    {/* Bottom gradient overlay */}
                    {showBottomGradient && (
                        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-neutral-900 to-transparent pointer-events-none z-10" />
                    )}
                </div>
            )}
        </div>
    );
}
