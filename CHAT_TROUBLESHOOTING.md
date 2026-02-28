# Chat Troubleshooting Guide

## Quick Fix Applied ✅

I've just fixed the following issues:
1. ✅ Changed all API URLs from `http://localhost:5000/api/...` to `/api/...` (to use Vite proxy)
2. ✅ Added comprehensive console logging for debugging
3. ✅ Added error handling for Socket.IO connection issues

## How to Test Now

### Step 1: Refresh Your Browser
Press `Ctrl + Shift + R` (hard refresh) or `F5` to reload the page with the new code.

### Step 2: Open Browser Console
Press `F12` → Go to "Console" tab

### Step 3: Login and Navigate
1. Login to the CRM
2. Go to any Team page (Branding, Website, etc.)
3. Click the green WhatsApp icon on a task

### Step 4: Check Console Logs
You should see logs like this:

```
[SOCKET] Connected to chat socket, ID: abc123
[SOCKET] Joined user room: TLB001
[CHAT] Initializing chat for task: 123 emp: EMP001 tl: TLB001
[CHAT] Chat initialized: {id: 1, task_id: 123, ...}
[CHAT] Fetching history for chat: 1
[CHAT] History loaded: 0 messages
```

### Step 5: Send a Message
1. Type a message in the chat box
2. Click Send
3. Check console for:
```
[CHAT] Sending message: {sender_id: "TLB001", receiver_id: "EMP001", ...}
```

### Step 6: Check Backend Logs
In your backend terminal, you should see:
```
[DEBUG] User connected to notification room: user_TLB001
[DEBUG] User joined room: chat_1
[DEBUG] Message sent from TLB001 to EMP001 in chat 1
```

## Common Issues & Solutions

### Issue 1: "Socket not connected!"
**Symptom:** Alert saying "Chat connection lost"
**Solution:** 
- Check if backend is running on port 5000
- Check browser console for Socket.IO errors
- Verify JWT token is valid (check localStorage)

### Issue 2: Messages not appearing
**Symptom:** Message sent but doesn't show up
**Check:**
1. Browser console for `[CHAT] Sending message:` log
2. Backend terminal for `[DEBUG] Message sent` log
3. Database: `SELECT * FROM chat_messages ORDER BY created_at DESC LIMIT 5;`

### Issue 3: "Chat init failed"
**Symptom:** Console shows `[CHAT] Init failed:`
**Solution:**
- Check if task has an assigned employee
- Verify employee has a team_leader_id
- Check backend logs for error details

### Issue 4: No notification badge
**Symptom:** Message sent but no red badge appears
**Check:**
1. Console for `[SOCKET] Notification received for task:`
2. Verify receiver is logged in
3. Check if receiver has joined their user room

## Debug Checklist

Run through this checklist:

- [ ] Backend running on http://127.0.0.1:5000
- [ ] Frontend running on http://localhost:5173
- [ ] Browser console shows `[SOCKET] Connected to chat socket`
- [ ] No red errors in browser console
- [ ] Backend shows `[DEBUG] User connected to notification room`
- [ ] Task has an assigned employee
- [ ] Employee has a team_leader_id in database
- [ ] JWT token exists in localStorage
- [ ] Chat modal opens when clicking WhatsApp icon

## Manual Database Check

If messages still don't work, check the database:

```sql
-- Check if chat was created
SELECT * FROM chats ORDER BY id DESC LIMIT 5;

-- Check if messages were saved
SELECT * FROM chat_messages ORDER BY created_at DESC LIMIT 10;

-- Check employee relationships
SELECT id, name, role, team, team_leader_id FROM employees WHERE id IN ('TLB001', 'EMP001');
```

## Still Not Working?

If chat still doesn't work after following this guide:

1. **Copy all console logs** (both browser and backend)
2. **Take a screenshot** of the error
3. **Share the logs** so I can help debug further

The new logging system will show exactly where the issue is!
