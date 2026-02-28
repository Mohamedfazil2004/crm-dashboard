# Quick Test Guide - Leave Notification Email Validation

## 🧪 Testing Scenarios

### Test 1: Successful Email Delivery ✅

**Setup:**
1. Ensure Team Leader has valid email in database
2. Verify SMTP credentials in `.env` file

**Steps:**
1. Login as Employee
2. Navigate to Employee Profile
3. Find an assigned task
4. Change Active Status from "Working" to "Leave"
5. Add a leave remark (e.g., "Medical appointment")

**Expected Result:**
```
✅ Status updated to Leave

📧 Team Leader has been notified via email.
```

**Verify:**
- [ ] Task status shows "Leave" in employee view
- [ ] Task status shows "Leave" in Team Leader view
- [ ] Team Leader receives email with leave remark
- [ ] Email contains all required information

---

### Test 2: No Team Leader Assigned ⚠️

**Setup:**
1. Create/use employee with `team_leader_id = NULL`

**Steps:**
1. Login as Employee (without Team Leader)
2. Mark task as "Leave"

**Expected Result:**
```
⚠️ Leave Recorded

Team Leader not assigned. Please contact admin.

Your leave status has been saved, but the notification email 
could not be sent. Please inform your Team Leader directly.
```

**Verify:**
- [ ] Task status updated to "Leave"
- [ ] No email sent
- [ ] Warning message displayed
- [ ] Backend log: "[WARNING] No team leader assigned for employee..."

---

### Test 3: Invalid Team Leader Email ⚠️

**Setup:**
1. Update Team Leader email to invalid format (e.g., "invalid-email")

**SQL:**
```sql
UPDATE employees 
SET email = 'invalid-email' 
WHERE id = 'TL001';
```

**Steps:**
1. Login as Employee
2. Mark task as "Leave"

**Expected Result:**
```
⚠️ Leave Recorded

Team Leader email not configured. Please contact admin.

Your leave status has been saved, but the notification email 
could not be sent. Please inform your Team Leader directly.
```

**Verify:**
- [ ] Task status updated to "Leave"
- [ ] No email sent
- [ ] Warning message displayed
- [ ] Backend log: "[ERROR] Invalid or missing Team Leader email..."

---

### Test 4: Non-existent Email Address ⚠️

**Setup:**
1. Update Team Leader email to non-existent address

**SQL:**
```sql
UPDATE employees 
SET email = 'nonexistent@invaliddomain12345.xyz' 
WHERE id = 'TL001';
```

**Steps:**
1. Login as Employee
2. Mark task as "Leave"

**Expected Result:**
```
⚠️ Leave Recorded

Team Leader email address does not exist or is invalid. 
Please contact admin.

Your leave status has been saved, but the notification email 
could not be sent. Please inform your Team Leader directly.
```

**Verify:**
- [ ] Task status updated to "Leave"
- [ ] Email send attempted but failed
- [ ] Warning message displayed
- [ ] Backend log: "[ERROR] Recipient email rejected..."

---

### Test 5: SMTP Configuration Missing ⚠️

**Setup:**
1. Temporarily remove SMTP credentials from `.env`

**Steps:**
1. Restart backend server
2. Login as Employee
3. Mark task as "Leave"

**Expected Result:**
```
⚠️ Leave Recorded

Email service not configured. Please contact admin.

Your leave status has been saved, but the notification email 
could not be sent. Please inform your Team Leader directly.
```

**Verify:**
- [ ] Task status updated to "Leave"
- [ ] No email sent
- [ ] Warning message displayed
- [ ] Backend log: "[ERROR] SMTP configuration incomplete"

---

### Test 6: Return to Working Status ✅

**Setup:**
1. Employee currently has task marked as "Leave"

**Steps:**
1. Login as Employee
2. Change Active Status from "Leave" to "Working"

**Expected Result:**
```
Status updated to Working
```

**Verify:**
- [ ] Task status changes from "Leave" to "Pending" (shows as "Assigned")
- [ ] No email sent (correct behavior)
- [ ] Simple success message displayed

---

### Test 7: Leave Remark Included in Email ✅

**Setup:**
1. Valid Team Leader email configured

**Steps:**
1. Login as Employee
2. Add employee remark: "Family emergency - will be back tomorrow"
3. Mark task as "Leave"

**Expected Result:**
- Email sent successfully
- Email contains remark in highlighted yellow box

**Verify Email Contains:**
- [ ] Employee ID, Name, Role, Team, Email
- [ ] Task Code, Activity, Client, Status
- [ ] **Leave Remark:** "Family emergency - will be back tomorrow"
- [ ] Recommended action section
- [ ] Professional formatting

---

### Test 8: No Leave Remark Provided ✅

**Setup:**
1. Valid Team Leader email configured

**Steps:**
1. Login as Employee
2. Do NOT add employee remark
3. Mark task as "Leave"

**Expected Result:**
- Email sent successfully
- Email shows "No remark provided" in remark section

**Verify Email Contains:**
- [ ] All employee and task information
- [ ] **Leave Remark:** "No remark provided"
- [ ] Professional formatting maintained

---

### Test 9: Multiple Leave Notifications ✅

**Setup:**
1. Employee has multiple assigned tasks

**Steps:**
1. Login as Employee
2. Mark Task 1 as "Leave"
3. Verify email sent
4. Mark Task 2 as "Leave"
5. Verify second email sent

**Expected Result:**
- Two separate emails sent
- Each email contains correct task information

**Verify:**
- [ ] Email 1 received with Task 1 details
- [ ] Email 2 received with Task 2 details
- [ ] Both emails properly formatted
- [ ] No duplicate or merged emails

---

### Test 10: Team Leader View After Leave ✅

**Setup:**
1. Employee marks task as "Leave"

**Steps:**
1. Login as Team Leader
2. Navigate to team dashboard
3. View client tasks

**Expected Result:**
- Task shows "Leave" status with orange badge
- Client row shows "Leave" status (highest priority)
- "Reassign" button is enabled

**Verify:**
- [ ] Task status displays "Leave" with orange color
- [ ] Active status shows "Leave" with red color
- [ ] Reassign button is clickable
- [ ] Client list reflects "Leave" status

---

## 🔍 Backend Log Verification

### Success Logs
```bash
[SUCCESS] Leave Notification Email sent to teamlead@example.com
```

### Warning Logs
```bash
[WARNING] No team leader assigned for employee EMP001
```

### Error Logs
```bash
[ERROR] Invalid or missing Team Leader email: invalid-email
[ERROR] SMTP configuration incomplete
[ERROR] Recipient email rejected: (550, b'5.1.1 User unknown')
[ERROR] SMTP Authentication failed: (535, b'Authentication failed')
```

---

## 📧 Email Template Verification

### Check Email Contains:

**Header:**
- [ ] Red gradient background
- [ ] "🔴 Employee Leave Notification" title

**Alert Box:**
- [ ] "⚠️ Attention Required" message
- [ ] "Leave" badge

**Employee Information Table:**
- [ ] Employee ID
- [ ] Employee Name
- [ ] Role
- [ ] Team
- [ ] Email (clickable link)

**Task Information Table:**
- [ ] Task Code (highlighted in orange)
- [ ] Task Activity
- [ ] Client Name
- [ ] Status Badge ("Leave")

**Leave Remark Section:**
- [ ] Yellow background box
- [ ] "📝 Employee Leave Remark:" label
- [ ] Remark text in white box with italic style

**Action Section:**
- [ ] Green background box
- [ ] "✅ Recommended Action:" label
- [ ] Reassignment suggestion

**Footer:**
- [ ] "Reach Skyline CRM - Automated Notification System"
- [ ] "This is an automated message" disclaimer

---

## 🛠️ Troubleshooting

### Email Not Received

**Check:**
1. Spam/Junk folder
2. SMTP credentials in `.env`
3. Team Leader email is correct
4. Backend logs for errors
5. Email server is not blocking sender

### Wrong Email Content

**Check:**
1. Task has correct data in database
2. Employee information is up to date
3. Leave remark was saved before marking Leave
4. Email template file is not cached

### Status Not Updating

**Check:**
1. Database connection
2. Frontend sending correct request
3. Backend receiving request
4. No JavaScript errors in console

---

## ✅ Test Completion Checklist

- [ ] Test 1: Successful email delivery
- [ ] Test 2: No Team Leader assigned
- [ ] Test 3: Invalid email format
- [ ] Test 4: Non-existent email address
- [ ] Test 5: SMTP configuration missing
- [ ] Test 6: Return to Working status
- [ ] Test 7: Leave remark included
- [ ] Test 8: No leave remark
- [ ] Test 9: Multiple leave notifications
- [ ] Test 10: Team Leader view update

- [ ] All backend logs verified
- [ ] Email template formatting verified
- [ ] User experience tested
- [ ] Error messages are user-friendly
- [ ] Task status always updates (even on email failure)

---

## 📝 Test Report Template

```
Test Date: _______________
Tester: _______________
Environment: [ ] Development [ ] Staging [ ] Production

Test Results:
┌────────────────────────────────────┬─────────┬──────────┐
│ Test Case                          │ Status  │ Notes    │
├────────────────────────────────────┼─────────┼──────────┤
│ 1. Successful Email Delivery       │ ✅/❌   │          │
│ 2. No Team Leader Assigned         │ ✅/❌   │          │
│ 3. Invalid Email Format            │ ✅/❌   │          │
│ 4. Non-existent Email Address      │ ✅/❌   │          │
│ 5. SMTP Configuration Missing      │ ✅/❌   │          │
│ 6. Return to Working Status        │ ✅/❌   │          │
│ 7. Leave Remark Included           │ ✅/❌   │          │
│ 8. No Leave Remark                 │ ✅/❌   │          │
│ 9. Multiple Leave Notifications    │ ✅/❌   │          │
│ 10. Team Leader View Update        │ ✅/❌   │          │
└────────────────────────────────────┴─────────┴──────────┘

Issues Found:
1. _______________________________________________
2. _______________________________________________
3. _______________________________________________

Overall Assessment: [ ] Pass [ ] Fail [ ] Needs Review

Recommendations:
_______________________________________________
_______________________________________________
```
