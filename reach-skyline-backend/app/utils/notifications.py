import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from flask import current_app
import os

def send_task_assignment_email(employee, tasks, team_leader):
    """
    Sends a consolidated email notification to the assigned employee with a subset of task details.
    The email is sent on behalf of the Team Leader.
    """
    if not isinstance(tasks, list):
        tasks = [tasks]
    
    if not tasks:
        return False

    try:
        smtp_server = os.environ.get("SMTP_SERVER", "smtp.gmail.com")
        smtp_port = int(os.environ.get("SMTP_PORT", 587))
        smtp_user = os.environ.get("SMTP_USER")
        smtp_password = os.environ.get("SMTP_PASS")
        
        # Use Team Leader's info for the "From" display
        tl_name = team_leader.name if team_leader else "Team Leader"
        tl_email = team_leader.email if team_leader else smtp_user
        sender_display = f"{tl_name} <{smtp_user}>"

        if not all([smtp_user, smtp_password]):
            print("[ERROR] Email credentials not configured in .env. Skipping notification.")
            return False

        task_count = len(tasks)
        client_name = tasks[0].client.client_name if tasks[0].client else "N/A"
        date_time = tasks[0].team_sent_at or "Just now"

        subject = f"New Assignment: {client_name} - {task_count} Task(s)"
        
        # Build Task Table
        task_rows_html = ""
        for t in tasks:
            row = f"""
            <tr>
                <td style="border: 1px solid #ddd; padding: 8px;">{t.id}</td>
                <td style="border: 1px solid #ddd; padding: 8px;">{t.activity_code}</td>
                <td style="border: 1px solid #ddd; padding: 8px;">{t.content_type or 'N/A'}</td>
                <td style="border: 1px solid #ddd; padding: 8px;">{t.minutes or 0} mins</td>
                <td style="border: 1px solid #ddd; padding: 8px;">{t.remarks or 'No instructions'}</td>
            </tr>
            """
            task_rows_html += row

        html_body = f"""
        <html>
        <body style="font-family: Arial, sans-serif; color: #333;">
            <p>Hello <strong>{employee.name}</strong>,</p>
            <p>You have been assigned <strong>{task_count}</strong> new task(s) for client <strong>{client_name}</strong>.</p>
            
            <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                <thead>
                    <tr style="background-color: #f2f2f2;">
                        <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Task ID</th>
                        <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Code</th>
                        <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Activity Type</th>
                        <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Min</th>
                        <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Description</th>
                    </tr>
                </thead>
                <tbody>
                    {task_rows_html}
                </tbody>
            </table>

            <div style="margin-top: 20px; padding: 15px; background-color: #f9f9f9; border-radius: 5px;">
                <p style="margin: 0;"><strong>Assigned Date & Time:</strong> {date_time}</p>
                <p style="margin: 5px 0 0 0;"><strong>Assigned By:</strong> {tl_name} ({tl_email})</p>
            </div>

            <p style="margin-top: 20px;">Please check your dashboard for more details.</p>
            <p>Regards,<br><strong>Reach Skyline Team</strong></p>
        </body>
        </html>
        """

        msg = MIMEMultipart("alternative")
        msg['From'] = sender_display
        msg['To'] = employee.email
        msg['Reply-To'] = tl_email
        msg['Subject'] = subject
        msg.attach(MIMEText(html_body, 'html'))

        with smtplib.SMTP(smtp_server, smtp_port) as server:
            server.starttls()
            server.login(smtp_user, smtp_password)
            server.send_message(msg)

        print(f"[DEBUG] Consolidated assignment email sent to {employee.email} for {task_count} tasks.")
        return True

    except Exception as e:
        print(f"[ERROR] Failed to send assignment notification: {str(e)}")
        return False
