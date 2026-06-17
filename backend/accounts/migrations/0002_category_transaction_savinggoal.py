from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="Category",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=64)),
                ("name_vi", models.CharField(blank=True, max_length=64)),
                ("type", models.CharField(choices=[("income", "Thu nhập"), ("expense", "Chi tiêu")], max_length=16)),
                ("icon", models.CharField(blank=True, max_length=32)),
                ("sort_order", models.IntegerField(default=0)),
                ("is_active", models.BooleanField(default=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
            ],
            options={
                "verbose_name_plural": "categories",
                "ordering": ["sort_order", "name"],
            },
        ),
        migrations.CreateModel(
            name="Transaction",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("type", models.CharField(choices=[("income", "Thu nhập"), ("expense", "Chi tiêu")], max_length=16)),
                ("amount", models.DecimalField(decimal_places=0, max_digits=15)),
                ("note", models.TextField(blank=True)),
                ("date", models.DateField()),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("category", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="transactions", to="accounts.category")),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="transactions", to=settings.AUTH_USER_MODEL)),
            ],
            options={
                "ordering": ["-date", "-created_at"],
            },
        ),
        migrations.CreateModel(
            name="SavingGoal",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=128)),
                ("target_amount", models.DecimalField(decimal_places=0, max_digits=15)),
                ("current_amount", models.DecimalField(decimal_places=0, default=0, max_digits=15)),
                ("due_date", models.DateField()),
                ("note", models.TextField(blank=True)),
                ("is_completed", models.BooleanField(default=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="saving_goals", to=settings.AUTH_USER_MODEL)),
            ],
            options={
                "ordering": ["due_date", "-created_at"],
            },
        ),
    ]