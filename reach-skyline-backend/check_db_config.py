from app import create_app

app = create_app()
print(f"ACTIVE DB URI: {app.config['SQLALCHEMY_DATABASE_URI']}")
