# Tag Management System

## Overview
Comprehensive tag management system with colors for organizing passwords in collections.

## Features

### 1. Tag Definition
- Tags are defined at the collection level in `PasswoodCollection.tags`
- Each tag has:
  - `id`: Unique identifier (UUID)
  - `name`: Display name
  - `color`: Hex color code

### 2. Tags Dialog
- Access via "Manage Tags" in collection options (three-dots menu)
- Add new tags with default color
- Rename tags inline (click name to edit, Enter to save)
- Change tag colors (click color circle to open color picker)
- Delete tags
- Changes saved to collection on dialog close

### 3. Tag Picker
- Used in password entry dialog
- Shows selected tags as colored chips
- Click X on chip to remove tag
- Click "+ Tag" button to add tags from dropdown
- Only shows unselected tags in dropdown

### 4. Tag Display
- Password entries show tags as colored chips
- Colors from tag definition applied automatically
- Tags displayed in expanded entry section

### 5. Tag Filtering
- TagFilter component (still uses string names for filtering)
- Click tag to filter, click again to remove filter

## Data Flow

### Storage
```typescript
// Collection level
interface PasswoodCollection {
  tags?: Tag[];  // Centralized tag definitions
  passwords: PasswoodPassword[];
}

interface Tag {
  id: string;
  name: string;
  color: string; // hex code
}

// Password level (backward compatible)
interface PasswoodPassword {
  tags?: string[]; // Still stores tag names
}
```

### Tag Resolution
1. Password stores tag names (`string[]`)
2. Display components resolve names to Tag objects via `collection.tags`
3. EntryDialog converts names ↔ IDs internally
4. Colors automatically applied from tag definitions

## Migration
Existing collections work without modification:
- Passwords keep string[] tags
- Empty `collection.tags` array means no colors (falls back to neutral)
- User can create tag definitions for coloring existing tag names

## Components

### TagsDialog.tsx
- CRUD operations for collection tags
- Color picker integration
- Inline rename functionality
- Animated with Radix Dialog + Framer Motion

### TagPicker.tsx
- Tag selection component
- Colored chip display
- Dropdown with available tags
- Used in EntryDialog

### Updated Components
- **PasswordEntry.tsx**: Displays colored tags
- **EntryDialog.tsx**: Uses TagPicker instead of text input
- **PasswordList.tsx**: Passes availableTags to entries
- **EditorHeader.tsx**: Added "Manage Tags" option
- **PasswordFileEditor.tsx**: Manages tag state and dialogs

## Color Palette
Default colors (16 options):
- Red (#ef4444)
- Orange (#f97316)
- Amber (#f59e0b)
- Yellow (#eab308)
- Lime (#84cc16)
- Green (#22c55e)
- Emerald (#10b981)
- Teal (#14b8a6)
- Cyan (#06b6d4)
- Sky (#0ea5e9)
- Blue (#3b82f6)
- Indigo (#6366f1)
- Violet (#8b5cf6)
- Purple (#a855f7)
- Fuchsia (#d946ef)
- Pink (#ec4899)

Users can also use custom colors via color input.
