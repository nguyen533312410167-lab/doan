"""
Script migration: Chuyển đổi giao dịch cũ từ Mục tiêu tiết kiệm sang type SAVING.

Trước đây:
- Nạp tiền → tạo Transaction type=EXPENSE, category=Tiết Kiệm
- Rút tiền → tạo Transaction type=INCOME, category=Tiết Kiệm

Sau khi refactor:
- Nạp tiền → tạo Transaction type=SAVING, action=DEPOSIT
- Rút tiền → tạo Transaction type=SAVING, action=WITHDRAW

Script này sẽ:
1. Tìm các Transaction có category "Tiết Kiệm" / "Savings"
2. Xác định hành động dựa trên type cũ:
   - EXPENSE → DEPOSIT
   - INCOME → WITHDRAW
3. Cập nhật type và action
4. Lưu lại log để kiểm tra
"""

import os
import sys
import django
from decimal import Decimal

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)) + '/..')
django.setup()

from django.contrib.auth import get_user_model
from accounts.models import Category, Transaction, SavingGoal

User = get_user_model()

def get_savings_category():
    """Tìm category Tiết Kiệm (type=saving hoặc type=expense cũ)"""
    # Tìm category type=saving mới
    cat = Category.objects.filter(name_vi__iexact="tiết kiệm", type="saving").first()
    if cat:
        return cat
    # Tìm category type=expense cũ
    cat = Category.objects.filter(name_vi__iexact="tiết kiệm", type="expense").first()
    if cat:
        return cat
    # Tìm bằng name tiếng Anh
    cat = Category.objects.filter(name__iexact="savings", type="saving").first()
    if cat:
        return cat
    cat = Category.objects.filter(name__iexact="savings", type="expense").first()
    return cat

def migrate():
    savings_category = get_savings_category()
    
    if not savings_category:
        print("❌ Không tìm thấy category 'Tiết Kiệm'. Vui lòng tạo category này trước.")
        return
    
    print(f"✅ Tìm thấy category: {savings_category.name_vi} (type={savings_category.type})")
    
    # Tìm các giao dịch có category là Tiết Kiệm
    old_saving_txns = Transaction.objects.filter(category=savings_category)
    
    print(f"\n📊 Tìm thấy {old_saving_txns.count()} giao dịch liên quan đến Tiết Kiệm")
    
    migrated_deposit = 0
    migrated_withdraw = 0
    skipped = 0
    
    for txn in old_saving_txns:
        # Bỏ qua nếu đã là type saving
        if txn.type == "saving":
            print(f"  ⏭️  Bỏ qua ID={txn.id} (đã là type=saving)")
            skipped += 1
            continue
        
        # Xác định action dựa trên type cũ
        if txn.type == "expense":
            action = "deposit"
            migrated_deposit += 1
        elif txn.type == "income":
            action = "withdraw"
            migrated_withdraw += 1
        else:
            print(f"  ⚠️  Bỏ qua ID={txn.id} (type={txn.type} không xác định)")
            skipped += 1
            continue
        
        # Cập nhật transaction
        txn.type = "saving"
        txn.action = action
        txn.save()
        
        print(f"  ✅ ID={txn.id}: {action.upper()} {float(txn.amount):,.0f}₫")
    
    print(f"\n📈 Kết quả migration:")
    print(f"   - DEPOSIT (Nạp tiền): {migrated_deposit}")
    print(f"   - WITHDRAW (Rút tiền): {migrated_withdraw}")
    print(f"   - Bỏ qua: {skipped}")
    print(f"\n✅ Migration hoàn tất!")

if __name__ == "__main__":
    migrate()