"""
Notification Service — sinh Notification tự động sau các thao tác thành công.
Được gọi từ mutation, đảm bảo chỉ tạo Notification khi DB transaction commit.
"""

from django.contrib.auth import get_user_model
from .models import Notification

User = get_user_model()


def notify_transaction_created(user, transaction):
    """
    Gửi thông báo khi User thêm giao dịch mới.
    """
    txn_type = "Thu nhập" if transaction.type == "income" else "Chi tiêu"
    category_name = ""
    if transaction.category:
        category_name = transaction.category.name_vi or transaction.category.name

    Notification.objects.create(
        user=user,
        title=f"Đã thêm giao dịch {txn_type}",
        message=f"Bạn vừa thêm giao dịch {txn_type.lower()} {category_name}: {float(transaction.amount):,.0f}₫",
        type="system",
        category="success",
        sender="Hệ thống",
        link="/transactions",
    )


def notify_transaction_updated(user, transaction):
    """
    Gửi thông báo khi User sửa giao dịch.
    """
    txn_type = "Thu nhập" if transaction.type == "income" else "Chi tiêu"
    Notification.objects.create(
        user=user,
        title=f"Đã cập nhật giao dịch",
        message=f"Giao dịch {txn_type.lower()} đã được cập nhật: {float(transaction.amount):,.0f}₫",
        type="system",
        category="info",
        sender="Hệ thống",
        link="/transactions",
    )


def notify_transaction_deleted(user, transaction_type, amount):
    """
    Gửi thông báo khi User xóa giao dịch.
    """
    txn_type = "Thu nhập" if transaction_type == "income" else "Chi tiêu"
    Notification.objects.create(
        user=user,
        title=f"Đã xóa giao dịch",
        message=f"Giao dịch {txn_type.lower()} {amount:,.0f}₫ đã được xóa",
        type="system",
        category="warning",
        sender="Hệ thống",
        link="/transactions",
    )


def notify_goal_created(user, goal):
    """
    Gửi thông báo khi User tạo mục tiêu tiết kiệm mới.
    """
    Notification.objects.create(
        user=user,
        title="Đã tạo mục tiêu tiết kiệm",
        message=f"Mục tiêu \"{goal.name}\" với số tiền {float(goal.target_amount):,.0f}₫ đã được tạo",
        type="system",
        category="success",
        sender="Hệ thống",
        link="/goals",
    )


def notify_goal_completed(user, goal):
    """
    Gửi thông báo khi User hoàn thành mục tiêu tiết kiệm.
    """
    Notification.objects.create(
        user=user,
        title="🎉 Hoàn thành mục tiêu tiết kiệm!",
        message=f"Chúc mừng! Bạn đã hoàn thành mục tiêu \"{goal.name}\" với {float(goal.target_amount):,.0f}₫",
        type="system",
        category="success",
        sender="Hệ thống",
        link="/goals",
    )


def notify_goal_deposit(user, goal, amount):
    """
    Gửi thông báo khi User nạp tiền vào mục tiêu.
    Nếu hoàn thành mục tiêu thì dùng notify_goal_completed thay vì hàm này.
    """
    progress = float(goal.current_amount) / float(goal.target_amount) * 100 if goal.target_amount > 0 else 0
    Notification.objects.create(
        user=user,
        title="Đã nạp tiền vào mục tiêu",
        message=f"Nạp {amount:,.0f}₫ vào \"{goal.name}\" (Hoàn thành {progress:.0f}%)",
        type="system",
        category="info",
        sender="Hệ thống",
        link="/goals",
    )


def notify_goal_withdraw(user, goal, amount):
    """
    Gửi thông báo khi User rút tiền từ mục tiêu.
    """
    Notification.objects.create(
        user=user,
        title="Đã rút tiền từ mục tiêu",
        message=f"Rút {amount:,.0f}₫ từ \"{goal.name}\"",
        type="system",
        category="warning",
        sender="Hệ thống",
        link="/goals",
    )


def notify_new_income(user, transaction):
    """
    Gửi thông báo thu nhập mới.
    """
    category_name = ""
    if transaction.category:
        category_name = transaction.category.name_vi or transaction.category.name
    Notification.objects.create(
        user=user,
        title="💵 Thu nhập mới",
        message=f"Nhận {float(transaction.amount):,.0f}₫{(' từ ' + category_name) if category_name else ''}",
        type="system",
        category="success",
        sender="Hệ thống",
        link="/transactions",
    )


def notify_check_goal_completion(user, goal):
    """
    Kiểm tra nếu goal vừa hoàn thành thì gửi thông báo.
    """
    if goal.is_completed:
        notify_goal_completed(user, goal)
        return True
    return False