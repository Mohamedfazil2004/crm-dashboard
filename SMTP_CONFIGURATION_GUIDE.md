# SMTP Configuration Guide for Leave Notifications

## 📧 Email Service Setup

This guide helps you configure the SMTP settings for sending leave notification emails.

---

## 🔧 Required Environment Variables

Add these variables to your `.env` file in the `reach-skyline-backend` directory:

```env
# SMTP Server Configuration
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_SENDER_NAME=Reach Skyline CRM
```

---

## 📋 Configuration Options

### Option 1: Gmail (Recommended for Testing)

**Requirements:**
- Gmail account
- App Password (not regular password)

**Steps to Get App Password:**

1. **Enable 2-Step Verification:**
   - Go to https://myaccount.google.com/security
   - Enable "2-Step Verification"

2. **Generate App Password:**
   - Go to https://myaccount.google.com/apppasswords
   - Select "Mail" and "Other (Custom name)"
   - Enter "Reach Skyline CRM"
   - Click "Generate"
   - Copy the 16-character password

3. **Update .env:**
   ```env
   SMTP_SERVER=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=abcd efgh ijkl mnop  # Your app password
   EMAIL_SENDER_NAME=Reach Skyline CRM
   ```

**Note:** Remove spaces from app password when pasting

---

### Option 2: Outlook/Office 365

**Configuration:**
```env
SMTP_SERVER=smtp.office365.com
SMTP_PORT=587
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-password
EMAIL_SENDER_NAME=Reach Skyline CRM
```

**Requirements:**
- Outlook/Office 365 account
- Regular password (or app password if 2FA enabled)

---

### Option 3: Custom SMTP Server

**Configuration:**
```env
SMTP_SERVER=mail.yourdomain.com
SMTP_PORT=587  # or 465 for SSL
SMTP_USER=noreply@yourdomain.com
SMTP_PASS=your-password
EMAIL_SENDER_NAME=Reach Skyline CRM
```

**Common Ports:**
- `587` - TLS (STARTTLS)
- `465` - SSL
- `25` - Unencrypted (not recommended)

---

### Option 4: SendGrid

**Configuration:**
```env
SMTP_SERVER=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
EMAIL_SENDER_NAME=Reach Skyline CRM
```

**Steps:**
1. Create SendGrid account
2. Generate API key
3. Use "apikey" as username
4. Use API key as password

---

### Option 5: AWS SES (Amazon Simple Email Service)

**Configuration:**
```env
SMTP_SERVER=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=your-smtp-username
SMTP_PASS=your-smtp-password
EMAIL_SENDER_NAME=Reach Skyline CRM
```

**Steps:**
1. Create AWS SES account
2. Verify sender email/domain
3. Generate SMTP credentials
4. Use provided username and password

---

## 🧪 Testing SMTP Configuration

### Method 1: Python Script

Create `test_smtp.py` in backend directory:

```python
import os
import smtplib
from email.mime.text import MIMEText
from dotenv import load_dotenv

load_dotenv()

SMTP_SERVER = os.getenv("SMTP_SERVER")
SMTP_PORT = int(os.getenv("SMTP_PORT", 587))
SMTP_USER = os.getenv("SMTP_USER")
SMTP_PASS = os.getenv("SMTP_PASS")

def test_smtp():
    try:
        print(f"Testing SMTP connection to {SMTP_SERVER}:{SMTP_PORT}")
        print(f"Using username: {SMTP_USER}")
        
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT, timeout=10)
        server.starttls()
        server.login(SMTP_USER, SMTP_PASS)
        
        # Send test email
        msg = MIMEText("This is a test email from Reach Skyline CRM")
        msg["Subject"] = "SMTP Test - Reach Skyline CRM"
        msg["From"] = SMTP_USER
        msg["To"] = SMTP_USER  # Send to yourself
        
        server.send_message(msg)
        server.quit()
        
        print("✅ SUCCESS: SMTP configuration is working!")
        print(f"✅ Test email sent to {SMTP_USER}")
        return True
        
    except smtplib.SMTPAuthenticationError as e:
        print(f"❌ AUTHENTICATION ERROR: {e}")
        print("Check your SMTP_USER and SMTP_PASS")
        return False
        
    except smtplib.SMTPException as e:
        print(f"❌ SMTP ERROR: {e}")
        return False
        
    except Exception as e:
        print(f"❌ ERROR: {e}")
        return False

if __name__ == "__main__":
    test_smtp()
```

**Run:**
```bash
cd reach-skyline-backend
python test_smtp.py
```

---

### Method 2: Using Backend API

1. Start backend server
2. Use Postman or curl to test

**Request:**
```bash
curl -X PATCH http://localhost:5000/api/tasks/1/active-status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"activeStatus": "Leave"}'
```

**Check Response:**
```json
{
  "message": "Active status updated and notification sent",
  "task": {...},
  "email_sent": true
}
```

---

## 🔒 Security Best Practices

### 1. Never Commit .env File

**Add to `.gitignore`:**
```
.env
.env.local
.env.production
```

### 2. Use App Passwords

- Never use your main email password
- Generate app-specific passwords
- Revoke if compromised

### 3. Restrict SMTP User Permissions

- Use dedicated email account for system
- Limit sending quota
- Monitor for abuse

### 4. Environment-Specific Configuration

**Development (.env.development):**
```env
SMTP_SERVER=smtp.gmail.com
SMTP_USER=dev-noreply@example.com
```

**Production (.env.production):**
```env
SMTP_SERVER=smtp.yourdomain.com
SMTP_USER=noreply@yourdomain.com
```

---

## 🚨 Common Issues & Solutions

### Issue 1: "Authentication Failed"

**Possible Causes:**
- Wrong username or password
- App password not generated (Gmail)
- 2FA enabled but using regular password

**Solution:**
1. Verify SMTP_USER is correct email
2. Generate app password if using Gmail
3. Check for typos in SMTP_PASS

---

### Issue 2: "Connection Timeout"

**Possible Causes:**
- Firewall blocking SMTP port
- Wrong SMTP_SERVER address
- Network issues

**Solution:**
1. Check firewall settings
2. Verify SMTP_SERVER is correct
3. Try different port (587 vs 465)
4. Test network connectivity

---

### Issue 3: "Recipient Refused"

**Possible Causes:**
- Team Leader email doesn't exist
- Email format invalid
- Domain doesn't accept emails

**Solution:**
1. Verify Team Leader email in database
2. Check email format (use validation)
3. Test with known working email

---

### Issue 4: "SSL/TLS Error"

**Possible Causes:**
- Wrong port for encryption type
- SSL certificate issues

**Solution:**
1. Use port 587 for STARTTLS
2. Use port 465 for SSL
3. Update Python SSL certificates

---

## 📊 Monitoring Email Delivery

### Backend Logs

**Success:**
```
[SUCCESS] Leave Notification Email sent to teamlead@example.com
```

**Errors:**
```
[ERROR] SMTP Authentication failed: (535, b'Authentication failed')
[ERROR] Recipient email rejected: (550, b'User unknown')
```

### Recommended Monitoring

1. **Log all email attempts:**
   - Timestamp
   - Recipient
   - Success/Failure
   - Error message

2. **Track delivery rate:**
   - Daily email count
   - Success rate percentage
   - Common error types

3. **Alert on failures:**
   - Email admin if delivery rate < 90%
   - Alert on authentication failures
   - Monitor for spam complaints

---

## 🔄 Email Provider Comparison

| Provider | Pros | Cons | Best For |
|----------|------|------|----------|
| **Gmail** | Easy setup, reliable | Daily sending limit (500) | Development, small teams |
| **Outlook** | Good for Office 365 users | Moderate limits | Small to medium teams |
| **SendGrid** | High deliverability, analytics | Paid for high volume | Production, high volume |
| **AWS SES** | Scalable, cheap | Complex setup | Large scale production |
| **Custom SMTP** | Full control | Requires maintenance | Enterprise with IT team |

---

## 📝 Configuration Checklist

Before deploying to production:

- [ ] SMTP credentials tested and working
- [ ] App password generated (if using Gmail)
- [ ] .env file added to .gitignore
- [ ] Test email sent successfully
- [ ] Team Leader emails verified in database
- [ ] Email template tested in major clients (Gmail, Outlook)
- [ ] Error handling tested (invalid emails, etc.)
- [ ] Monitoring/logging configured
- [ ] Backup SMTP provider configured (optional)
- [ ] Email sending limits understood

---

## 🆘 Support

If you encounter issues:

1. **Check Backend Logs:**
   ```bash
   tail -f reach-skyline-backend/logs/app.log
   ```

2. **Test SMTP Manually:**
   ```bash
   python test_smtp.py
   ```

3. **Verify Environment Variables:**
   ```bash
   cd reach-skyline-backend
   python -c "from dotenv import load_dotenv; import os; load_dotenv(); print('SMTP_SERVER:', os.getenv('SMTP_SERVER')); print('SMTP_USER:', os.getenv('SMTP_USER'))"
   ```

4. **Contact Email Provider Support:**
   - Gmail: https://support.google.com/mail
   - Outlook: https://support.microsoft.com/outlook
   - SendGrid: https://support.sendgrid.com
   - AWS SES: https://aws.amazon.com/ses/support

---

## 📚 Additional Resources

- [Python smtplib Documentation](https://docs.python.org/3/library/smtplib.html)
- [Gmail SMTP Settings](https://support.google.com/mail/answer/7126229)
- [Outlook SMTP Settings](https://support.microsoft.com/en-us/office/pop-imap-and-smtp-settings-8361e398-8af4-4e97-b147-6c6c4ac95353)
- [SendGrid SMTP Documentation](https://docs.sendgrid.com/for-developers/sending-email/integrating-with-the-smtp-api)
- [AWS SES SMTP Documentation](https://docs.aws.amazon.com/ses/latest/dg/send-email-smtp.html)
