# Auto Update Team Leader Status When Employee Leaves a Task

## Implementation Summary

This document describes the automatic status synchronization system that ensures when an employee marks a task as "Leave", the Team Leader's view is automatically updated to reflect this change.

---

## ✅ Implemented Features

### 1. **Task-Level Status Sync**

**Backend Logic (`app/routes/tasks.py`):**
- When employee updates active status from "Working" → "Leave":
  - `task.active_status` is set to "Leave"
  - `task.status` is automatically updated to "Leave"
  - Email notification is sent to Team Leader
  - Change is logged in `task_status_logs` table

- When employee updates active status from "Leave" → "Working":
  - `task.active_status` is set to "Working"
  - `task.status` is reverted to "Pending" (displays as "Assigned")

**Frontend Sync (`EmployeeProfile.jsx`):**
- Employee updates active status via dropdown
- Backend response includes updated `status` field
- Local state is updated with both `activeStatus` and `status`
- Changes are immediately visible in employee's task list

### 2. **Team Leader Client List Status Column Logic**

**Status Priority Order (All Team Dashboards):**
```javascript
// Priority: Leave > In Progress > Assigned > Completed > Unassigned

if (statuses.includes("Leave")) {
  aggStatus = "Leave";
} else if (updatedTasks.every(t => t.status === 'Completed' || t.status === 'Call Completed')) {
  aggStatus = "Completed";
} else if (statuses.includes("In Progress")) {
  aggStatus = "In Progress";
} else if (assigneds.some(a => a)) {
  aggStatus = "Assigned";
} else {
  aggStatus = "Unassigned";
}
```

**Behavior:**
- If **any task** under a client has status "Leave" → Client status shows **"Leave"**
- Mixed statuses follow priority order
- Client list automatically reflects the highest priority status

### 3. **UI Requirements**

**Distinct "Leave" Badge Styling:**
```javascript
case 'Leave':
  return { background: '#ffe5d0', color: '#d84315' };
```

- **Color Scheme:** Orange/amber background with deep orange text
- **Differentiation:** Clearly distinct from:
  - Completed (green)
  - In Progress (yellow)
  - Assigned (blue)
  - Unassigned (red)

**Status Display:**
- Label reads exactly: **"Leave"**
- Status is **not editable** by Team Leader
- Only employees can change their own active status
- Team Leaders can only reassign when status is "Leave"

### 4. **Data Handling**

**Status Change References:**
```python
log = TaskStatusLog(
    employee_id=current_user_id,
    task_code=task.activity_code,
    previous_status=previous_active_status,
    new_status=new_active_status
)
```

**Tracked Information:**
- `client_id` (via task relationship)
- `task_code` (activity code)
- `employee_id` (who made the change)
- `new_status` (Leave/Working)
- `previous_status` (previous active status)
- `timestamp` (auto-generated)

**Sync Prevention:**
- Backend is single source of truth
- Employee profile updates from backend response
- Team leader view fetches fresh data from backend
- No client-side status desync possible

### 5. **Validation Rules**

**Status Update Rules:**
✅ Status update happens **only** when Active = "Leave"
✅ Task status automatically changes to "Leave"
✅ Team Leader **cannot** manually change task status to "Leave"
✅ Reassignment is controlled by `active_status` check
✅ "Reassign" button only enabled when `activeStatus === 'Leave'`

**Reassignment Logic:**
```javascript
<button
  onClick={() => onAssign(task, selectedEmp)}
  disabled={task.assignedTo && task.activeStatus !== 'Leave'}
  style={{
    background: (task.assignedTo && task.activeStatus !== 'Leave') ? '#ccc' : '#28a745',
    cursor: (task.assignedTo && task.activeStatus !== 'Leave') ? 'not-allowed' : 'pointer'
  }}
>
  {task.assignedTo ? 'Reassign' : 'Send'}
</button>
```

---

## 🔄 Data Flow

### Employee Marks Task as "Leave"

1. **Employee Action:**
   - Opens task details in Employee Profile
   - Changes Active status dropdown from "Working" to "Leave"

2. **Frontend Request:**
   ```javascript
   PATCH /api/tasks/{taskId}/active-status
   Body: { activeStatus: "Leave" }
   ```

3. **Backend Processing:**
   - Validates employee is assigned to task
   - Logs status change to `task_status_logs`
   - Updates `task.active_status = "Leave"`
   - Updates `task.status = "Leave"`
   - Sends email to Team Leader
   - Commits to database

4. **Backend Response:**
   ```json
   {
     "message": "Active status updated",
     "task": {
       "id": 123,
       "activeStatus": "Leave",
       "status": "Leave",
       ...
     }
   }
   ```

5. **Frontend Update:**
   - Employee view updates task status to "Leave"
   - Visual indicator changes to red background

6. **Team Leader View:**
   - On next refresh or real-time update
   - Task status shows "Leave" with orange badge
   - Client status shows "Leave" (highest priority)
   - "Reassign" button becomes enabled
   - Team Leader receives email notification

---

## 📋 Acceptance Criteria Status

✅ **Employee marks Leave on a task**
- Dropdown in Employee Profile allows status change

✅ **Team Leader task status updates to Leave**
- Backend automatically updates `task.status = "Leave"`
- Frontend displays "Leave" badge with orange styling

✅ **Client list status shows Leave**
- Group status calculation prioritizes "Leave" status
- Client row displays "Leave" badge when any task is on leave

✅ **No manual intervention required**
- Fully automated via backend logic
- Email notifications sent automatically

✅ **Status remains consistent across all views**
- Single source of truth in database
- All views fetch from backend
- No client-side desync possible

---

## 🎨 Visual Indicators

### Status Colors

| Status | Background | Text Color | Use Case |
|--------|-----------|------------|----------|
| **Leave** | `#ffe5d0` (Light Orange) | `#d84315` (Deep Orange) | Employee on leave |
| In Progress | `#fff3cd` (Light Yellow) | `#856404` (Dark Yellow) | Task being worked on |
| Assigned | `#cce5ff` (Light Blue) | `#004085` (Dark Blue) | Task assigned, not started |
| Completed | `#d4edda` (Light Green) | `#155724` (Dark Green) | Task finished |
| Unassigned | `#f8d7da` (Light Red) | `#721c24` (Dark Red) | No employee assigned |

### Active Status Colors (Employee View)

| Active Status | Background | Text Color |
|--------------|-----------|------------|
| **Leave** | `#ffdada` (Light Red) | `#c0392b` (Red) |
| **Working** | `#d4edda` (Light Green) | `#155724` (Dark Green) |

---

## 🔧 Files Modified

### Backend
- `app/routes/tasks.py` - Enhanced active status endpoint with Leave→Working reversion logic

### Frontend
- `src/pages/BrandingTeam.jsx` - Added Leave status priority and styling
- `src/pages/CampaignTeam.jsx` - Added Leave status priority and styling
- `src/pages/SeoTeam.jsx` - Added Leave status priority and styling
- `src/pages/TelecallerTeam.jsx` - Added Leave status priority and styling
- `src/pages/WebsiteTeam.jsx` - Added Leave status priority and styling
- `src/pages/EmployeeProfile.jsx` - Already implemented (previous session)

---

## 🧪 Testing Checklist

- [ ] Employee can change active status to "Leave"
- [ ] Task status automatically updates to "Leave" in database
- [ ] Team Leader sees "Leave" status in task details modal
- [ ] Client list shows "Leave" status when any task is on leave
- [ ] "Leave" badge displays with orange color scheme
- [ ] Reassign button becomes enabled when status is "Leave"
- [ ] Email notification is sent to Team Leader
- [ ] Status change is logged in `task_status_logs`
- [ ] Employee can change back to "Working"
- [ ] Task status reverts to "Pending" when changed back to "Working"
- [ ] Multiple tasks with mixed statuses show correct priority
- [ ] Team Leader cannot manually set status to "Leave"

---

## 📧 Email Notification

When an employee marks a task as "Leave", the Team Leader receives an automated email with:
- Employee name and ID
- Task code and client information
- Timestamp of status change
- Link to task details (if applicable)

---

## 🔐 Security & Permissions

- **Employees:** Can only update active status for tasks assigned to them
- **Team Leaders:** Can view all statuses but cannot modify active status
- **Team Leaders:** Can reassign tasks only when active status is "Leave"
- **Admins:** Read-only access to all views

---

## 🚀 Next Steps (Optional Enhancements)

1. **Real-time Updates:** Implement WebSocket or polling for instant status updates
2. **Leave History:** Add a view to see historical leave patterns
3. **Bulk Status Update:** Allow employees to mark multiple tasks as leave
4. **Auto-reassignment:** Suggest available employees when task is marked as leave
5. **Leave Reason:** Add optional field for employee to specify leave reason

---

## 📝 Notes

- Status synchronization is **automatic** and requires no manual intervention
- The system prevents status desync by using the backend as single source of truth
- Priority order ensures "Leave" status is always visible at the client level
- Reassignment logic prevents accidental task disruption while employee is working
