# Media Hub Redesign - Component Structure & Wireframe

## 🎯 Overview

This document outlines the redesigned Media Production Hub with drag-and-drop script assignment functionality. The new design replaces dropdown-based bulk script assignment with an intuitive, visual drag-and-drop interface.

---

## 📐 Layout Structure

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 📹 Media Production Hub                          [Sync with Google Drive]   │
├─────────────────────────────────────────────────────────────────────────────┤
│ Filters:                                                                     │
│ [📁 Project ▼] [⚡ Workflow Status ▼] [🔄 Reset Filters]                    │
├──────────────────────────────────────────┬──────────────────────────────────┤
│                                          │                                  │
│  MEDIA GRID (Main Area)                  │  SCRIPT PANELS (Right Sidebar)  │
│                                          │                                  │
│  ┌──────┐ ┌──────┐ ┌──────┐             │  ┌──────────────────────────┐   │
│  │ 🎬  │ │ 🎬  │ │ 🎬  │             │  │ 🗂️ All Media          │   │
│  │ Card │ │ Card │ │ Card │             │  │ 42 items              │   │
│  │  1   │ │  2   │ │  3   │             │  └──────────────────────────┘   │
│  └──────┘ └──────┘ └──────┘             │                                  │
│                                          │  ┌──────────────────────────┐   │
│  ┌──────┐ ┌──────┐ ┌──────┐             │  │ ⚠️ Unassigned          │   │
│  │ 🎬  │ │ 🎬  │ │ 🎬  │             │  │ 12 items              │   │
│  │ Card │ │ Card │ │ Card │             │  │ 📥 Drop here          │   │
│  │  4   │ │  5   │ │  6   │             │  └──────────────────────────┘   │
│  └──────┘ └──────┘ └──────┘             │                                  │
│                                          │  ┌──────────────────────────┐   │
│  [Drag cards to script panels →]        │  │ ✨ Social Media        │   │
│                                          │  │ 8 items                │   │
│                                          │  │ 📥 Drop here          │   │
│                                          │  └──────────────────────────┘   │
│                                          │                                  │
│                                          │  ┌──────────────────────────┐   │
│                                          │  │ 📢 Service Promotion   │   │
│                                          │  │ 6 items                │   │
│                                          │  │ 📥 Drop here          │   │
│                                          │  └──────────────────────────┘   │
│                                          │                                  │
│                                          │  ┌──────────────────────────┐   │
│                                          │  │ 💬 Testimonial         │   │
│                                          │  │ 4 items                │   │
│                                          │  │ 📥 Drop here          │   │
│                                          │  └──────────────────────────┘   │
│                                          │                                  │
│                                          │  ┌──────────────────────────┐   │
│                                          │  │ 🎓 Educational         │   │
│                                          │  │ 7 items                │   │
│                                          │  │ 📥 Drop here          │   │
│                                          │  └──────────────────────────┘   │
│                                          │                                  │
│                                          │  ┌──────────────────────────┐   │
│                                          │  │ 📷 Behind the Scene    │   │
│                                          │  │ 5 items                │   │
│                                          │  │ 📥 Drop here          │   │
│                                          │  └──────────────────────────┘   │
│                                          │                                  │
└──────────────────────────────────────────┴──────────────────────────────────┘
```

---

## 🧩 Component Hierarchy

```
MediaDashboard (Main Component)
├── Header
│   ├── Title: "📹 Media Production Hub"
│   └── SyncButton: "Sync with Google Drive"
│
├── FilterBar
│   ├── ProjectFilter (Dropdown)
│   ├── WorkflowStatusFilter (Dropdown)
│   └── ResetFiltersButton
│
├── MainLayout (Flex Container)
│   ├── MediaGrid (Left Side - Flex: 1)
│   │   ├── ViewOnlyBanner (if Employee/Team Leader)
│   │   ├── LoadingSpinner (if loading)
│   │   ├── EmptyState (if no media)
│   │   └── MediaCard[] (Array of cards)
│   │       ├── Thumbnail
│   │       ├── PlayIcon (if video)
│   │       ├── StatusBadge (RAW/REVIEWED/APPROVED)
│   │       ├── ScriptBadge (Script type)
│   │       ├── DragIndicator (if Admin/Manager)
│   │       ├── Filename
│   │       ├── Metadata (Date, Script)
│   │       └── PreviewButton
│   │
│   └── ScriptPanels (Right Sidebar - Width: 320px, Sticky)
│       ├── SectionTitle: "Script Categories"
│       ├── AllMediaPanel (Filter: All)
│       ├── UnassignedPanel (Filter: Unassigned, Droppable)
│       └── ScriptTypePanel[] (Array of script panels)
│           ├── SocialMediaPanel (Droppable)
│           ├── ServicePromotionPanel (Droppable)
│           ├── TestimonialPanel (Droppable)
│           ├── EducationalPanel (Droppable)
│           └── BTSPanel (Droppable)
│
├── PreviewModal (Conditional)
│   ├── VideoPlayer (iframe)
│   ├── CloseButton
│   ├── Metadata
│   ├── WorkflowStatusButtons
│   └── ClientAssignment
│
└── DragOverlay (Conditional - shows dragged card preview)
```

---

## 🎨 Design Specifications

### Color Palette

| Script Category      | Primary Color | Gradient                                    |
|----------------------|---------------|---------------------------------------------|
| Social Media         | `#3b82f6`     | `linear-gradient(135deg, #3b82f6, #2563eb)` |
| Service Promotion    | `#8b5cf6`     | `linear-gradient(135deg, #8b5cf6, #7c3aed)` |
| Testimonial          | `#10b981`     | `linear-gradient(135deg, #10b981, #059669)` |
| Educational          | `#f59e0b`     | `linear-gradient(135deg, #f59e0b, #d97706)` |
| Behind the Scene     | `#ec4899`     | `linear-gradient(135deg, #ec4899, #db2777)` |
| Unassigned           | `#6b7280`     | Solid gray                                  |
| All Media            | `#6b7280`     | Solid gray                                  |

### Status Colors

| Status    | Color     |
|-----------|-----------|
| RAW       | `#e74c3c` |
| REVIEWED  | `#f39c12` |
| APPROVED  | `#27ae60` |

### Typography

- **Headings**: `font-weight: 700`, `color: #1f2937`
- **Body Text**: `font-weight: 500`, `color: #6b7280`
- **Labels**: `font-weight: 600`, `color: #374151`
- **Badges**: `font-weight: 700`, `text-transform: uppercase`, `letter-spacing: 0.5px`

### Spacing

- **Card Gap**: `20px`
- **Panel Gap**: `16px`
- **Section Padding**: `20px - 30px`
- **Card Padding**: `16px`
- **Panel Padding**: `16px`

### Border Radius

- **Cards**: `16px`
- **Panels**: `16px`
- **Buttons**: `8px`
- **Badges**: `20px` (pill shape)
- **Inputs**: `8px`

### Shadows

- **Card Default**: `0 4px 12px rgba(0,0,0,0.08)`
- **Card Hover**: `0 12px 24px rgba(0,0,0,0.15)`
- **Card Dragging**: `0 20px 40px rgba(0,0,0,0.3)`
- **Panel Default**: `0 2px 8px rgba(0,0,0,0.05)`
- **Panel Hover**: `0 6px 16px rgba(0,0,0,0.1)`
- **Panel Drop Zone**: `0 8px 24px [color]40`

---

## 🔄 Interaction Flow

### Drag & Drop Flow

```
1. User (Admin/Manager) hovers over media card
   └─> Card shows hover effect (shadow, translateY)
   └─> Cursor changes to 'grab'

2. User clicks and holds on media card
   └─> Card becomes semi-transparent (opacity: 0.5)
   └─> Drag overlay shows preview of card
   └─> Cursor changes to 'grabbing'

3. User drags card over script panels
   └─> Valid drop zones highlight with dashed border
   └─> Panel background pulses with animation
   └─> "Drop here to assign" message appears

4. User drops card on script panel
   └─> API call to update script_type
   └─> Success toast appears
   └─> Card script badge updates
   └─> Panel counter updates
   └─> Card returns to normal state

5. If drop fails
   └─> Error toast appears
   └─> Card returns to original position
```

### Filter Flow

```
1. User clicks on script panel (e.g., "Social Media")
   └─> Panel highlights with colored border
   └─> Media grid filters to show only "Social Media" items
   └─> URL updates with filter parameter (optional)

2. User clicks "All Media" panel
   └─> All filters clear
   └─> Media grid shows all items

3. User clicks "Reset Filters" button
   └─> All filters clear
   └─> Default filter (Unassigned) applies
```

---

## 📱 Responsive Design

### Desktop (> 1200px)
- Media Grid: 3-4 columns
- Script Panels: Fixed 320px width, sticky position
- Full layout side-by-side

### Tablet (768px - 1200px)
- Media Grid: 2-3 columns
- Script Panels: Fixed 280px width, sticky position
- Slightly reduced spacing

### Mobile (< 768px)
- Media Grid: 1-2 columns
- Script Panels: Move below media grid or collapsible drawer
- Stack layout vertically

---

## 🎭 States & Variations

### Media Card States

1. **Default**: Normal appearance
2. **Hover**: Elevated shadow, slight translateY
3. **Dragging**: Semi-transparent, drag overlay visible
4. **Selected** (for filtering): Highlighted border
5. **Disabled** (for Employee): No drag cursor, no hover effect

### Script Panel States

1. **Default**: White background, gray border
2. **Hover**: Slight translateX, elevated shadow
3. **Selected** (active filter): Colored background gradient, colored border
4. **Drop Zone Active**: Dashed colored border, pulsing background, "Drop here" message
5. **Disabled** (not droppable): No drop zone effects

---

## 🔌 API Integration

### Endpoints Used

| Endpoint                                | Method | Purpose                          |
|-----------------------------------------|--------|----------------------------------|
| `/api/media/assets`                     | GET    | Fetch media with filters         |
| `/api/media/assets/:id/script`          | PATCH  | Update script type (drag & drop) |
| `/api/media/assets/:id/status`          | PATCH  | Update workflow status           |
| `/api/media/assets/:id/project`         | PATCH  | Assign client/project            |
| `/api/media/sync`                       | POST   | Sync with Google Drive           |
| `/api/media/projects`                   | GET    | Get project list for filters     |
| `/api/clients?all=true`                 | GET    | Get client list for assignment   |

### Data Flow

```
Frontend (React)
    │
    ├─> Fetch media assets on mount
    │   └─> GET /api/media/assets?project=Unassigned
    │
    ├─> User drags card to script panel
    │   └─> PATCH /api/media/assets/:id/script
    │       └─> { script_type: "Social Media" }
    │
    ├─> Backend validates role (Admin/Manager)
    │   └─> If valid: Update database
    │   └─> If invalid: Return 403 Forbidden
    │
    └─> Frontend receives response
        └─> Success: Show toast, update UI
        └─> Error: Show error toast
```

---

## 🎯 Key Features

### ✅ Implemented

1. **Visual Script Panels** - Right sidebar with color-coded script categories
2. **Drag & Drop** - Intuitive drag-and-drop using @dnd-kit library
3. **Role-Based Permissions** - Only Admin/Manager can drag
4. **Visual Feedback** - Animations, toasts, counters, highlights
5. **Filtering** - Click panels to filter media by script type
6. **Empty States** - Informative messages when no media found
7. **Responsive Design** - Works on various screen sizes
8. **Toast Notifications** - Success/error feedback
9. **Script Counters** - Show item count per category
10. **Modern UI** - Gradients, shadows, micro-animations

### ❌ Removed

1. **Bulk Script Dropdown** - Removed from header
2. **Bulk Script Button** - Removed from header
3. **Individual Card Dropdowns** - Removed from media cards (for Employees, still view-only display)

### 🔄 Retained

1. **Bulk Client Assignment** - Still available in header
2. **Sync with Google Drive** - Still available in header
3. **Workflow Status Filters** - Still available in filter bar
4. **Project Filters** - Still available in filter bar
5. **Preview Modal** - Still available on card click
6. **Status Update** - Still available in preview modal
7. **Client Assignment** - Still available in preview modal

---

## 📊 Performance Considerations

1. **Lazy Loading** - Consider implementing for large media lists (100+ items)
2. **Virtualization** - Use react-window for very large lists
3. **Debounced Filtering** - Debounce filter changes to reduce re-renders
4. **Optimistic Updates** - Update UI immediately, rollback on error
5. **Memoization** - Use React.memo for MediaCard and ScriptPanel components

---

## 🚀 Future Enhancements

1. **Batch Drag & Drop** - Drag multiple cards at once
2. **Keyboard Shortcuts** - Assign scripts via keyboard
3. **Undo/Redo** - Undo script assignments
4. **Drag & Drop Reordering** - Reorder media within categories
5. **Custom Script Categories** - Allow admins to create custom categories
6. **Script Templates** - Pre-defined script templates
7. **Analytics Dashboard** - Show script distribution charts
8. **Bulk Actions** - Multi-select and bulk assign via drag & drop

---

**Document Version**: 1.0  
**Last Updated**: 2026-02-02  
**Author**: Antigravity AI
