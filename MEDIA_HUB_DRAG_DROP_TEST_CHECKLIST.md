# Media Hub Drag & Drop - Test Checklist

## ✅ Functional Testing

### Drag & Drop Functionality
- [ ] **Admin can drag media cards** - Verify Admin users can drag media cards
- [ ] **Manager can drag media cards** - Verify Manager users can drag media cards
- [ ] **Employee cannot drag** - Verify Employee users see view-only message and cannot drag
- [ ] **Team Leader cannot drag** - Verify Team Leader users see view-only message and cannot drag

### Script Assignment via Drag & Drop
- [ ] **Drag to Social Media** - Drag a media card to "Social Media" panel and verify script_type updates
- [ ] **Drag to Service Promotion** - Drag a media card to "Service Promotion" panel and verify script_type updates
- [ ] **Drag to Testimonial** - Drag a media card to "Testimonial" panel and verify script_type updates
- [ ] **Drag to Educational** - Drag a media card to "Educational" panel and verify script_type updates
- [ ] **Drag to Behind the Scene** - Drag a media card to "Behind the Scene (BTS)" panel and verify script_type updates
- [ ] **Drag to Unassigned** - Drag a media card back to "Unassigned" panel and verify script_type updates

### Visual Feedback
- [ ] **Drop zone highlighting** - Verify script panels highlight when dragging over them
- [ ] **Drag preview** - Verify dragged card shows preview overlay while dragging
- [ ] **Success toast** - Verify success toast appears after successful script assignment
- [ ] **Error toast** - Verify error toast appears if assignment fails
- [ ] **Script badge updates** - Verify script badge on media card updates immediately after drop
- [ ] **Counter updates** - Verify script panel counters update after assignment

### Filtering
- [ ] **Click "All Media"** - Verify clicking "All Media" panel shows all media items
- [ ] **Click "Unassigned"** - Verify clicking "Unassigned" panel filters to show only unassigned media
- [ ] **Click script category** - Verify clicking any script category panel filters media to that category
- [ ] **Filter persistence** - Verify filter selection persists when navigating between panels
- [ ] **Reset filters** - Verify "Reset Filters" button clears all filters

### New Media from Google Drive
- [ ] **Sync new media** - Click "Sync with Google Drive" and verify new media appears
- [ ] **New media is unassigned** - Verify newly synced media shows "Unassigned" script type
- [ ] **Drag new media** - Verify newly synced media can be dragged to script panels
- [ ] **Unassigned counter** - Verify "Unassigned" panel counter increases with new media

### Bulk Operations (Removed)
- [ ] **No bulk script dropdown** - Verify bulk script assignment dropdown is removed
- [ ] **No bulk script button** - Verify bulk script assignment button is removed
- [ ] **Bulk client assignment still works** - Verify bulk client assignment is still functional

## 🔒 Security & Permissions

### Role-Based Access Control
- [ ] **Admin can assign scripts** - Verify Admin can drag and assign scripts
- [ ] **Manager can assign scripts** - Verify Manager can drag and assign scripts
- [ ] **Employee view-only** - Verify Employee cannot drag or assign scripts
- [ ] **Team Leader view-only** - Verify Team Leader cannot drag or assign scripts
- [ ] **Backend validates role** - Verify backend returns 403 for non-Admin/Manager script updates
- [ ] **Frontend disables drag** - Verify drag is disabled in UI for non-Admin/Manager users

## 🎨 UI/UX Testing

### Visual Design
- [ ] **Script panels are visible** - Verify right-side script panels are clearly visible
- [ ] **Icons are displayed** - Verify each script category has appropriate icon
- [ ] **Colors are distinct** - Verify each script category has unique color
- [ ] **Responsive layout** - Verify layout works on different screen sizes
- [ ] **Empty state UI** - Verify empty state message appears when no media matches filter

### Animations & Micro-interactions
- [ ] **Hover effects on cards** - Verify media cards have hover effect
- [ ] **Hover effects on panels** - Verify script panels have hover effect
- [ ] **Drag animation** - Verify smooth drag animation
- [ ] **Drop animation** - Verify smooth drop animation
- [ ] **Toast animation** - Verify toast slides in and out smoothly
- [ ] **Panel highlight pulse** - Verify drop zone has pulsing animation when dragging over

### Accessibility
- [ ] **Keyboard navigation** - Verify basic keyboard navigation works
- [ ] **Screen reader labels** - Verify important elements have proper labels
- [ ] **Color contrast** - Verify text has sufficient contrast against backgrounds
- [ ] **Focus indicators** - Verify focus indicators are visible

## 📊 Data Integrity

### Database Updates
- [ ] **Script type saves** - Verify script_type is saved to database after drag & drop
- [ ] **Script type persists** - Verify script_type persists after page refresh
- [ ] **Multiple assignments** - Verify dragging same media multiple times updates correctly
- [ ] **Concurrent updates** - Test multiple users updating scripts simultaneously

### API Testing
- [ ] **PATCH /api/media/assets/:id/script** - Verify endpoint updates script_type
- [ ] **GET /api/media/assets?script_type=X** - Verify filtering by script_type works
- [ ] **401 for unauthorized** - Verify endpoint returns 401 without auth token
- [ ] **403 for non-Admin/Manager** - Verify endpoint returns 403 for Employee/Team Leader
- [ ] **400 for invalid script** - Verify endpoint returns 400 for invalid script_type

## 🐛 Edge Cases

### Error Handling
- [ ] **Network error during drag** - Verify error toast appears if network fails
- [ ] **Invalid script type** - Verify error handling for invalid script type
- [ ] **Missing media asset** - Verify error handling if media asset not found
- [ ] **Concurrent drag operations** - Test dragging multiple items quickly

### Data Edge Cases
- [ ] **Media with no thumbnail** - Verify media without thumbnail displays properly
- [ ] **Very long filename** - Verify long filenames are truncated properly
- [ ] **Special characters in filename** - Verify special characters display correctly
- [ ] **Large number of media items** - Test performance with 100+ media items

## 📱 Cross-Browser Testing

- [ ] **Chrome** - Test all features in Chrome
- [ ] **Firefox** - Test all features in Firefox
- [ ] **Safari** - Test all features in Safari
- [ ] **Edge** - Test all features in Edge

## 🚀 Performance Testing

- [ ] **Drag performance** - Verify drag is smooth with 50+ media items
- [ ] **Filter performance** - Verify filtering is instant
- [ ] **Page load time** - Verify page loads in under 3 seconds
- [ ] **API response time** - Verify script update API responds in under 500ms

## 📝 UX Microcopy

- [ ] **Helper text is clear** - Verify all helper text is easy to understand
- [ ] **Error messages are helpful** - Verify error messages guide user to solution
- [ ] **Empty states are informative** - Verify empty states explain what to do next
- [ ] **Success messages are encouraging** - Verify success messages provide positive feedback

## ✨ Final Checks

- [ ] **No console errors** - Verify no JavaScript errors in console
- [ ] **No 404 errors** - Verify no missing resources (images, fonts, etc.)
- [ ] **No memory leaks** - Verify no memory leaks after extended use
- [ ] **Works after logout/login** - Verify functionality persists after re-authentication

---

## Test Scenarios

### Scenario 1: Admin assigns script to new media
1. Login as Admin
2. Click "Sync with Google Drive"
3. Verify new media appears with "Unassigned" script
4. Drag new media to "Social Media" panel
5. Verify success toast appears
6. Verify media card shows "Social Media" badge
7. Click "Social Media" panel
8. Verify media appears in filtered view

### Scenario 2: Manager reassigns script
1. Login as Manager
2. Find media with "Testimonial" script
3. Drag media to "Educational" panel
4. Verify success toast appears
5. Verify script badge updates to "Educational"
6. Refresh page
7. Verify script type persists as "Educational"

### Scenario 3: Employee views media (read-only)
1. Login as Employee
2. Verify warning message appears about view-only access
3. Try to drag a media card
4. Verify drag does not work
5. Verify script panels are visible but not interactive for dragging

### Scenario 4: Filter by script category
1. Login as Admin or Manager
2. Click "Social Media" panel
3. Verify only "Social Media" items are shown
4. Click "All Media" panel
5. Verify all media items are shown
6. Click "Reset Filters"
7. Verify filters are cleared

---

**Test Status**: ⏳ Pending
**Last Updated**: 2026-02-02
**Tested By**: _____________
**Sign-off**: _____________
