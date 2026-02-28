from flask import Flask
from flask_cors import CORS
from app.extensions import db, migrate, jwt, socketio
from app.config import Config

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Enable CORS
    CORS(app, supports_credentials=True)

    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    socketio.init_app(app)

    # ===== IMPORT BLUEPRINTS =====
    from app.routes.auth import bp as auth_bp
    from app.routes.clients import bp as clients_bp
    from app.routes.dashboard import bp as dashboard_bp
    from app.routes.website import bp as website_bp
    from app.routes.branding import bp as branding_bp
    from app.routes.seo import bp as seo_bp
    from app.routes.campaign import bp as campaign_bp
    from app.routes.telecaller import bp as telecaller_bp
    from app.routes.tasks import bp as tasks_bp
    from app.routes.employees import employees_bp
    from app.routes.chat import bp as chat_bp
    from app.routes.media import bp as media_bp

    # ===== REGISTER BLUEPRINTS =====
    app.register_blueprint(auth_bp)
    app.register_blueprint(clients_bp)
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(website_bp)
    app.register_blueprint(branding_bp)
    app.register_blueprint(seo_bp)
    app.register_blueprint(campaign_bp)
    app.register_blueprint(telecaller_bp)
    app.register_blueprint(tasks_bp)
    app.register_blueprint(employees_bp)
    app.register_blueprint(chat_bp)
    app.register_blueprint(media_bp)

    # Initialize database and default admin (especially for production/Render)
    with app.app_context():
        from app.setup_default_admin import create_default_admin
        db.create_all()
        create_default_admin()

    return app
