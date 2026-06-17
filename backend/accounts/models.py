from django.conf import settings
from django.db import models


def avatar_upload_path(instance, filename):
    return f"avatars/user_{instance.user_id}/{filename}"


class Profile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="profile")
    avatar = models.ImageField(upload_to=avatar_upload_path, blank=True, null=True)
    phone = models.CharField(max_length=32, blank=True)
    address = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Profile<{self.user_id}>"


class Category(models.Model):
    CATEGORY_TYPES = [
        ("income", "Thu nhập"),
        ("expense", "Chi tiêu"),
    ]
    name = models.CharField(max_length=64)
    name_vi = models.CharField(max_length=64, blank=True)
    type = models.CharField(max_length=16, choices=CATEGORY_TYPES)
    icon = models.CharField(max_length=32, blank=True)
    sort_order = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = "categories"
        ordering = ["sort_order", "name"]

    def __str__(self):
        return self.name_vi or self.name


class Transaction(models.Model):
    TRANSACTION_TYPES = [
        ("income", "Thu nhập"),
        ("expense", "Chi tiêu"),
    ]
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="transactions")
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True, related_name="transactions")
    type = models.CharField(max_length=16, choices=TRANSACTION_TYPES)
    amount = models.DecimalField(max_digits=15, decimal_places=0)
    note = models.TextField(blank=True)
    date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-date", "-created_at"]

    def __str__(self):
        return f"{self.get_type_display()} {self.amount} - {self.date}"


class SavingGoal(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="saving_goals")
    name = models.CharField(max_length=128)
    target_amount = models.DecimalField(max_digits=15, decimal_places=0)
    current_amount = models.DecimalField(max_digits=15, decimal_places=0, default=0)
    due_date = models.DateField()
    note = models.TextField(blank=True)
    is_completed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["due_date", "-created_at"]

    def __str__(self):
        return self.name