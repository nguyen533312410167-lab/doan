from django.contrib import admin
from .models import Profile, Category, Transaction, SavingGoal



@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "user",
        "phone",
        "address",
        "created_at",
    )

    search_fields = (
        "user__username",
        "phone",
        "address",
    )

    list_filter = (
        "created_at",
    )

    ordering = (
        "-created_at",
    )


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "name",
        "name_vi",
        "type",
        "is_active",
        "sort_order",
    )

    search_fields = (
        "name",
        "name_vi",
    )

    list_filter = (
        "type",
        "is_active",
    )

    ordering = (
        "sort_order",
        "name",
    )


@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "user",
        "type",
        "amount",
        "category",
        "date",
        "created_at",
    )

    search_fields = (
        "user__username",
        "note",
    )

    list_filter = (
        "type",
        "category",
        "date",
    )

    ordering = (
        "-date",
        "-created_at",
    )


@admin.register(SavingGoal)
class SavingGoalAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "user",
        "name",
        "target_amount",
        "current_amount",
        "progress",
        "is_completed",
        "due_date",
    )

    search_fields = (
        "user__username",
        "name",
    )

    list_filter = (
        "is_completed",
        "due_date",
    )

    def progress(self, obj):
        if obj.target_amount == 0:
            return "0%"

        percent = (obj.current_amount / obj.target_amount) * 100
        return f"{percent:.1f}%"

    progress.short_description = "Progress"