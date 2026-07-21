"""
Export all database data to a SQL backup file using Django ORM.
This bypasses pg_dump's catalog corruption issue.

Usage: docker compose exec backend python scripts/export_data.py > database_backup.sql

Restore: Run migrations first to create tables, then restore data:
  1. docker compose exec backend python manage.py migrate
  2. docker compose exec -T db psql -U app_user -d app_db < database_backup.sql
"""
import os
import sys
import django
from datetime import datetime

sys.path.append('/app')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth.models import User, Group, Permission
from django.contrib.contenttypes.models import ContentType
from django.contrib.sessions.models import Session
from django.contrib.admin.models import LogEntry
from accounts.models import Profile, Category, Transaction, SavingGoal, Notification, NotificationCampaign, CampaignRecipient

MODELS = [
    ContentType,
    Permission,
    Group,
    User,
    Profile,
    Category,
    Transaction,
    SavingGoal,
    Notification,
    NotificationCampaign,
    CampaignRecipient,
    LogEntry,
    Session,
]

def quote_sql(value):
    """Format a Python value for SQL."""
    if value is None:
        return 'NULL'
    if isinstance(value, bool):
        return 'TRUE' if value else 'FALSE'
    if isinstance(value, int):
        return str(value)
    if isinstance(value, float):
        return str(value)
    if isinstance(value, datetime):
        return f"'{value.isoformat()}'"
    if hasattr(value, 'isoformat'):
        return f"'{value.isoformat()}'"
    s = str(value)
    s = s.replace("'", "''")
    return f"'{s}'"

def serialize_row(model_class, obj):
    """Serialize a model instance as an INSERT statement."""
    table_name = model_class._meta.db_table
    
    col_names = []
    col_values = []
    
    for field in model_class._meta.concrete_fields:
        col_names.append(f'"{field.column}"')
        val = getattr(obj, field.attname, None)
        col_values.append(quote_sql(val))
    
    m2m_sql = []
    for field in model_class._meta.many_to_many:
        rel_manager = getattr(obj, field.name)
        through_model = field.remote_field.through
        source_fk = field.m2m_column_name()
        target_fk = field.m2m_reverse_name()
        
        if hasattr(obj, 'pk') and obj.pk is not None:
            related_ids = rel_manager.values_list('pk', flat=True)
            for rid in related_ids:
                m2m_sql.append(
                    f"INSERT INTO \"{through_model._meta.db_table}\" "
                    f"(\"{source_fk}\", \"{target_fk}\") "
                    f"VALUES ({quote_sql(obj.pk)}, {quote_sql(rid)});"
                )
    
    sql = f"INSERT INTO \"{table_name}\" ({', '.join(col_names)}) VALUES ({', '.join(col_values)});"
    return sql, m2m_sql

def main():
    print(f"-- Database Export")
    print(f"-- Generated: {datetime.now().isoformat()}")
    print(f"-- Django models data backup")
    print(f"--")
    print(f"-- Prerequisites: Tables must already exist via 'python manage.py migrate'")
    print(f"-- Usage: docker compose exec -T db psql -U app_user -d app_db < database_backup.sql\n")
    
    print("SET session_replication_role = 'replica';\n")
    
    for model_class in MODELS:
        table_name = model_class._meta.db_table
        print(f"\n-- ----------------------------------------")
        print(f"-- {model_class.__name__} (table: {table_name})")
        print(f"-- ----------------------------------------\n")
        
        try:
            objs = model_class.objects.all()
            count = objs.count()
            
            if count == 0:
                print(f"-- No data\n")
                continue
            
            print(f"-- {count} row(s)\n")
            
            all_m2m = []
            for obj in objs:
                insert_sql, m2m_sql = serialize_row(model_class, obj)
                print(insert_sql)
                all_m2m.extend(m2m_sql)
            
            if all_m2m:
                print(f"\n-- Many-to-many relationships\n")
                for s in all_m2m:
                    print(s)
                    
        except Exception as e:
            print(f"-- Error exporting {model_class.__name__}: {e}\n")
    
    # Sequence resets
    print(f"\n-- ----------------------------------------")
    print(f"-- Sequence resets")
    print(f"-- ----------------------------------------\n")
    
    for model_class in MODELS:
        table_name = model_class._meta.db_table
        pk_field = model_class._meta.pk
        if pk_field and pk_field.column:
            print(f"SELECT setval(pg_get_serial_sequence('{table_name}', '{pk_field.column}'), COALESCE((SELECT MAX(\"{pk_field.column}\") FROM \"{table_name}\"), 1));")
    
    print(f"\nSET session_replication_role = 'origin';\n")
    print(f"-- Export complete")

if __name__ == '__main__':
    main()