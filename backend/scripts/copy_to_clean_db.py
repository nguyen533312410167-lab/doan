"""
Copy all data from the corrupted database (default) to the clean database (clean).
Run: docker compose exec backend python scripts/copy_to_clean_db.py
"""
import os
import sys
import django

sys.path.append('/app')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

# First configure the clean database in Django settings
from core import settings
settings.DATABASES['clean'] = {
    'ENGINE': 'django.db.backends.postgresql',
    'NAME': 'app_db_clean',
    'USER': 'app_user',
    'PASSWORD': 'app_password',
    'HOST': 'db',
    'PORT': '5432',
}

django.setup()

from django.contrib.auth.models import User, Group, Permission
from django.contrib.contenttypes.models import ContentType
from django.contrib.sessions.models import Session
from django.contrib.admin.models import LogEntry
from accounts.models import Profile, Category, Transaction, SavingGoal, Notification, NotificationCampaign, CampaignRecipient
from django.db import connections
from django.contrib.auth.hashers import make_password

# Models in dependency order (children first)
MODELS_DATA = [
    (ContentType, 'default', 'clean'),
    (Permission, 'default', 'clean'),
    (Group, 'default', 'clean'),
    (User, 'default', 'clean'),
    (Profile, 'default', 'clean'),
    (Category, 'default', 'clean'),
    (Transaction, 'default', 'clean'),
    (SavingGoal, 'default', 'clean'),
    (Notification, 'default', 'clean'),
    (NotificationCampaign, 'default', 'clean'),
    (CampaignRecipient, 'default', 'clean'),
    (Session, 'default', 'clean'),
]

def copy_data(ModelClass, from_db, to_db):
    """Copy all records from one database to another."""
    table_name = ModelClass._meta.db_table
    print(f"Copying {ModelClass.__name__} ({table_name})...", end=' ')
    
    try:
        objects = ModelClass.objects.using(from_db).all()
        count = objects.count()
        if count == 0:
            print(f"No data (0 rows)")
            return True
        
        # Get field names from meta
        fields = [field for field in ModelClass._meta.concrete_fields]
        
        # Create objects in the clean database
        for obj in objects:
            obj.save(using=to_db)
        
        print(f"OK ({count} rows)")
        return True
    except Exception as e:
        print(f"ERROR: {e}")
        return False

def copy_m2m(ModelClass, from_db, to_db):
    """Copy many-to-many relationships."""
    for field in ModelClass._meta.many_to_many:
        try:
            through = field.remote_field.through
            through_model = through if hasattr(through, '_meta') else through
            table_name = through_model._meta.db_table
            print(f"  Copying M2M {table_name}...", end=' ')
            
            # Use raw SQL to copy M2M through table
            with connections[from_db].cursor() as cursor:
                cursor.execute(f"SELECT * FROM \"{table_name}\"")
                rows = cursor.fetchall()
                
                if not rows:
                    print(f"No data (0 rows)")
                    continue
                
                # Get column names
                cursor.execute(f"SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='{table_name}' ORDER BY ordinal_position")
                cols = [row[0] for row in cursor.fetchall()]
                
                # Insert into clean database
                with connections[to_db].cursor() as clean_cursor:
                    placeholders = ', '.join(['%s'] * len(cols))
                    col_names = ', '.join(f'"{c}"' for c in cols)
                    
                    for row in rows:
                        clean_cursor.execute(
                            f"INSERT INTO \"{table_name}\" ({col_names}) VALUES ({placeholders})",
                            row
                        )
                
                print(f"OK ({len(rows)} rows)")
        except Exception as e:
            print(f"  M2M {getattr(field, 'name', 'unknown')}: ERROR: {e}")

def main():
    # First, drop all data from clean database and reset sequences
    print("Cleaning target database...")
    with connections['clean'].cursor() as cursor:
        cursor.execute("SET session_replication_role = 'replica';")
        for ModelClass, _, _ in MODELS_DATA:
            if ModelClass._meta.many_to_many:
                for field in ModelClass._meta.many_to_many:
                    try:
                        through = field.remote_field.through
                        through_model = through if hasattr(through, '_meta') else through
                        cursor.execute(f'TRUNCATE TABLE "{through_model._meta.db_table}" CASCADE')
                    except:
                        pass
            cursor.execute(f'TRUNCATE TABLE "{ModelClass._meta.db_table}" CASCADE')
        cursor.execute("SET session_replication_role = 'origin';")
    
    print("\nCopying data...\n")
    
    for ModelClass, from_db, to_db in MODELS_DATA:
        success = copy_data(ModelClass, from_db, to_db)
        if success:
            copy_m2m(ModelClass, from_db, to_db)
    
    print("\nDone!")

if __name__ == '__main__':
    main()