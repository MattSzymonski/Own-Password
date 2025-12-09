import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import type { PasswoodPassword } from '../cryptor';
import { Button } from '@/components/animate-ui/components/buttons/button';
import { CopyButton } from '@/components/animate-ui/components/buttons/copy';

interface PasswordEntryProps {
    password: PasswoodPassword;
    onEdit: (password: PasswoodPassword) => void;
    onDelete: (id: string) => void;
}

export default function PasswordEntry({ password, onEdit, onDelete }: PasswordEntryProps) {
    const [showPassword, setShowPassword] = useState(false);
    const [openDropdown, setOpenDropdown] = useState(false);

    return (
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
            <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                    <h4 className="text-xl font-semibold text-neutral-50 mb-2">
                        {password.title}
                    </h4>
                    {password.url && (
                        <a
                            href={password.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:text-blue-300 text-sm truncate block mb-3"
                        >
                            {password.url}
                        </a>
                    )}
                </div>
                <div className="relative">
                    <Button
                        onClick={() => setOpenDropdown(!openDropdown)}
                        variant="ghost"
                        size="icon-sm"
                        className="text-neutral-400 hover:text-neutral-50"
                    >
                        ⋯
                    </Button>

                    {openDropdown && (
                        <>
                            <div
                                className="fixed inset-0 z-10"
                                onClick={() => setOpenDropdown(false)}
                            />
                            <div className="absolute right-0 mt-2 w-40 bg-neutral-900 border border-neutral-700 rounded-lg shadow-xl z-20">
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
                            </div>
                        </>
                    )}
                </div>
            </div>

            <div className="space-y-3">
                {/* Login */}
                {password.login && (
                    <div className="flex items-center justify-between py-2">
                        <div className="flex-1">
                            <div className="text-xs text-neutral-400 mb-1">Login</div>
                            <div className="text-neutral-50 font-medium">{password.login}</div>
                        </div>
                        <CopyButton
                            content={password.login}
                            variant="ghost"
                            size="sm"
                            className="text-neutral-400 hover:text-neutral-50 hover:bg-neutral-800"
                        />
                    </div>
                )}

                {/* Password */}
                <div className="flex items-center justify-between py-2 border-t border-neutral-800">
                    <div className="flex-1">
                        <div className="text-xs text-neutral-400 mb-1">Password</div>
                        <code className="text-neutral-50 font-mono text-sm">
                            {showPassword ? password.password : '••••••••••••'}
                        </code>
                    </div>
                    <div className="flex gap-2">
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

                {/* Notes */}
                {password.notes && (
                    <div className="py-2 border-t border-neutral-800">
                        <div className="text-xs text-neutral-400 mb-1">Notes</div>
                        <p className="text-neutral-300 text-sm">{password.notes}</p>
                    </div>
                )}

                {/* Tags */}
                {password.tags && password.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2 border-t border-neutral-800">
                        {password.tags.map((tag, idx) => (
                            <span
                                key={idx}
                                className="px-3 py-1 bg-neutral-800 text-neutral-300 text-xs rounded-full border border-neutral-700"
                            >
                                {tag}
                            </span>
                        ))}
                    </div>
                )}

                <div className="text-xs text-neutral-500 pt-2 border-t border-neutral-800">
                    Modified: {new Date(password.modified).toLocaleString()}
                </div>
            </div>
        </div>
    );
}
