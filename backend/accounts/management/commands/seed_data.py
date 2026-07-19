import os
from datetime import date, timedelta
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from accounts.models import Profile, Category, Transaction, SavingGoal

User = get_user_model()


class Command(BaseCommand):
    help = "Seed initial data: categories, demo transactions, demo goals"

    def handle(self, *args, **options):
        self.stdout.write("Seeding data...")

        # ── Categories ──
        categories_data = [
            # Expense categories
            ("food", "Ăn uống", "expense", "rest", 1),
            ("transport", "Di chuyển", "expense", "car", 2),
            ("entertainment", "Giải trí", "expense", "smile", 3),
            ("utilities", "Điện/Nước", "expense", "thunderbolt", 4),
            ("shopping", "Mua sắm", "expense", "shopping-cart", 5),
            ("health", "Sức khỏe", "expense", "heart", 6),
            ("education", "Giáo dục", "expense", "book", 7),
            ("other_expense", "Khác", "expense", "ellipsis", 99),
            # Income categories
            ("salary", "Lương", "income", "dollar", 1),
            ("bonus", "Thưởng", "income", "gift", 2),
            ("investment", "Đầu tư", "income", "rise", 3),
            ("other_income", "Khác", "income", "ellipsis", 99),
        ]

        # Saving categories
        saving_categories_data = [
            ("emergency_fund", "Quỹ khẩn cấp", "saving", "safety", 1),
            ("car_purchase", "Mua xe", "saving", "car", 2),
            ("house_purchase", "Mua nhà", "saving", "home", 3),
            ("travel", "Du lịch", "saving", "compass", 4),
            ("investment", "Đầu tư", "saving", "rise", 5),
            ("education", "Học tập", "saving", "book", 6),
            ("other_saving", "Khác", "saving", "ellipsis", 99),
        ]
        categories_data.extend(saving_categories_data)

        created_count = 0
        for name, name_vi, typ, icon, sort_order in categories_data:
            _, created = Category.objects.get_or_create(
                name=name,
                defaults={
                    "name_vi": name_vi,
                    "type": typ,
                    "icon": icon,
                    "sort_order": sort_order,
                },
            )
            if created:
                created_count += 1

        # Ensure there is at least one Saving category for transactions
        if not Category.objects.filter(type="saving").exists():
            Category.objects.create(
                name="Savings",
                name_vi="Tiết Kiệm",
                type="saving",
                icon="dollar",
                sort_order=999,
            )

        self.stdout.write(f"  Created {created_count} categories")

        # ── Demo transactions for existing users ──
        for user in User.objects.all():
            if Transaction.objects.filter(user=user).exists():
                continue

            today = date.today()
            food_cat = Category.objects.filter(name="food").first()
            transport_cat = Category.objects.filter(name="transport").first()
            entertainment_cat = Category.objects.filter(name="entertainment").first()
            salary_cat = Category.objects.filter(name="salary").first()

            demo_txns = [
                {"type": "expense", "amount": 150000, "category": food_cat, "note": "Ăn trưa", "date": today - timedelta(days=5)},
                {"type": "expense", "amount": 300000, "category": transport_cat, "note": "Xăng xe", "date": today - timedelta(days=3)},
                {"type": "expense", "amount": 2000000, "category": entertainment_cat, "note": "Xem phim + ăn tối", "date": today - timedelta(days=7)},
                {"type": "income", "amount": 15000000, "category": salary_cat, "note": "Lương tháng", "date": today - timedelta(days=2)},
            ]

            for txn_data in demo_txns:
                Transaction.objects.create(user=user, **txn_data)

            self.stdout.write(f"  Created demo transactions for {user.username}")

        # ── Demo saving goals for existing users ──
        for user in User.objects.all():
            if SavingGoal.objects.filter(user=user).exists():
                continue

            demo_goals = [
                {"name": "Tiết kiệm mua xe", "target_amount": 50000000, "current_amount": 20000000, "due_date": today + timedelta(days=180)},
                {"name": "Du lịch nước ngoài", "target_amount": 30000000, "current_amount": 15000000, "due_date": today + timedelta(days=150)},
                {"name": "Quỹ khẩn cấp", "target_amount": 10000000, "current_amount": 8000000, "due_date": today + timedelta(days=90)},
            ]

            for goal_data in demo_goals:
                SavingGoal.objects.create(user=user, **goal_data)

            self.stdout.write(f"  Created demo goals for {user.username}")

        self.stdout.write(self.style.SUCCESS("Seed completed!"))