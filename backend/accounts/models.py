from django.conf import settings
from django.db import models
from decimal import Decimal

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
        ("saving", "Tiết kiệm"),
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
        ("saving", "Tiết kiệm"),
    ]
    ACTION_TYPES = [
        ("deposit", "Nạp tiền"),
        ("withdraw", "Rút tiền"),
        ("close", "Tất toán"),
        ("none", "Không có"),
    ]
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="transactions")
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True, related_name="transactions")
    saving_goal = models.ForeignKey("SavingGoal", on_delete=models.SET_NULL, null=True, blank=True, related_name="transactions")
    type = models.CharField(max_length=16, choices=TRANSACTION_TYPES)
    action = models.CharField(max_length=16, choices=ACTION_TYPES, default="none")
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
    current_amount = models.DecimalField(max_digits=15,decimal_places=0,default=Decimal("0"))
    due_date = models.DateField()
    note = models.TextField(blank=True)
    is_completed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["due_date", "-created_at"]

    def __str__(self):
        return self.name


class Notification(models.Model):
    NOTIFICATION_TYPES = [
        ("system", "Hệ thống"),
        ("admin", "Quản trị viên"),
    ]

    NOTIFICATION_CATEGORIES = [
        ("success", "Thành công"),
        ("info", "Thông tin"),
        ("warning", "Cảnh báo"),
        ("error", "Lỗi"),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="notifications")
    title = models.CharField(max_length=255)
    message = models.TextField()
    type = models.CharField(max_length=16, choices=NOTIFICATION_TYPES, default="system")
    category = models.CharField(max_length=16, choices=NOTIFICATION_CATEGORIES, default="info")
    sender = models.CharField(max_length=64, blank=True, default="")
    is_read = models.BooleanField(default=False)
    link = models.CharField(max_length=255, blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"[{self.get_type_display()}] {self.title}"


class NotificationCampaign(models.Model):
    TARGET_TYPES = [
        ("ALL", "Gửi tất cả User"),
        ("SELECTED", "Chọn User cụ thể"),
    ]

    STATUS_CHOICES = [
        ("draft", "Bản nháp"),
        ("sent", "Đã gửi"),
    ]

    title = models.CharField(max_length=255)
    message = models.TextField()
    category = models.CharField(max_length=16, choices=Notification.NOTIFICATION_CATEGORIES, default="info")
    target_type = models.CharField(max_length=16, choices=TARGET_TYPES, default="ALL")
    link = models.CharField(max_length=255, blank=True, default="")
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default="draft")
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="campaigns")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Campaign<{self.title}> [{self.get_status_display()}]"


class CampaignRecipient(models.Model):
    """
    Lưu danh sách User được chọn nếu target_type = SELECTED.
    """
    campaign = models.ForeignKey(NotificationCampaign, on_delete=models.CASCADE, related_name="recipients")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="campaign_recipients")

    class Meta:
        unique_together = ("campaign", "user")

    def __str__(self):
        return f"{self.campaign.title} -> {self.user.username}"