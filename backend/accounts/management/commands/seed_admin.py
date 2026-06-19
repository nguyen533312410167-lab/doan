from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from accounts.models import Profile

User = get_user_model()


class Command(BaseCommand):
    help = "Create default admin user if none exists"

    def handle(self, *args, **options):
        email = "admin@financemanager.com"
        password = "123456789"

        if User.objects.filter(email=email).exists():
            self.stdout.write(f"Admin user {email} already exists")
            return

        user = User.objects.create_superuser(
            username="admin",
            email=email,
            password=password,
            first_name="Admin",
            last_name="",
            is_staff=True,
            is_superuser=True,
        )
        Profile.objects.get_or_create(user=user)
        self.stdout.write(self.style.SUCCESS(f"Created admin user: {email} / {password}"))