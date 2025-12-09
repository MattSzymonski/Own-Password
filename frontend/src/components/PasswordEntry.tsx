import { useState } from 'react';
import { Eye, EyeOff, ChevronDown, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { PasswoodPassword, Tag } from '../cryptor';
import { Button } from '@/components/animate-ui/components/buttons/button';
import { CopyButton } from '@/components/animate-ui/components/buttons/copy';

interface PasswordEntryProps {
    password: PasswoodPassword;
    availableTags: Tag[];
    onEdit: (password: PasswoodPassword) => void;
    onDelete: (id: string) => void;
}

export default function PasswordEntry({ password, availableTags, onEdit, onDelete }: PasswordEntryProps) {
    const [showPassword, setShowPassword] = useState(false);
    const [openDropdown, setOpenDropdown] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${day}.${month}.${year} ${hours}:${minutes}`;
    };

    // Map tag names to Tag objects with colors
    const passwordTags = password.tags
        ?.map(tagName => availableTags.find(t => t.name === tagName))
        .filter((tag): tag is Tag => tag !== undefined) || [];

    return (
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl">
            {/* Header row with expand button, title, and options */}
            <div
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center gap-3 p-5 cursor-pointer"
            >
                <Button
                    variant="ghost"
                    size="icon-sm"
                    className="text-neutral-400 hover:text-neutral-50 hover:bg-neutral-800 flex-shrink-0 pointer-events-none"
                >
                    {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </Button>

                <div className="flex-1 min-w-0">
                    <h4 className="text-xl font-semibold text-neutral-50">
                        {password.title}
                    </h4>
                </div>

                <div className="relative flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                    <Button
                        onClick={() => setOpenDropdown(!openDropdown)}
                        variant="ghost"
                        size="icon-sm"
                        className="text-neutral-400 hover:text-neutral-50 hover:bg-neutral-800"
                    >
                        ⋯
                    </Button>

                    <AnimatePresence>
                        {openDropdown && (
                            <>
                                <div
                                    className="fixed inset-0 z-10"
                                    onClick={() => setOpenDropdown(false)}
                                />
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                    transition={{ duration: 0.15, ease: 'easeOut' }}
                                    className="absolute right-0 mt-2 w-40 bg-neutral-900 border border-neutral-700 rounded-lg shadow-xl z-20"
                                >
                                    <Button
                                        onClick={() => {
                                            setOpenDropdown(false);
                                            onEdit(password);
                                        }}
                                        variant="ghost"
                                        className="w-full px-4 py-2.5 text-left text-neutral-400 hover:text-neutral-50 hover:bg-transparent rounded-t-lg flex items-center gap-2 h-auto justify-start"
                                    >
                                        <span>Edit</span>
                                    </Button>
                                    <Button
                                        onClick={() => {
                                            setOpenDropdown(false);
                                            onDelete(password.id);
                                        }}
                                        variant="ghost"
                                        className="w-full px-4 py-2.5 text-left text-red-400 hover:text-red-300 hover:bg-transparent rounded-b-lg flex items-center gap-2 h-auto justify-start"
                                    >
                                        <span>Delete</span>
                                    </Button>
                                </motion.div>
                            </>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Expanded section */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.15, ease: 'easeInOut' }}
                        className="overflow-hidden"
                    >
                        <div className="px-[32px] pb-5 pt-4 border-t border-neutral-800 space-y-3">
                            {/* Login */}
                            {password.login && (
                                <div className="flex items-center justify-between py-2">
                                    <div className="flex-1 min-w-0">
                                        <div className="text-xs text-neutral-400 mb-1">Login</div>
                                        <div className="text-neutral-50 font-medium truncate">{password.login}</div>
                                    </div>
                                    <CopyButton
                                        content={password.login}
                                        variant="ghost"
                                        size="sm"
                                        className="text-neutral-400 hover:text-neutral-50 hover:bg-neutral-800 flex-shrink-0 ml-3"
                                    />
                                </div>
                            )}

                            {/* Password */}
                            <div className="flex items-center justify-between py-2">
                                <div className="flex-1 min-w-0">
                                    <div className="text-xs text-neutral-400 mb-1">Password</div>
                                    <code className="text-neutral-50 font-mono text-sm block truncate">
                                        {showPassword ? password.password : '••••••••••••'}
                                    </code>
                                </div>
                                <div className="flex gap-2 flex-shrink-0 ml-3">
                                    <Button
                                        onClick={() => setShowPassword(!showPassword)}
                                        variant="ghost"
                                        size="icon-sm"
                                        className="text-neutral-400 hover:text-neutral-50 hover:bg-neutral-800"
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </Button>
                                    <CopyButton
                                        content={password.password}
                                        variant="ghost"
                                        size="sm"
                                        className="text-neutral-400 hover:text-neutral-50 hover:bg-neutral-800"
                                    />
                                </div>
                            </div>

                            {/* URL */}
                            {password.url && (
                                <div className="py-2">
                                    <div className="text-xs text-neutral-400 mb-1">URL</div>
                                    <a
                                        href={password.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-400 hover:text-blue-300 text-sm block truncate"
                                    >
                                        {password.url}
                                    </a>
                                </div>
                            )}

                            {/* Notes */}
                            {password.notes && (
                                <div className="py-2">
                                    <div className="text-xs text-neutral-400 mb-1">Notes</div>
                                    <p className="text-neutral-300 text-sm">{password.notes}</p>
                                </div>
                            )}

                            {/* Tags */}
                            {passwordTags.length > 0 && (
                                <div className="py-2">
                                    <div className="text-xs text-neutral-400 mb-2">Tags</div>
                                    <div className="flex flex-wrap gap-2">
                                        {passwordTags.map((tag) => (
                                            <span
                                                key={tag.id}
                                                className="px-3 py-1 text-white text-xs rounded-full font-medium"
                                                style={{ backgroundColor: tag.color }}
                                            >
                                                {tag.name}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="text-xs text-neutral-500 pt-2">
                                Modified: {formatDate(password.modified)}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
