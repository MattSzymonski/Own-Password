import { Button } from '@/components/animate-ui/components/buttons/button';

interface TagFilterProps {
    allTags: string[];
    selectedTags: Set<string>;
    onToggleTag: (tag: string) => void;
    onClearFilters: () => void;
    filteredCount: number;
}

export default function TagFilter({
    allTags,
    selectedTags,
    onToggleTag,
    onClearFilters,
    filteredCount
}: TagFilterProps) {
    if (allTags.length === 0) {
        return null;
    }

    return (
        <div className="mb-6 flex-shrink-0">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-neutral-300">Filter by tags:</h3>
                {selectedTags.size > 0 && (
                    <Button
                        onClick={onClearFilters}
                        variant="ghost"
                        className="text-xs text-neutral-400 hover:text-neutral-50 underline h-auto p-0"
                    >
                        Clear filters
                    </Button>
                )}
            </div>
            <div className="flex flex-wrap gap-2">
                {allTags.map((tag) => (
                    <Button
                        key={tag}
                        onClick={() => onToggleTag(tag)}
                        variant={selectedTags.has(tag) ? 'default' : 'secondary'}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium h-auto ${selectedTags.has(tag)
                            ? 'bg-neutral-50 text-neutral-950 shadow-lg'
                            : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700 border border-neutral-700'
                            }`}
                    >
                        {tag}
                    </Button>
                ))}
            </div>
        </div>
    );
}
