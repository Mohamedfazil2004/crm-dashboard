import sqlite3
import sqlalchemy
from sqlalchemy import inspect, Table, MetaData
from app import create_app
from app.extensions import db
import os
from dotenv import load_dotenv

# Load .env variables
load_dotenv()

def migrate_data():
    # 1. Initialize Flask app to get SQLAlchemy models and MySQL config
    app = create_app()
    
    # 2. Get SQLite database path (assumed to be in instance/local.db)
    sqlite_db_path = os.path.join(app.instance_path, 'local.db')
    if not os.path.exists(sqlite_db_path):
        print(f"Error: SQLite database not found at {sqlite_db_path}")
        return

    # 3. Establish source connection (SQLite)
    sqlite_uri = f"sqlite:///{sqlite_db_path}"
    sqlite_engine = sqlalchemy.create_engine(sqlite_uri)
    
    # 4. Establish destination connection (MySQL)
    # create_app() already configured db.engine with MySQL if configured in .env
    with app.app_context():
        mysql_engine = db.engine
        
        print("Creating tables in MySQL if they don't exist...")
        db.create_all()
        
        # Get metadata and inspector
        metadata = MetaData()
        metadata.reflect(bind=sqlite_engine)
        inspector = inspect(sqlite_engine)
        table_names = inspector.get_table_names()
        
        print(f"Found tables to migrate: {', '.join(table_names)}")
        
        for table_name in table_names:
            print(f"Migrating table: {table_name}...")
            
            # Read data from SQLite
            with sqlite_engine.connect() as sqlite_conn:
                result = sqlite_conn.execute(sqlalchemy.text(f"SELECT * FROM {table_name}"))
                rows = result.fetchall()
                keys = result.keys()
            
            if not rows:
                print(f"  Table {table_name} is empty. Skipping.")
                continue

            # Prepare records for insertion
            records = [dict(zip(keys, row)) for row in rows]
            
            # Insert into MySQL
            # We use core SQLAlchemy for bulk insertion to avoid model-specific issues
            target_table = Table(table_name, MetaData(), autoload_with=mysql_engine)
            
            with mysql_engine.connect() as mysql_conn:
                # Clear table in MySQL to prevent duplicate key errors
                print(f"  Clearing existing data in MySQL table: {table_name}...")
                mysql_conn.execute(target_table.delete())
                
                # Bulk insert
                mysql_conn.execute(target_table.insert(), records)
                mysql_conn.commit()
                
            print(f"  Successfully migrated {len(records)} records for {table_name}.")

    print("\nMigration completed successfully!")
    print("Record counts validation:")
    
    with app.app_context():
        for table_name in table_names:
            with sqlite_engine.connect() as s_conn:
                s_count = s_conn.execute(sqlalchemy.text(f"SELECT COUNT(*) FROM {table_name}")).scalar()
            with db.engine.connect() as m_conn:
                m_count = m_conn.execute(sqlalchemy.text(f"SELECT COUNT(*) FROM {table_name}")).scalar()
            
            status = "✓ MATCH" if s_count == m_count else "✗ MISMATCH"
            print(f"  Table {table_name:20}: SQLite({s_count}) | MySQL({m_count}) -> {status}")

if __name__ == "__main__":
    migrate_data()
