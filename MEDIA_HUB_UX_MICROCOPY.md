# Media Hub - UX Microcopy Guide

## 📝 Overview

This document contains all user-facing text, labels, messages, and microcopy used in the redesigned Media Production Hub. Use this as a reference for consistency across the application.

---

## 🏷️ Labels & Headers

### Page Title
```
📹 Media Production Hub
```

### Section Headers
```
Script Categories
Asset Metadata
Review Workflow
Assign Client (Project)
```

### Filter Labels
```
📁 Project
⚡ Workflow Status
🎯 Script Category
```

### Button Labels
```
Sync with Google Drive
Reset Filters
Preview
Assign
Mark Done
Close
```

---

## 📋 Dropdown Options

### Project Filter
```
📥 Unassigned Media (Inbox)
🗂️ All Media
[Client Name 1]
[Client Name 2]
...
```

### Workflow Status Filter
```
All Statuses
🔴 RAW (Awaiting Review)
🟡 REVIEWED (Changes Made)
🟢 APPROVED
```

### Script Category Filter (Removed - Now Panels)
```
All Categories
Unassigned
Social Media
Service Promotion
Testimonial
Educational
Behind the Scene (BTS)
```

---

## 🎯 Script Panel Labels

### Panel Names
```
🗂️ All Media
⚠️ Unassigned
✨ Social Media
📢 Service Promotion
💬 Testimonial
🎓 Educational
📷 Behind the Scene
```

### Panel Counters
```
[count] items
[count] item  (singular)
```

### Drop Zone Message
```
📥 Drop here to assign
```

---

## 💬 Toast Messages

### Success Messages
```
✅ Script updated to [Script Type]
✅ Successfully assigned to [Client Name]
✅ Sync complete. Added [count] new assets.
✅ Status updated to [Status]
```

### Error Messages
```
❌ Failed to update script type
❌ Failed to assign: [error message]
❌ Sync failed: [error message]
❌ Error connecting to server
❌ Network error. Please try again.
❌ Forbidden: Only Admins and Managers can update script types
```

### Info Messages
```
ℹ️ Please authorize Google Drive in the popup window and then try Sync again.
ℹ️ Please select a client first.
ℹ️ Please select a script type.
```

---

## 🚫 Empty States

### No Media Found
```
Heading: No media files found
Subtext: Try adjusting your filters or sync with Google Drive
Icon: AlertCircle (gray)
```

### Loading State
```
Spinner + Text: Loading media from Drive...
```

### Empty Script Category
```
No items in this category yet
Drag media here to get started
```

---

## ⚠️ Warning Messages

### View-Only Banner (Employee/Team Leader)
```
⚠️ View Only: Only Admins and Managers can assign scripts via drag & drop.
```

### Authorization Required
```
Google Drive not authorized. Please visit /auth-url first.
```

---

## 🎨 Badge Text

### Status Badges
```
RAW
REVIEWED
APPROVED
```

### Script Badges
```
Unassigned
Social Media
Service Promotion
Testimonial
Educational
Behind the Scene (BTS)
```

---

## 🖱️ Hover Text & Tooltips

### Drag Indicator
```
🖱️ Drag to assign
```

### Media Card Metadata
```
📁 [Project Name]
📅 [Shoot Date or "N/A"]
🔖 [Script Type]
```

---

## 📊 Metadata Labels

### Asset Metadata Section
```
Upload Date: [YYYY-MM-DD]
Mime Type: [video/mp4, image/jpeg, etc.]
Owner: [Crew Member Name or "System"]
Status: [RAW/REVIEWED/APPROVED]
Script Type: [Script Category]
```

### Preview Modal
```
Project: [Project Name]
Ref: [Project Name]
```

---

## 🎯 Call-to-Action Text

### Primary Actions
```
Sync with Google Drive
Preview
Assign
Reset Filters
```

### Secondary Actions
```
Close
Cancel
```

---

## 📱 Responsive Text

### Mobile View
```
Tap to select
Tap to filter
Swipe to view more
```

---

## 🔒 Permission Messages

### Forbidden (403)
```
Forbidden: Only Admins and Managers can update script types
```

### Unauthorized (401)
```
Authentication required. Please log in.
```

### Not Found (404)
```
Media asset not found
```

---

## 🎓 Helper Text

### Drag & Drop Instructions
```
Drag media cards to script panels to assign categories
Click a script panel to filter media by that category
```

### Filter Instructions
```
Use filters to narrow down media by project, status, or script type
Click "Reset Filters" to clear all selections
```

### Sync Instructions
```
Click "Sync with Google Drive" to fetch new media from your Drive folder
New media will appear as "Unassigned" and can be categorized
```

---

## 🎨 Accessibility Labels (aria-label)

### Buttons
```
aria-label="Sync media with Google Drive"
aria-label="Reset all filters"
aria-label="Preview media"
aria-label="Close preview modal"
aria-label="Assign to client"
```

### Dropdowns
```
aria-label="Filter by project"
aria-label="Filter by workflow status"
aria-label="Select client for assignment"
```

### Script Panels
```
aria-label="All media - [count] items"
aria-label="Unassigned media - [count] items"
aria-label="Social Media - [count] items"
aria-label="Service Promotion - [count] items"
aria-label="Testimonial - [count] items"
aria-label="Educational - [count] items"
aria-label="Behind the Scene - [count] items"
```

---

## 🌐 Internationalization (i18n) Keys

If implementing multi-language support, use these keys:

```javascript
{
  "media.hub.title": "Media Production Hub",
  "media.sync.button": "Sync with Google Drive",
  "media.filter.project": "Project",
  "media.filter.status": "Workflow Status",
  "media.filter.reset": "Reset Filters",
  
  "media.script.all": "All Media",
  "media.script.unassigned": "Unassigned",
  "media.script.social": "Social Media",
  "media.script.promotion": "Service Promotion",
  "media.script.testimonial": "Testimonial",
  "media.script.educational": "Educational",
  "media.script.bts": "Behind the Scene",
  
  "media.status.raw": "RAW",
  "media.status.reviewed": "REVIEWED",
  "media.status.approved": "APPROVED",
  
  "media.toast.success.script": "Script updated to {scriptType}",
  "media.toast.success.assign": "Successfully assigned to {clientName}",
  "media.toast.error.generic": "Error connecting to server",
  "media.toast.error.forbidden": "Forbidden: Only Admins and Managers can update script types",
  
  "media.empty.title": "No media files found",
  "media.empty.subtitle": "Try adjusting your filters or sync with Google Drive",
  "media.loading": "Loading media from Drive...",
  
  "media.viewonly.banner": "View Only: Only Admins and Managers can assign scripts via drag & drop.",
  
  "media.drag.indicator": "Drag to assign",
  "media.drop.message": "Drop here to assign",
  
  "media.preview.button": "Preview",
  "media.assign.button": "Assign",
  "media.close.button": "Close"
}
```

---

## 📐 Character Limits

| Field                | Min | Max | Notes                          |
|----------------------|-----|-----|--------------------------------|
| Filename             | 1   | 255 | Truncate with ellipsis in UI   |
| Project Name         | 1   | 100 | -                              |
| Script Type          | 1   | 50  | Predefined values              |
| Toast Message        | 10  | 200 | Keep concise                   |
| Error Message        | 10  | 300 | Be descriptive                 |
| Helper Text          | 20  | 500 | Clear and actionable           |

---

## 🎯 Tone & Voice Guidelines

### General Tone
- **Friendly**: Use conversational language
- **Clear**: Avoid jargon, be direct
- **Helpful**: Guide users to solutions
- **Positive**: Encourage action, celebrate success

### Success Messages
- ✅ Use positive language
- ✅ Confirm the action taken
- ✅ Use checkmark emoji or icon
- Example: "✅ Script updated to Social Media"

### Error Messages
- ❌ Be specific about what went wrong
- ❌ Suggest a solution when possible
- ❌ Use cross emoji or icon
- Example: "❌ Failed to assign: Network error. Please check your connection and try again."

### Helper Text
- ℹ️ Be instructional
- ℹ️ Use step-by-step language
- ℹ️ Use info icon
- Example: "ℹ️ Drag media cards to script panels to assign categories"

### Empty States
- 🔍 Explain why it's empty
- 🔍 Suggest next steps
- 🔍 Use relevant icon
- Example: "No media files found. Try adjusting your filters or sync with Google Drive."

---

## 🎨 Emoji Usage Guide

| Context              | Emoji | Usage                          |
|----------------------|-------|--------------------------------|
| Success              | ✅    | Toast messages, confirmations  |
| Error                | ❌    | Error messages, failures       |
| Warning              | ⚠️    | Warnings, cautions             |
| Info                 | ℹ️    | Helper text, tips              |
| Media/Video          | 🎬📹  | Media-related content          |
| Folder/Project       | 📁    | Project references             |
| Calendar/Date        | 📅    | Date fields                    |
| Bookmark/Tag         | 🔖    | Script types, categories       |
| Sync/Refresh         | 🔄    | Sync actions                   |
| All/Grid             | 🗂️    | All media view                 |
| Social Media         | ✨    | Social Media category          |
| Promotion            | 📢    | Service Promotion category     |
| Testimonial          | 💬    | Testimonial category           |
| Educational          | 🎓    | Educational category           |
| BTS/Camera           | 📷    | Behind the Scene category      |
| Unassigned           | ⚠️    | Unassigned category            |
| Drag                 | 🖱️    | Drag indicators                |
| Drop                 | 📥    | Drop zones                     |

---

## ✍️ Writing Examples

### Good Examples ✅

```
"Drag media cards to script panels to assign categories"
→ Clear, actionable, uses simple language

"Script updated to Social Media"
→ Concise, confirms action

"No media files found. Try adjusting your filters or sync with Google Drive."
→ Explains issue, suggests solutions
```

### Bad Examples ❌

```
"Utilize the drag and drop functionality to categorize media assets"
→ Too formal, uses jargon

"Updated"
→ Too vague, doesn't confirm what was updated

"No results"
→ Doesn't explain why or what to do next
```

---

## 🔄 Version History

| Version | Date       | Changes                          |
|---------|------------|----------------------------------|
| 1.0     | 2026-02-02 | Initial microcopy documentation  |

---

**Document Owner**: UX Writing Team  
**Last Reviewed**: 2026-02-02  
**Next Review**: 2026-03-02
