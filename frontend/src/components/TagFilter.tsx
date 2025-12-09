import type { Tag } from '../cryptor';

interface TagFilterProps {
    availableTags: Tag[];
    selectedTags: Set<string>;
    onToggleTag: (tagName: string) => void;
    onClearFilters: () => void;
    filteredCount: number;
}

export default function TagFilter({
    availableTags,
    selectedTags,
    onToggleTag,
    onClearFilters,
    filteredCount
}: TagFilterProps) {
    if (availableTags.length === 0) {
        return null;
    }

    return (
        <div className="mb-6 flex-shrink-0">
            <div className="flex flex-wrap gap-2">
                {availableTags.map((tag) => {
                    const isSelected = selectedTags.has(tag.name);
                    return (
                        <button
                            key={tag.id}
                            onClick={() => onToggleTag(tag.name)}
                            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${isSelected
                                    ? 'text-white shadow-lg scale-105'
                                    : 'text-white opacity-60 hover:opacity-100'
                                }`}
                            style={{ backgroundColor: tag.color }}
                        >
                            {tag.name}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
