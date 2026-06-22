import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
django.setup()

from django.contrib.auth import get_user_model
User = get_user_model()

users = User.objects.filter(is_superuser=True)
print("Superusers found:")
for u in users:
    print(f"  - {u.username} ({u.email})")

if users.exists():
    admin = users.first()
    new_password = "admin123"
    admin.set_password(new_password)
    admin.save()
    print(f"\nPassword reset successful!")
    print(f"Username: {admin.username}")
    print(f"New password: {new_password}")
else:
    print("\nNo superuser found. Creating one...")
    admin = User.objects.create_superuser(
        username="admin",
        email="admin@example.com",
        password="admin123"
    )
    print(f"Superuser created!")
    print(f"Username: admin")
    print(f"Password: admin123")