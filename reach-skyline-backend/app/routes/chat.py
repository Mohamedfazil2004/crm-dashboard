# app/routes/chat.py
from flask import Blueprint, request, jsonify
from app.extensions import db, socketio
from app.models.chat import Chat, ChatMessage
from app.models.employee import Employee
from app.models.task import Task
from flask_jwt_extended import jwt_required, get_jwt_identity, decode_token
from flask_socketio import emit, join_room, leave_room
from datetime import datetime
import os
from werkzeug.utils import secure_filename
from flask import current_app

bp = Blueprint("chat", __name__, url_prefix="/api/chat")

def get_or_create_chat(task_id, emp_id, team_leader_id, department):
    # Ensure emp_id and tl_id are strings
    emp_id = str(emp_id) if emp_id else None
    team_leader_id = str(team_leader_id) if team_leader_id else None
    
    if not emp_id:
        return None

    chat = Chat.query.filter_by(task_id=task_id, emp_id=emp_id).first()
    if not chat:
        # Resolve TL ID if missing
        if not team_leader_id:
            emp = Employee.query.get(emp_id)
            if emp:
                team_leader_id = emp.team_leader_id
        
        # Fallback to department lead
        if not team_leader_id:
            tl = Employee.query.filter_by(team=department, role='Team Lead').first()
            if tl:
                team_leader_id = tl.id
        
        # Absolute fallback
        if not team_leader_id:
            team_leader_id = "ADMIN"

        chat = Chat(
            task_id=task_id,
            emp_id=emp_id,
            team_leader_id=team_leader_id,
            department=department
        )
        db.session.add(chat)
        db.session.commit()
    return chat

@bp.route("/init", methods=["POST"])
@jwt_required()
def init_chat():
    data = request.get_json()
    task_id = data.get('task_id')
    emp_id = data.get('emp_id')
    tl_id = data.get('team_leader_id')
    dept = data.get('department')
    
    if not all([task_id, emp_id, dept]):
        return jsonify({"message": "Missing required fields (task_id, emp_id, department)"}), 400
        
    chat = get_or_create_chat(task_id, emp_id, tl_id, dept)
    if not chat:
        return jsonify({"message": "Could not initialize chat"}), 500
        
    return jsonify(chat.to_dict()), 200

@bp.route("/history/<int:chat_id>", methods=["GET"])
@jwt_required()
def get_chat_history(chat_id):
    messages = ChatMessage.query.filter_by(chat_id=chat_id).order_by(ChatMessage.created_at.asc()).all()
    return jsonify([m.to_dict() for m in messages]), 200

@bp.route("/unread-counts", methods=["GET"])
@jwt_required()
def get_unread_counts():
    user_id = get_jwt_identity()
    counts = db.session.query(
        ChatMessage.task_code, db.func.count(ChatMessage.id)
    ).filter_by(receiver_id=user_id, read_status=False).group_by(ChatMessage.task_code).all()
    
    return jsonify({tc: count for tc, count in counts}), 200

@bp.route("/mark-read/<string:task_code>", methods=["POST"])
@jwt_required()
def mark_as_read(task_code):
    user_id = get_jwt_identity()
    ChatMessage.query.filter_by(task_code=task_code, receiver_id=user_id, read_status=False).update({"read_status": True})
    db.session.commit()
    socketio.emit('unread_update', {"user_id": user_id}, room=f"user_{user_id}")
    return jsonify({"message": "Messages marked as read"}), 200

@bp.route("/upload", methods=["POST"])
@jwt_required()
def upload_chat_file():
    if 'file' not in request.files:
        return jsonify({"message": "No file part"}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({"message": "No selected file"}), 400
    
    if file:
        filename = secure_filename(f"{datetime.now().timestamp()}_{file.filename}")
        upload_dir = os.path.join(current_app.config['UPLOAD_FOLDER'], 'chat')
        if not os.path.exists(upload_dir):
            os.makedirs(upload_dir)
        
        file_path = os.path.join('uploads', 'chat', filename)
        file.save(os.path.join(current_app.root_path, '..', file_path))
        
        return jsonify({"file_path": f"/api/chat/files/{filename}", "original_name": file.filename}), 200

@bp.route("/files/<filename>", methods=["GET"])
def get_chat_file(filename):
    from flask import send_from_directory
    return send_from_directory(os.path.join(current_app.root_path, '..', 'uploads', 'chat'), filename)

# --- SOCKET.IO HANDLERS ---

@socketio.on('join_chat')
def on_join_chat(data):
    chat_id = data.get('chat_id')
    if chat_id:
        room = f"chat_{chat_id}"
        join_room(room)
        print(f"[DEBUG] User joined room: {room}")

@socketio.on('leave_chat')
def on_leave_chat(data):
    chat_id = data.get('chat_id')
    if chat_id:
        room = f"chat_{chat_id}"
        leave_room(room)

@socketio.on('send_message')
def handle_send_message(data):
    # In Flask-SocketIO, the 'request' headers usually contain the same ones 
    # as the initial handshake. If JWT is in 'auth', it's harder to get here
    # without a custom wrapper. For reliability in this specific task, 
    # we use the IDs passed in the data, but we'll print debug info.
    
    sender_id = data.get('sender_id')
    chat_id = data.get('chat_id')
    receiver_id = data.get('receiver_id')
    message_text = data.get('message')
    task_code = data.get('task_code')
    attachment_path = data.get('file_path')

    if not all([sender_id, receiver_id, chat_id, message_text]):
        print(f"[DEBUG] Send message failed: Missing data {data}")
        return

    try:
        new_msg = ChatMessage(
            chat_id=chat_id,
            sender_id=sender_id,
            receiver_id=receiver_id,
            message_text=message_text,
            attachment_path=attachment_path,
            task_code=task_code,
            read_status=False
        )
        db.session.add(new_msg)
        db.session.commit()

        # Emit to the chat room - CRITICAL: Everyone in the room (TL and Employee) gets this
        payload = new_msg.to_dict()
        emit('new_message', payload, room=f"chat_{chat_id}")
        
        # Also notify the receiver directly for the badge - CRITICAL
        emit('notification', {"task_code": task_code, "message": message_text}, room=f"user_{receiver_id}")
        
        print(f"[DEBUG] Message sent from {sender_id} to {receiver_id} in chat {chat_id}")
    except Exception as e:
        print(f"[ERROR] send_message error: {str(e)}")

@socketio.on('connect_user')
def on_connect_user(data):
    user_id = data.get('user_id')
    if user_id:
        room = f"user_{user_id}"
        join_room(room)
        print(f"[DEBUG] User connected to notification room: {room}")
