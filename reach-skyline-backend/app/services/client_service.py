from app.extensions import db
from app.models.client import Client
import json


class ClientService:

    # ----------------------------------------------------
    # CREATE NEW CLIENT
    # ----------------------------------------------------
    @staticmethod
    def create_client(data):
        try:
            client = Client(
                client_id=data.get("clientID"),
                client_name=data.get("clientName"),
                industry=data.get("industry"),
                delivery_date=data.get("deliveryDate"),
                phone=data.get("phone"),
                email=data.get("email"),
                total_requested=data.get("totalRequestedAmount", 0),
                total_completed=data.get("totalCompletedAmount", 0),
                status=data.get("status", "Pending"),
                requirements_json=json.dumps(data.get("requirements", {})),
                activity_codes_json=json.dumps(data.get("activityCodes", {})),
            )

            db.session.add(client)
            db.session.commit()
            return {"message": "Client created successfully", "success": True}

        except Exception as e:
            return {"success": False, "error": str(e)}

    # ----------------------------------------------------
    # GET ALL CLIENTS
    # ----------------------------------------------------
    @staticmethod
    def get_all_clients():
        clients = Client.query.all()
        return [c.to_dict() for c in clients]

    # ----------------------------------------------------
    # GET CLIENT BY CLIENT_ID
    # ----------------------------------------------------
    @staticmethod
    def get_client_by_id(client_id):
        return Client.query.filter_by(client_id=client_id).first()

    # ----------------------------------------------------
    # UPDATE CLIENT STATUS
    # ----------------------------------------------------
    @staticmethod
    def update_status(client_id, new_status):
        client = Client.query.filter_by(client_id=client_id).first()

        if not client:
            return {"success": False, "error": "Client not found"}

        client.status = new_status
        db.session.commit()

        return {"success": True, "message": "Status updated"}

    # ----------------------------------------------------
    # UPDATE REQUESTED / COMPLETED TOTALS
    # ----------------------------------------------------
    @staticmethod
    def update_totals(client_id, requested=None, completed=None):
        client = Client.query.filter_by(client_id=client_id).first()

        if not client:
            return {"success": False, "error": "Client not found"}

        if requested is not None:
            client.total_requested = requested

        if completed is not None:
            client.total_completed = completed

        db.session.commit()

        return {"success": True, "message": "Totals updated"}

    # ----------------------------------------------------
    # UPDATE REQUIREMENTS JSON
    # ----------------------------------------------------
    @staticmethod
    def update_requirements(client_id, requirements):
        client = Client.query.filter_by(client_id=client_id).first()

        if not client:
            return {"success": False, "error": "Client not found"}

        client.requirements_json = json.dumps(requirements)
        db.session.commit()

        return {"success": True, "message": "Requirements updated"}

    # ----------------------------------------------------
    # UPDATE ACTIVITY CODES JSON
    # ----------------------------------------------------
    @staticmethod
    def update_activity_codes(client_id, codes):
        client = Client.query.filter_by(client_id=client_id).first()

        if not client:
            return {"success": False, "error": "Client not found"}

        client.activity_codes_json = json.dumps(codes)
        db.session.commit()

        return {"success": True, "message": "Activity codes updated"}
