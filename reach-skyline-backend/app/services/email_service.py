import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

load_dotenv()

SMTP_SERVER = os.getenv("SMTP_SERVER")
SMTP_PORT = int(os.getenv("SMTP_PORT", 587))
SMTP_USER = os.getenv("SMTP_USER")
SMTP_PASS = os.getenv("SMTP_PASS")
EMAIL_SENDER_NAME = os.getenv("EMAIL_SENDER_NAME", "Task Manager")

def send_task_email(employee, tasks, team_leader):
    """
    Sends a consolidated email notification to the assigned employee.
    The email includes all tasks assigned in a single table.
    """
    if not tasks:
        return False

    if not isinstance(tasks, list):
        tasks = [tasks]

    client_name = tasks[0].client.client_name if tasks[0].client else "N/A"
    task_count = len(tasks)
    assigned_at = tasks[0].team_sent_at or "Just now"
    
    tl_name = team_leader.name if team_leader else "Team Leader"
    tl_email = team_leader.email if team_leader else None

    # Validate TL email exists and is valid
    if not tl_email or not validate_email(tl_email):
        print(f"[ERROR] Assignment failed: No valid Team Leader email found.")
        return False

    msg = MIMEMultipart("alternative")
    msg["Subject"] = f"New Assignment: {client_name} – {task_count} Task(s)"
    msg["From"] = f"{tl_name} <{SMTP_USER}>"
    msg["To"] = employee.email
    msg["Reply-To"] = tl_email

    # Build Task Table Rows
    task_rows_html = ""
    for t in tasks:
        # Determine Activity Type based on activity_code or other metadata
        activity_type = t.content_type or t.team or "N/A"
        
        task_rows_html += f"""
        <tr>
            <td style="border: 1px solid #ddd; padding: 12px; text-align: left;">{t.id}</td>
            <td style="border: 1px solid #ddd; padding: 12px; text-align: left;">{t.activity_code or 'N/A'}</td>
            <td style="border: 1px solid #ddd; padding: 12px; text-align: left;">{activity_type}</td>
            <td style="border: 1px solid #ddd; padding: 12px; text-align: left;">{t.minutes or 0} mins</td>
            <td style="border: 1px solid #ddd; padding: 12px; text-align: left;">{t.remarks or '-'}</td>
        </tr>
        """

    html_content = f"""
    <html>
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; line-height: 1.6;">
        <div style="max-width: 800px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px;">New Task Assignment</h2>
            <p>Hello <strong>{employee.name}</strong>,</p>
            <p>You have been assigned <strong>{task_count}</strong> new task(s) for client: <span style="font-size: 1.1em; color: #e67e22; font-weight: bold;">{client_name}</span></p>
            
            <table style="width: 100%; border-collapse: collapse; margin-top: 20px; border: 1px solid #ddd;">
                <thead>
                    <tr style="background-color: #3498db; color: white;">
                        <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Task ID</th>
                        <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Code</th>
                        <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Activity Type</th>
                        <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Min</th>
                        <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Description</th>
                    </tr>
                </thead>
                <tbody>
                    {task_rows_html}
                </tbody>
            </table>

            <div style="margin-top: 30px; padding: 20px; background-color: #f8f9fa; border-left: 5px solid #3498db; border-radius: 4px;">
                <p style="margin: 0; font-size: 0.9em;"><strong>Assigned Date & Time:</strong> {assigned_at}</p>
                <p style="margin: 8px 0 0 0; font-size: 0.9em;"><strong>Assigned By:</strong> {tl_name} ({tl_email})</p>
            </div>

            <p style="margin-top: 30px; font-size: 0.9em; color: #7f8c8d;">Please login to your dashboard to view more details and start working.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin-top: 30px;">
            <p style="text-align: center; color: #bdc3c7; font-size: 0.8em;">Reach Skyline CRM Notifications</p>
        </div>
    </body>
    </html>
    """

    msg.attach(MIMEText(html_content, "html"))

    try:
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(SMTP_USER, SMTP_PASS)
        server.send_message(msg)
        server.quit()
        print(f"[DEBUG] Consolidated Assignment Email sent to {employee.email}")
        return True
    except Exception as e:
        print(f"[ERROR] Email sending failed: {e}")
        return False

    except Exception as e:
        print(f"[ERROR] Email sending failed: {e}")
        return False

def validate_email(email):
    """
    Validates email format using regex.
    Returns True if valid, False otherwise.
    """
    import re
    if not email:
        return False
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def send_leave_notification_email(employee, task):
    """
    Sends an email notification when an employee marks a task as 'Leave'.
    From employee to Team Leader.
    
    Returns:
        dict: {
            "success": bool,
            "message": str,
            "email_sent": bool,
            "recipient": str or None
        }
    """
    from app.models.employee import Employee
    
    # Get team leader
    team_leader = Employee.query.get(employee.team_leader_id) if employee.team_leader_id else None
    
    # Validate team leader exists
    if not team_leader:
        print(f"[WARNING] No team leader assigned for employee {employee.id}")
        return {
            "success": False,
            "message": "Team Leader not assigned. Please contact admin.",
            "email_sent": False,
            "recipient": None
        }
    
    # Validate team leader email
    tl_email = team_leader.email
    if not tl_email or not validate_email(tl_email):
        print(f"[ERROR] Invalid or missing Team Leader email: {tl_email}")
        return {
            "success": False,
            "message": "Team Leader email not configured. Please contact admin.",
            "email_sent": False,
            "recipient": tl_email
        }
    
    # Validate SMTP configuration
    if not all([SMTP_SERVER, SMTP_PORT, SMTP_USER, SMTP_PASS]):
        print(f"[ERROR] SMTP configuration incomplete")
        return {
            "success": False,
            "message": "Email service not configured. Please contact admin.",
            "email_sent": False,
            "recipient": tl_email
        }
    
    # Get employee leave remark from task
    leave_remark = task.employee_remark or "No remark provided"
    
    # Build email
    msg = MIMEMultipart("alternative")
    msg["Subject"] = f"🔴 Leave Notification – {task.activity_code} – {employee.name}"
    # Use SMTP_USER as From to avoid spoofing blocks, but set name to employee
    msg["From"] = f"{employee.name} <{SMTP_USER}>"
    msg["To"] = tl_email
    msg["Reply-To"] = employee.email

    html_content = f"""
    <html>
    <head>
        <style>
            body {{
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                color: #333;
                line-height: 1.6;
                margin: 0;
                padding: 0;
            }}
            .container {{
                max-width: 650px;
                margin: 20px auto;
                padding: 0;
                border: 2px solid #e74c3c;
                border-radius: 12px;
                overflow: hidden;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            }}
            .header {{
                background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
                color: white;
                padding: 25px;
                text-align: center;
            }}
            .header h2 {{
                margin: 0;
                font-size: 24px;
                font-weight: 600;
            }}
            .content {{
                padding: 30px;
                background-color: #ffffff;
            }}
            .alert-box {{
                background-color: #fef5f5;
                border-left: 5px solid #e74c3c;
                padding: 15px;
                margin-bottom: 25px;
                border-radius: 4px;
            }}
            .info-table {{
                width: 100%;
                border-collapse: collapse;
                margin: 20px 0;
                background-color: #f9f9f9;
                border-radius: 8px;
                overflow: hidden;
            }}
            .info-table tr {{
                border-bottom: 1px solid #e0e0e0;
            }}
            .info-table tr:last-child {{
                border-bottom: none;
            }}
            .info-table td {{
                padding: 14px;
            }}
            .info-table td:first-child {{
                font-weight: 600;
                width: 180px;
                color: #555;
                background-color: #f0f0f0;
            }}
            .info-table td:last-child {{
                color: #333;
            }}
            .remark-box {{
                background-color: #fff9e6;
                border: 1px solid #ffd966;
                border-radius: 6px;
                padding: 18px;
                margin-top: 20px;
            }}
            .remark-box strong {{
                color: #d68910;
                font-size: 15px;
            }}
            .remark-text {{
                margin-top: 10px;
                padding: 12px;
                background-color: white;
                border-left: 3px solid #ffd966;
                font-style: italic;
                color: #555;
            }}
            .action-section {{
                margin-top: 25px;
                padding: 20px;
                background-color: #e8f5e9;
                border-left: 5px solid #4caf50;
                border-radius: 4px;
            }}
            .footer {{
                text-align: center;
                padding: 20px;
                background-color: #f5f5f5;
                color: #888;
                font-size: 13px;
                border-top: 1px solid #e0e0e0;
            }}
            .badge {{
                display: inline-block;
                padding: 6px 12px;
                background-color: #e74c3c;
                color: white;
                border-radius: 20px;
                font-size: 12px;
                font-weight: 600;
                text-transform: uppercase;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h2>🔴 Employee Leave Notification</h2>
            </div>
            
            <div class="content">
                <div class="alert-box">
                    <p style="margin: 0; font-size: 15px;">
                        <strong>⚠️ Attention Required:</strong> An employee has marked a task as <span class="badge">Leave</span> and is currently unavailable.
                    </p>
                </div>
                
                <h3 style="color: #2c3e50; margin-top: 0; border-bottom: 2px solid #3498db; padding-bottom: 8px;">
                    Employee Information
                </h3>
                
                <table class="info-table">
                    <tr>
                        <td>Employee ID:</td>
                        <td><strong>{employee.id}</strong></td>
                    </tr>
                    <tr>
                        <td>Employee Name:</td>
                        <td><strong>{employee.name}</strong></td>
                    </tr>
                    <tr>
                        <td>Role:</td>
                        <td>{employee.role}</td>
                    </tr>
                    <tr>
                        <td>Team:</td>
                        <td>{employee.team}</td>
                    </tr>
                    <tr>
                        <td>Email:</td>
                        <td><a href="mailto:{employee.email}" style="color: #3498db; text-decoration: none;">{employee.email}</a></td>
                    </tr>
                </table>
                
                <h3 style="color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 8px;">
                    Task Information
                </h3>
                
                <table class="info-table">
                    <tr>
                        <td>Task Code:</td>
                        <td><strong style="color: #e67e22;">{task.activity_code}</strong></td>
                    </tr>
                    <tr>
                        <td>Task Activity:</td>
                        <td>{task.content_type or task.team or 'N/A'}</td>
                    </tr>
                    <tr>
                        <td>Client:</td>
                        <td>{task.client.client_name if task.client else 'N/A'}</td>
                    </tr>
                    <tr>
                        <td>Status:</td>
                        <td><span class="badge">Leave</span></td>
                    </tr>
                </table>
                
                <div class="remark-box">
                    <strong>📝 Employee Leave Remark:</strong>
                    <div class="remark-text">
                        {leave_remark}
                    </div>
                </div>
                
                <div class="action-section">
                    <p style="margin: 0; font-size: 14px;">
                        <strong>✅ Recommended Action:</strong><br>
                        Please review this task and consider reassigning it to another available team member to ensure timely completion.
                    </p>
                </div>
                
                <p style="margin-top: 25px; font-size: 13px; color: #7f8c8d;">
                    💡 <em>You can reassign this task from your Team Leader dashboard. The task is now available for reassignment.</em>
                </p>
            </div>
            
            <div class="footer">
                <p style="margin: 5px 0;">Reach Skyline CRM - Automated Notification System</p>
                <p style="margin: 5px 0; font-size: 11px;">This is an automated message. Please do not reply directly to this email.</p>
            </div>
        </div>
    </body>
    </html>
    """

    msg.attach(MIMEText(html_content, "html"))

    try:
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT, timeout=10)
        server.starttls()
        server.login(SMTP_USER, SMTP_PASS)
        server.send_message(msg)
        server.quit()
        print(f"[SUCCESS] Leave Notification Email sent to {tl_email}")
        return {
            "success": True,
            "message": "Leave notification email sent successfully",
            "email_sent": True,
            "recipient": tl_email
        }
    except smtplib.SMTPRecipientsRefused as e:
        print(f"[ERROR] Recipient email rejected: {e}")
        return {
            "success": False,
            "message": "Team Leader email address does not exist or is invalid. Please contact admin.",
            "email_sent": False,
            "recipient": tl_email
        }
    except smtplib.SMTPAuthenticationError as e:
        print(f"[ERROR] SMTP Authentication failed: {e}")
        return {
            "success": False,
            "message": "Email service authentication failed. Please contact admin.",
            "email_sent": False,
            "recipient": tl_email
        }
    except smtplib.SMTPException as e:
        print(f"[ERROR] SMTP error occurred: {e}")
        return {
            "success": False,
            "message": "Email delivery failed due to server error. Please contact admin.",
            "email_sent": False,
            "recipient": tl_email
        }
    except Exception as e:
        print(f"[ERROR] Unexpected error sending email: {e}")
        return {
            "success": False,
            "message": "Email delivery failed. Please contact admin.",
            "email_sent": False,
            "recipient": tl_email
        }
