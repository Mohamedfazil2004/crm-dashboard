from app.extensions import db
from app.models.task import Task
import json


class WebWorkService:

    # ----------------------------------------------------
    # GET WEB-WORK PROGRESS FOR A TASK
    # ----------------------------------------------------
    @staticmethod
    def get_progress(task_id):
        task = Task.query.get(task_id)

        if not task:
            return {"success": False, "error": "Task not found"}

        if not task.is_web_work:
            return {"success": False, "error": "This is not a web-work task"}

        progress = json.loads(task.web_completion_json) if task.web_completion_json else {}

        # Default structure if empty
        default_progress = {
            "Website": progress.get("Website", False),
            "SEO": progress.get("SEO", False),
            "Branding": progress.get("Branding", False)
        }

        return {"success": True, "progress": default_progress}

    # ----------------------------------------------------
    # MARK WEBSITE PART COMPLETE
    # ----------------------------------------------------
    @staticmethod
    def website_complete(task_id):
        return WebWorkService._mark_step(task_id, "Website")

    # ----------------------------------------------------
    # MARK SEO PART COMPLETE
    # ----------------------------------------------------
    @staticmethod
    def seo_complete(task_id):
        return WebWorkService._mark_step(task_id, "SEO")

    # ----------------------------------------------------
    # MARK BRANDING PART COMPLETE
    # ----------------------------------------------------
    @staticmethod
    def branding_complete(task_id):
        return WebWorkService._mark_step(task_id, "Branding")

    # ----------------------------------------------------
    # MAIN INTERNAL FUNCTION FOR MARKING STEPS
    # ----------------------------------------------------
    @staticmethod
    def _mark_step(task_id, team_name):
        task = Task.query.get(task_id)

        if not task:
            return {"success": False, "error": "Task not found"}

        if not task.is_web_work:
            return {"success": False, "error": "This is not a web-work task"}

        # Load existing progress
        progress = json.loads(task.web_completion_json) if task.web_completion_json else {}

        # --------------------------------------------
        # ENFORCE WORK ORDER
        # Website → SEO → Branding
        # --------------------------------------------
        if team_name == "SEO" and not progress.get("Website", False):
            return {"success": False, "error": "Website step must be completed first"}

        if team_name == "Branding" and not progress.get("SEO", False):
            return {"success": False, "error": "SEO step must be completed first"}

        # Mark the step
        progress[team_name] = True

        # Save updated JSON
        task.web_completion_json = json.dumps(progress)
        db.session.commit()

        return {"success": True, "message": f"{team_name} step completed", "progress": progress}
