import graphene
from django.contrib.auth import get_user_model
from django.core.exceptions import PermissionDenied, ValidationError
from django.core.validators import validate_email
from django.db.models import Q, Sum
from graphene_django import DjangoObjectType
from graphene_file_upload.scalars import Upload
from graphql import GraphQLError
from decimal import Decimal

from .models import Profile, Category, Transaction, SavingGoal, Notification, NotificationCampaign, CampaignRecipient
from .services import (
    notify_transaction_created,
    notify_transaction_updated,
    notify_transaction_deleted,
    notify_goal_created,
    notify_goal_deposit,
    notify_goal_withdraw,
    notify_check_goal_completion,
    notify_new_income,
)


User = get_user_model()


def require_auth(info):
    user = info.context.user
    if not user.is_authenticated:
        raise PermissionDenied("Authentication is required.")
    return user


def require_staff(info):
    user = require_auth(info)
    if not user.is_staff:
        raise PermissionDenied("Staff permission is required.")
    return user


def normalize_email(email):
    return (email or "").strip().lower()


# ──── Profile ────

class ProfileType(DjangoObjectType):
    avatar_url = graphene.String()

    class Meta:
        model = Profile
        fields = ("id", "avatar", "phone", "address", "created_at", "updated_at")

    def resolve_avatar_url(self, info):
        if not self.avatar:
            return None
        request = info.context
        url = self.avatar.url
        if request and hasattr(request, 'get_host'):
            return f"{request.scheme}://{request.get_host()}{url}"
        return url


# ──── User ────

class UserType(DjangoObjectType):
    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "is_active",
            "is_staff",
            "date_joined",
            "last_login",
            "profile",
        )


# ──── Category ────

class CategoryType(DjangoObjectType):
    class Meta:
        model = Category
        fields = ("id", "name", "name_vi", "type", "icon", "sort_order", "is_active")


# ──── Transaction ────

class TransactionType(DjangoObjectType):
    category_name = graphene.String()
    action_display = graphene.String()
    saving_goal_name = graphene.String()

    class Meta:
        model = Transaction
        fields = (
            "id", "user", "category", "saving_goal", "type", "action", "amount",
            "note", "date", "created_at", "updated_at",
        )

    def resolve_category_name(self, info):
        if self.category:
            return self.category.name_vi or self.category.name
        return None

    def resolve_action_display(self, info):
        if self.action and self.action != "none":
            return self.get_action_display()
        return None

    def resolve_saving_goal_name(self, info):
        if self.saving_goal:
            return self.saving_goal.name
        return None


# ──── Saving Goal ────

class SavingGoalType(DjangoObjectType):
    progress_percent = graphene.Float()
    days_left = graphene.Int()

    class Meta:
        model = SavingGoal
        fields = (
            "id", "user", "name", "target_amount", "current_amount",
            "due_date", "note", "is_completed", "created_at", "updated_at",
        )
    def resolve_progress_percent(self, info):
        from decimal import Decimal
        target = Decimal(str(self.target_amount))
        current = Decimal(str(self.current_amount))
        if target > Decimal("0"):
            return float(current / target * 100)
        return 0

    def resolve_days_left(self, info):
        from datetime import date
        delta = self.due_date - date.today()
        return delta.days


# ──── User Mutations ────

class Register(graphene.Mutation):
    class Arguments:
        username = graphene.String(required=True)
        email = graphene.String(required=True)
        password = graphene.String(required=True)
        first_name = graphene.String()
        last_name = graphene.String()

    user = graphene.Field(UserType)

    @classmethod
    def mutate(cls, root, info, username, email, password, first_name="", last_name=""):
        email = normalize_email(email)
        try:
            validate_email(email)
        except ValidationError as exc:
            raise GraphQLError("Invalid email address.") from exc

        if User.objects.filter(username=username).exists():
            raise GraphQLError("Username already exists.")
        if User.objects.filter(email=email).exists():
            raise GraphQLError("Email already exists.")

        user = User.objects.create_user(
            username=username.strip(),
            email=email,
            password=password,
            first_name=(first_name or "").strip(),
            last_name=(last_name or "").strip(),
        )
        Profile.objects.create(user=user)
        return Register(user=user)


class CreateUser(graphene.Mutation):
    class Arguments:
        username = graphene.String(required=True)
        email = graphene.String(required=True)
        password = graphene.String(required=True)
        first_name = graphene.String()
        last_name = graphene.String()
        is_active = graphene.Boolean()
        is_staff = graphene.Boolean()

    user = graphene.Field(UserType)

    @classmethod
    def mutate(cls, root, info, username, email, password, first_name="", last_name="", is_active=True, is_staff=False):
        require_staff(info)
        email = normalize_email(email)
        if User.objects.filter(username=username).exists():
            raise GraphQLError("Username already exists.")
        if User.objects.filter(email=email).exists():
            raise GraphQLError("Email already exists.")

        user = User.objects.create_user(
            username=username.strip(),
            email=email,
            password=password,
            first_name=(first_name or "").strip(),
            last_name=(last_name or "").strip(),
            is_active=is_active,
            is_staff=is_staff,
        )
        Profile.objects.create(user=user)
        return CreateUser(user=user)


class UpdateUser(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)
        email = graphene.String()
        first_name = graphene.String()
        last_name = graphene.String()
        is_active = graphene.Boolean()
        is_staff = graphene.Boolean()
        phone = graphene.String()
        address = graphene.String()

    user = graphene.Field(UserType)

    @classmethod
    def mutate(cls, root, info, id, **kwargs):
        require_staff(info)
        try:
            user = User.objects.select_related("profile").get(pk=id)
        except User.DoesNotExist as exc:
            raise GraphQLError("User not found.") from exc

        for field in ("email", "first_name", "last_name", "is_active", "is_staff"):
            if field in kwargs and kwargs[field] is not None:
                value = normalize_email(kwargs[field]) if field == "email" else kwargs[field]
                setattr(user, field, value)
        user.save()

        profile, _ = Profile.objects.get_or_create(user=user)
        for field in ("phone", "address"):
            if field in kwargs and kwargs[field] is not None:
                setattr(profile, field, kwargs[field])
        profile.save()

        return UpdateUser(user=user)


class UpdateMe(graphene.Mutation):
    class Arguments:
        email = graphene.String()
        first_name = graphene.String()
        last_name = graphene.String()
        phone = graphene.String()
        address = graphene.String()

    user = graphene.Field(UserType)

    @classmethod
    def mutate(cls, root, info, **kwargs):
        user = require_auth(info)
        for field in ("email", "first_name", "last_name"):
            if field in kwargs and kwargs[field] is not None:
                value = normalize_email(kwargs[field]) if field == "email" else kwargs[field]
                setattr(user, field, value)
        user.save()

        profile, _ = Profile.objects.get_or_create(user=user)
        for field in ("phone", "address"):
            if field in kwargs and kwargs[field] is not None:
                setattr(profile, field, kwargs[field])
        profile.save()
        return UpdateMe(user=user)


class UploadAvatar(graphene.Mutation):
    class Arguments:
        file = Upload(required=True)
        user_id = graphene.ID()

    user = graphene.Field(UserType)

    @classmethod
    def mutate(cls, root, info, file, user_id=None):
        current_user = require_auth(info)
        target_user = current_user

        if user_id:
            if not current_user.is_staff and str(current_user.id) != str(user_id):
                raise PermissionDenied("You cannot update another user's avatar.")
            try:
                target_user = User.objects.get(pk=user_id)
            except User.DoesNotExist as exc:
                raise GraphQLError("User not found.") from exc

        profile, _ = Profile.objects.get_or_create(user=target_user)
        profile.avatar = file
        profile.save()
        return UploadAvatar(user=target_user)


class DeleteUser(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)

    ok = graphene.Boolean()

    @classmethod
    def mutate(cls, root, info, id):
        current_user = require_staff(info)
        if str(current_user.id) == str(id):
            raise GraphQLError("You cannot delete your own account.")
        deleted, _ = User.objects.filter(pk=id).delete()
        return DeleteUser(ok=deleted > 0)


# ──── Category Mutations ────

class CreateCategory(graphene.Mutation):
    class Arguments:
        name = graphene.String(required=True)
        name_vi = graphene.String()
        type = graphene.String(required=True)
        icon = graphene.String()
        sort_order = graphene.Int()

    category = graphene.Field(CategoryType)

    @classmethod
    def mutate(cls, root, info, name, type, name_vi="", icon="", sort_order=0):
        require_staff(info)
        category = Category.objects.create(
            name=name, name_vi=name_vi, type=type,
            icon=icon, sort_order=sort_order
        )
        return CreateCategory(category=category)


class UpdateCategory(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)
        name = graphene.String()
        name_vi = graphene.String()
        type = graphene.String()
        icon = graphene.String()
        sort_order = graphene.Int()
        is_active = graphene.Boolean()

    category = graphene.Field(CategoryType)

    @classmethod
    def mutate(cls, root, info, id, **kwargs):
        require_staff(info)
        try:
            category = Category.objects.get(pk=id)
        except Category.DoesNotExist as exc:
            raise GraphQLError("Category not found.") from exc

        for field in ("name", "name_vi", "type", "icon", "sort_order", "is_active"):
            if field in kwargs and kwargs[field] is not None:
                setattr(category, field, kwargs[field])
        category.save()
        return UpdateCategory(category=category)


class DeleteCategory(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)

    ok = graphene.Boolean()

    @classmethod
    def mutate(cls, root, info, id):
        require_staff(info)
        deleted, _ = Category.objects.filter(pk=id).delete()
        return DeleteCategory(ok=deleted > 0)


# ──── Transaction Mutations ────

class CreateTransaction(graphene.Mutation):
    class Arguments:
        transaction_type = graphene.String(required=True)
        amount = graphene.String(required=True)
        category_id = graphene.ID()
        saving_goal_id = graphene.ID()
        action = graphene.String(default_value="none")
        note = graphene.String()
        date = graphene.String(required=True)

    transaction = graphene.Field(TransactionType)

    @classmethod
    def mutate(cls, root, info, transaction_type, amount, date, category_id=None, saving_goal_id=None, action="none", note=""):
        user = require_auth(info)
        txn_amount = float(amount)

        # Validate balance for expense transactions
        if transaction_type == 'expense':
            check_expense_balance(user, txn_amount)

        category = None
        if category_id:
            try:
                category = Category.objects.get(pk=category_id)
            except Category.DoesNotExist:
                pass

        saving_goal = None
        if saving_goal_id:
            try:
                saving_goal = SavingGoal.objects.get(pk=saving_goal_id, user=user)
            except SavingGoal.DoesNotExist:
                pass

        from datetime import datetime
        parsed_date = datetime.strptime(date, "%Y-%m-%d").date()
        txn = Transaction.objects.create(
            user=user, amount=amount,
            category=category, saving_goal=saving_goal,
            type=transaction_type, action=action,
            note=note, date=parsed_date,
        )

        # Auto-generate notifications
        notify_transaction_created(user, txn)
        if transaction_type == 'income':
            notify_new_income(user, txn)

        return CreateTransaction(transaction=txn)


class UpdateTransaction(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)
        transaction_type = graphene.String()
        amount = graphene.String()
        category_id = graphene.ID()
        saving_goal_id = graphene.ID()
        action = graphene.String()
        note = graphene.String()
        date = graphene.String()

    transaction = graphene.Field(TransactionType)

    @classmethod
    def mutate(cls, root, info, id, **kwargs):
        user = require_auth(info)
        try:
            txn = Transaction.objects.get(pk=id, user=user)
        except Transaction.DoesNotExist as exc:
            raise GraphQLError("Transaction not found.") from exc

        # Determine new type and amount for balance validation
        new_type = kwargs.get("transaction_type", txn.type)
        new_amount = float(kwargs.get("amount", txn.amount))

        # Check balance if this is/will be an expense transaction
        if new_type == 'expense':
            check_expense_balance(user, new_amount, exclude_txn_id=id)

        if "transaction_type" in kwargs and kwargs["transaction_type"] is not None:
            txn.type = kwargs["transaction_type"]
        if "amount" in kwargs and kwargs["amount"] is not None:
            txn.amount = kwargs["amount"]
        if "category_id" in kwargs and kwargs["category_id"] is not None:
            try:
                txn.category = Category.objects.get(pk=kwargs["category_id"])
            except Category.DoesNotExist:
                txn.category = None
        if "saving_goal_id" in kwargs and kwargs["saving_goal_id"] is not None:
            try:
                txn.saving_goal = SavingGoal.objects.get(pk=kwargs["saving_goal_id"], user=user)
            except SavingGoal.DoesNotExist:
                txn.saving_goal = None
        if "action" in kwargs and kwargs["action"] is not None:
            txn.action = kwargs["action"]
        if "note" in kwargs and kwargs["note"] is not None:
            txn.note = kwargs["note"]
        if "date" in kwargs and kwargs["date"] is not None:
            from datetime import datetime
            txn.date = datetime.strptime(kwargs["date"], "%Y-%m-%d").date()
        txn.save()

        # Auto-generate notification after update
        notify_transaction_updated(user, txn)

        return UpdateTransaction(transaction=txn)


class DeleteTransaction(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)

    ok = graphene.Boolean()

    @classmethod
    def mutate(cls, root, info, id):
        user = require_auth(info)
        try:
            txn = Transaction.objects.get(pk=id, user=user)
        except Transaction.DoesNotExist as exc:
            raise GraphQLError("Transaction not found.") from exc

        # Capture details before deletion for notification
        txn_type = txn.type
        txn_amount = float(txn.amount)

        txn.delete()
        notify_transaction_deleted(user, txn_type, txn_amount)
        return DeleteTransaction(ok=True)


# ──── Helper: get-or-create Tiết Kiệm category ────

def get_savings_category():
    """Find or auto-create the Tiết Kiệm saving category."""
    cat = Category.objects.filter(
        name_vi__iexact="tiết kiệm",
        type="saving"
    ).first()
    if not cat:
        cat = Category.objects.filter(
            name__iexact="savings",
            type="saving"
        ).first()
    if not cat:
        cat = Category.objects.create(
            name="Savings",
            name_vi="Tiết Kiệm",
            type="saving",
            sort_order=999,
        )
    return cat


# ──── Helper: calculate user balance from transactions ────

def get_user_balance(user):
    """
    Calculate current balance = total income - total expense - net saving.
    Net saving = sum of SAVING(deposit) - sum of SAVING(withdraw) - sum of SAVING(close).
    """
    from django.db.models import Sum
    income_sum = Transaction.objects.filter(user=user, type='income').aggregate(s=Sum('amount'))['s'] or 0
    expense_sum = Transaction.objects.filter(user=user, type='expense').aggregate(s=Sum('amount'))['s'] or 0
    saving_deposit = Transaction.objects.filter(user=user, type='saving', action='deposit').aggregate(s=Sum('amount'))['s'] or 0
    saving_withdraw = Transaction.objects.filter(user=user, type='saving', action='withdraw').aggregate(s=Sum('amount'))['s'] or 0
    saving_close = Transaction.objects.filter(user=user, type='saving', action='close').aggregate(s=Sum('amount'))['s'] or 0
    net_saving = float(saving_deposit) - float(saving_withdraw) - float(saving_close)
    return float(income_sum) - float(expense_sum) - net_saving


def check_expense_balance(user, expense_amount, exclude_txn_id=None):
    """
    Validate that user has enough balance for an expense transaction.
    If exclude_txn_id is provided, exclude that transaction from balance calc (for updates).
    Raises GraphQLError if balance would go negative.
    """
    if float(expense_amount) <= 0:
        return  # Skip check for zero/negative amounts (handled elsewhere)

    balance = get_user_balance(user)

    # If updating, exclude the old transaction amount from balance
    if exclude_txn_id:
        try:
            old_txn = Transaction.objects.get(pk=exclude_txn_id, user=user)
            if old_txn.type == 'expense':
                balance += float(old_txn.amount)
        except Transaction.DoesNotExist:
            pass

    if float(balance) < float(expense_amount):
        formatted_balance = f"{balance:,.0f}₫"
        raise GraphQLError(
            f"Số dư hiện tại không đủ để thực hiện giao dịch này. "
            f"Số dư: {formatted_balance}. "
            f"Vui lòng giảm số tiền hoặc thêm thu nhập."
        )


# ──── Saving Goal Mutations ────

class CreateSavingGoal(graphene.Mutation):
    class Arguments:
        name = graphene.String(required=True)
        target_amount = graphene.String(required=True)
        due_date = graphene.String(required=True)
        note = graphene.String()

    saving_goal = graphene.Field(SavingGoalType)

    @classmethod
    def mutate(cls, root, info, name, target_amount, due_date, note=""):
        user = require_auth(info)
        from datetime import datetime
        parsed_date = datetime.strptime(due_date, "%Y-%m-%d").date()
        goal = SavingGoal.objects.create(
            user=user, name=name,
            target_amount=Decimal(target_amount),
            due_date=parsed_date, note=note,
        )

        # Auto-generate notification
        notify_goal_created(user, goal)

        return CreateSavingGoal(saving_goal=goal)


class UpdateSavingGoal(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)
        name = graphene.String()
        target_amount = graphene.String()
        current_amount = graphene.String()
        due_date = graphene.String()
        note = graphene.String()
        is_completed = graphene.Boolean()

    saving_goal = graphene.Field(SavingGoalType)

    @classmethod
    def mutate(cls, root, info, id, **kwargs):
        user = require_auth(info)
        try:
            goal = SavingGoal.objects.get(pk=id, user=user)
        except SavingGoal.DoesNotExist as exc:
            raise GraphQLError("Saving goal not found.") from exc

        for field in ("name", "note", "is_completed"):
            if field in kwargs and kwargs[field] is not None:
                setattr(goal, field, kwargs[field])

        # Chuyển string → Decimal cho trường số để tránh lỗi type comparison
        for field in ("target_amount", "current_amount"):
            if field in kwargs and kwargs[field] is not None:
                setattr(goal, field, Decimal(kwargs[field]))
        if "due_date" in kwargs and kwargs["due_date"] is not None:
            from datetime import datetime
            goal.due_date = datetime.strptime(kwargs["due_date"], "%Y-%m-%d").date()
        goal.save()
        return UpdateSavingGoal(saving_goal=goal)


class DeleteSavingGoal(graphene.Mutation):
    """
    Tất toán mục tiêu tiết kiệm.
    - Chuyển toàn bộ số tiền về số dư khả dụng.
    - Tạo Transaction SAVING + CLOSE (không phải INCOME).
    - Đặt current_amount = 0 và đánh dấu is_completed = True.
    """
    class Arguments:
        id = graphene.ID(required=True)

    ok = graphene.Boolean()
    transaction = graphene.Field(TransactionType)

    @classmethod
    def mutate(cls, root, info, id):
        from datetime import date

        user = require_auth(info)
        try:
            goal = SavingGoal.objects.get(pk=id, user=user)
        except SavingGoal.DoesNotExist as exc:
            raise GraphQLError("Không tìm thấy mục tiêu tiết kiệm.") from exc

        remaining = float(goal.current_amount)

        # Validation: Không cho phép tất toán nếu current_amount = 0
        if remaining <= 0:
            raise GraphQLError("Mục tiêu này không còn tiền để tất toán.")

        txn = None

        # Tạo Transaction SAVING + CLOSE
        savings_category = get_savings_category()
        txn = Transaction.objects.create(
            user=user,
            category=savings_category,
            saving_goal=goal,
            amount=remaining,
            note=f"Tất toán mục tiêu tiết kiệm {goal.name}",
            date=date.today(),
            type='saving',
            action='close',
        )

        # Đặt current_amount = 0, đánh dấu đã hoàn thành
        goal.current_amount = 0
        goal.is_completed = True
        goal.save()

        return DeleteSavingGoal(ok=True, transaction=txn)


class DepositToGoal(graphene.Mutation):
    """
    Deposit money into a saving goal.
    Updates current_amount, auto-completes if target reached,
    and creates a SAVING Transaction with DEPOSIT action.
    """
    class Arguments:
        goal_id = graphene.ID(required=True)
        amount = graphene.String(required=True)

    saving_goal = graphene.Field(SavingGoalType)
    transaction = graphene.Field(TransactionType)

    @classmethod
    def mutate(cls, root, info, goal_id, amount):
        from datetime import date
        from django.db import transaction as db_transaction

        user = require_auth(info)
        deposit_amount = Decimal(amount)

        if deposit_amount <= 0:
            raise GraphQLError("Số tiền nạp phải lớn hơn 0.")

        # Validate that user has enough balance for this deposit
        # Balance = income - expense - net_saving
        balance = get_user_balance(user)
        if float(deposit_amount) > balance:
            formatted_balance = f"{balance:,.0f}₫"
            raise GraphQLError(
                f"Không thể nạp tiền. Số tiền nạp vượt quá số dư khả dụng. "
                f"Số dư hiện tại: {formatted_balance}."
            )

        # Use row-level locking + atomic transaction to prevent double-deposit
        # race conditions when the user clicks the button multiple times.
        with db_transaction.atomic():
            try:
                goal = SavingGoal.objects.select_for_update().get(pk=goal_id, user=user)
            except SavingGoal.DoesNotExist as exc:
                raise GraphQLError("Không tìm thấy mục tiêu tiết kiệm.") from exc

            if goal.is_completed:
                raise GraphQLError("Mục tiêu này đã hoàn thành.")

            goal.current_amount += deposit_amount

            if goal.current_amount >= goal.target_amount:
                goal.is_completed = True
                goal.current_amount = goal.target_amount

            goal.save()

            savings_category = get_savings_category()

            txn = Transaction.objects.create(
                user=user,
                category=savings_category,
                saving_goal=goal,
                amount=deposit_amount,
                note=f"Nạp tiền vào mục tiêu {goal.name}",
                date=date.today(),
                type='saving',
                action='deposit',
            )

        # Auto-generate notifications
        was_completed = notify_check_goal_completion(user, goal)
        if not was_completed:
            notify_goal_deposit(user, goal, float(deposit_amount))

        return DepositToGoal(saving_goal=goal, transaction=txn)


class WithdrawFromGoal(graphene.Mutation):
    """
    Withdraw money from a saving goal.
    Decreases current_amount and creates a SAVING Transaction
    with WITHDRAW action.
    """
    class Arguments:
        goal_id = graphene.ID(required=True)
        amount = graphene.String(required=True)
        date = graphene.String()
        note = graphene.String()

    saving_goal = graphene.Field(SavingGoalType)
    transaction = graphene.Field(TransactionType)

    @classmethod
    def mutate(cls, root, info, goal_id, amount, date=None, note=""):
        from datetime import date as date_func

        user = require_auth(info)
        withdraw_amount = float(amount)

        if withdraw_amount <= 0:
            raise GraphQLError("Số tiền rút phải lớn hơn 0.")

        try:
            goal = SavingGoal.objects.get(pk=goal_id, user=user)
        except SavingGoal.DoesNotExist as exc:
            raise GraphQLError("Không tìm thấy mục tiêu tiết kiệm.") from exc

        if float(goal.current_amount) < withdraw_amount:
            raise GraphQLError(
                f"Số dư hiện tại chỉ có {float(goal.current_amount):,.0f}₫. "
                f"Không thể rút {withdraw_amount:,.0f}₫."
            )

        goal.current_amount = float(goal.current_amount) - withdraw_amount
        goal.save()

        savings_category = get_savings_category()

        txn_date = date_func.today()
        if date:
            from datetime import datetime
            txn_date = datetime.strptime(date, "%Y-%m-%d").date()

        txn_note = note or f"Rút tiền từ mục tiêu tiết kiệm {goal.name}"

        txn = Transaction.objects.create(
            user=user,
            category=savings_category,
            saving_goal=goal,
            amount=withdraw_amount,
            note=txn_note,
            date=txn_date,
            type='saving',
            action='withdraw',
        )

        # Auto-generate notification
        notify_goal_withdraw(user, goal, withdraw_amount)

        return WithdrawFromGoal(saving_goal=goal, transaction=txn)


# ──── Notification ────

class NotificationType(DjangoObjectType):
    class Meta:
        model = Notification
        fields = (
            "id", "user", "title", "message", "type",
            "category", "sender", "is_read", "link", "created_at",
        )


class NotificationFilterInput(graphene.InputObjectType):
    type = graphene.String()
    category = graphene.String()
    is_read = graphene.Boolean()
    search = graphene.String()


# ──── Notification Mutations ────

class MarkNotificationRead(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)

    ok = graphene.Boolean()
    notification = graphene.Field(NotificationType)

    @classmethod
    def mutate(cls, root, info, id):
        user = require_auth(info)
        try:
            note = Notification.objects.get(pk=id, user=user)
            note.is_read = True
            note.save()
            return MarkNotificationRead(ok=True, notification=note)
        except Notification.DoesNotExist:
            raise GraphQLError("Notification not found.")


class MarkAllNotificationsRead(graphene.Mutation):
    ok = graphene.Boolean()

    @classmethod
    def mutate(cls, root, info):
        user = require_auth(info)
        updated = Notification.objects.filter(user=user, is_read=False).update(is_read=True)
        return MarkAllNotificationsRead(ok=True)


class DeleteNotification(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)

    ok = graphene.Boolean()

    @classmethod
    def mutate(cls, root, info, id):
        user = require_auth(info)
        deleted, _ = Notification.objects.filter(pk=id, user=user).delete()
        return DeleteNotification(ok=deleted > 0)


class DeleteAllNotifications(graphene.Mutation):
    ok = graphene.Boolean()

    @classmethod
    def mutate(cls, root, info):
        user = require_auth(info)
        Notification.objects.filter(user=user).delete()
        return DeleteAllNotifications(ok=True)


class CreateAdminNotification(graphene.Mutation):
    class Arguments:
        title = graphene.String(required=True)
        message = graphene.String(required=True)
        category = graphene.String(default_value="info")
        link = graphene.String()

    ok = graphene.Boolean()

    @classmethod
    def mutate(cls, root, info, title, message, category="info", link=""):
        sender = require_staff(info)
        # Send to all users
        for user in User.objects.filter(is_active=True):
            Notification.objects.create(
                user=user,
                title=title,
                message=message,
                type="admin",
                category=category,
                sender=sender.username if hasattr(sender, 'username') else "Admin",
                link=link or "",
            )
        return CreateAdminNotification(ok=True)


# ──── Admin Notification Campaign ────

class CampaignRecipientType(DjangoObjectType):
    class Meta:
        model = CampaignRecipient
        fields = ("id", "user")

    user = graphene.Field(UserType)

    def resolve_user(self, info):
        return self.user


class NotificationCampaignType(DjangoObjectType):
    created_by = graphene.Field(UserType)
    recipient_count = graphene.Int()
    target_display = graphene.String()

    class Meta:
        model = NotificationCampaign
        fields = (
            "id", "title", "message", "category", "target_type",
            "link", "status", "created_at", "updated_at",
        )

    def resolve_created_by(self, info):
        return self.created_by

    def resolve_recipient_count(self, info):
        if self.target_type == "ALL":
            return User.objects.filter(is_active=True).count()
        return self.recipients.count()

    def resolve_target_display(self, info):
        if self.target_type == "ALL":
            return "Tất cả User"
        count = self.recipients.count()
        return f"{count} User cụ thể"


# ──── Admin Campaign Mutations ────

class CreateAdminNotificationCampaign(graphene.Mutation):
    """Create campaign as draft or send immediately."""
    class Arguments:
        title = graphene.String(required=True)
        message = graphene.String(required=True)
        category = graphene.String(default_value="info")
        link = graphene.String()
        target_type = graphene.String(default_value="ALL")
        user_ids = graphene.List(graphene.ID)
        save_as_draft = graphene.Boolean(default_value=False)

    campaign = graphene.Field(NotificationCampaignType)
    ok = graphene.Boolean()

    @classmethod
    def mutate(cls, root, info, title, message, category="info", link="", target_type="ALL", user_ids=None, save_as_draft=False):
        sender = require_staff(info)

        if not title or not title.strip():
            raise GraphQLError("Title is required.")
        if not message or not message.strip():
            raise GraphQLError("Message is required.")
        if target_type == "SELECTED" and (not user_ids or len(user_ids) == 0):
            raise GraphQLError("Please select at least one user.")

        status = "draft" if save_as_draft else "sent"

        campaign = NotificationCampaign.objects.create(
            title=title.strip(),
            message=message.strip(),
            category=category,
            link=link or "",
            target_type=target_type,
            status=status,
            created_by=sender,
        )

        # Save recipients if SELECTED
        recipients = []
        if target_type == "SELECTED" and user_ids:
            for uid in user_ids:
                try:
                    user = User.objects.get(pk=uid)
                    CampaignRecipient.objects.create(campaign=campaign, user=user)
                    recipients.append(user)
                except User.DoesNotExist:
                    pass

        # If sending immediately, create notifications
        if not save_as_draft:
            _send_campaign_notifications(campaign, sender, recipients if target_type == "SELECTED" else None)

        return CreateAdminNotificationCampaign(campaign=campaign, ok=True)


class SaveNotificationDraft(graphene.Mutation):
    """Save or update a campaign as draft."""
    class Arguments:
        title = graphene.String(required=True)
        message = graphene.String(required=True)
        category = graphene.String(default_value="info")
        link = graphene.String()
        target_type = graphene.String(default_value="ALL")
        user_ids = graphene.List(graphene.ID)

    campaign = graphene.Field(NotificationCampaignType)
    ok = graphene.Boolean()

    @classmethod
    def mutate(cls, root, info, title, message, category="info", link="", target_type="ALL", user_ids=None):
        sender = require_staff(info)

        if not title or not title.strip():
            raise GraphQLError("Title is required.")
        if not message or not message.strip():
            raise GraphQLError("Message is required.")

        campaign = NotificationCampaign.objects.create(
            title=title.strip(),
            message=message.strip(),
            category=category,
            link=link or "",
            target_type=target_type,
            status="draft",
            created_by=sender,
        )

        if target_type == "SELECTED" and user_ids:
            for uid in user_ids:
                try:
                    user = User.objects.get(pk=uid)
                    CampaignRecipient.objects.create(campaign=campaign, user=user)
                except User.DoesNotExist:
                    pass

        return SaveNotificationDraft(campaign=campaign, ok=True)


class DeleteNotificationCampaign(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)

    ok = graphene.Boolean()

    @classmethod
    def mutate(cls, root, info, id):
        require_staff(info)
        deleted, _ = NotificationCampaign.objects.filter(pk=id).delete()
        return DeleteNotificationCampaign(ok=deleted > 0)


class ResendNotificationCampaign(graphene.Mutation):
    """
    Resend a campaign that was already sent (or sent from draft).
    Creates new notifications for all target users again.
    """
    class Arguments:
        id = graphene.ID(required=True)

    ok = graphene.Boolean()

    @classmethod
    def mutate(cls, root, info, id):
        sender = require_staff(info)
        try:
            campaign = NotificationCampaign.objects.get(pk=id)
        except NotificationCampaign.DoesNotExist:
            raise GraphQLError("Campaign not found.")

        recipients = None
        if campaign.target_type == "SELECTED":
            recipients = [cr.user for cr in campaign.recipients.select_related("user")]

        _send_campaign_notifications(campaign, sender, recipients)

        campaign.status = "sent"
        campaign.save()

        return ResendNotificationCampaign(ok=True)


def _send_campaign_notifications(campaign, sender, recipients=None):
    """Helper to create Notification records for a campaign."""
    if recipients is not None:
        user_list = recipients
    else:
        user_list = User.objects.filter(is_active=True)

    username = sender.username if hasattr(sender, 'username') and sender.username else "Admin"

    for user in user_list:
        Notification.objects.create(
            user=user,
            title=campaign.title,
            message=campaign.message,
            type="admin",
            category=campaign.category,
            sender=username,
            link=campaign.link or "",
        )


# ──── Query ────

class Query(graphene.ObjectType):
    me = graphene.Field(UserType)
    users = graphene.List(UserType, search=graphene.String(), is_active=graphene.Boolean())
    user = graphene.Field(UserType, id=graphene.ID(required=True))

    categories = graphene.List(CategoryType, type=graphene.String())
    categories_all = graphene.List(CategoryType)

    transactions = graphene.List(
        TransactionType,
        type=graphene.String(),
        category_id=graphene.ID(),
        month=graphene.Int(),
        year=graphene.Int(),
        search=graphene.String(),
        limit=graphene.Int(),
        offset=graphene.Int(),
    )
    transaction = graphene.Field(TransactionType, id=graphene.ID(required=True))

    saving_goals = graphene.List(SavingGoalType)
    saving_goal = graphene.Field(SavingGoalType, id=graphene.ID(required=True))

    monthly_stats = graphene.List(
        graphene.JSONString,
        year=graphene.Int(required=True),
    )

    # ── NEW: monthly savings calculated dynamically from transactions ──
    monthly_savings = graphene.List(
        graphene.JSONString,
        year=graphene.Int(required=True),
    )

    # ── Admin Notifications ──
    admin_notification_campaigns = graphene.List(
        NotificationCampaignType,
        status=graphene.String(),
        limit=graphene.Int(),
        offset=graphene.Int(),
    )
    users_for_notification = graphene.List(
        UserType,
        search=graphene.String(),
    )

    # ── Notifications ──
    notifications = graphene.List(
        NotificationType,
        type=graphene.String(),
        category=graphene.String(),
        is_read=graphene.Boolean(),
        search=graphene.String(),
        limit=graphene.Int(),
        offset=graphene.Int(),
    )
    unread_notification_count = graphene.Int()

    def resolve_me(self, info):
        user = require_auth(info)
        Profile.objects.get_or_create(user=user)
        return user

    def resolve_users(self, info, search=None, is_active=None):
        require_staff(info)
        qs = User.objects.select_related("profile").order_by("-date_joined")
        if search:
            qs = qs.filter(Q(username__icontains=search) | Q(email__icontains=search))
        if is_active is not None:
            qs = qs.filter(is_active=is_active)
        return qs

    def resolve_user(self, info, id):
        require_staff(info)
        try:
            return User.objects.select_related("profile").get(pk=id)
        except User.DoesNotExist as exc:
            raise GraphQLError("User not found.") from exc

    def resolve_categories(self, info, type=None):
        qs = Category.objects.filter(is_active=True)
        if type:
            qs = qs.filter(type=type)
        return qs

    def resolve_categories_all(self, info):
        return Category.objects.all()

    def resolve_transactions(self, info, type=None, category_id=None, month=None, year=None, search=None, limit=None, offset=None):
        user = require_auth(info)
        qs = Transaction.objects.filter(user=user).select_related("category")
        if type:
            qs = qs.filter(type=type)
        if category_id:
            qs = qs.filter(category_id=category_id)
        if year:
            qs = qs.filter(date__year=year)
        if month:
            qs = qs.filter(date__month=month)
        if search:
            qs = qs.filter(Q(note__icontains=search) | Q(category__name_vi__icontains=search) | Q(category__name__icontains=search))
        qs = qs.order_by("-date", "-created_at")
        if offset:
            qs = qs[offset:]
        if limit:
            qs = qs[:limit]
        return qs

    def resolve_transaction(self, info, id):
        user = require_auth(info)
        try:
            return Transaction.objects.select_related("category").get(pk=id, user=user)
        except Transaction.DoesNotExist as exc:
            raise GraphQLError("Transaction not found.") from exc

    def resolve_saving_goals(self, info):
        user = require_auth(info)
        return SavingGoal.objects.filter(user=user).order_by("due_date")

    def resolve_saving_goal(self, info, id):
        user = require_auth(info)
        try:
            return SavingGoal.objects.get(pk=id, user=user)
        except SavingGoal.DoesNotExist as exc:
            raise GraphQLError("Saving goal not found.") from exc

    def resolve_monthly_stats(self, info, year):
        user = require_auth(info)
        from django.db.models.functions import ExtractMonth
        stats = (
            Transaction.objects.filter(user=user, date__year=year)
            .values("type")
            .annotate(month=ExtractMonth("date"))
            .values("month", "type")
            .annotate(total=Sum("amount"))
            .order_by("month")
        )
        result = {}
        for s in stats:
            m = s["month"]
            if m not in result:
                result[m] = {"month": m, "income": 0, "expense": 0}
            result[m][s["type"]] = float(s["total"])
        return [result[k] for k in sorted(result)]

    def resolve_notifications(self, info, type=None, category=None, is_read=None, search=None, limit=None, offset=None):
        user = require_auth(info)
        qs = Notification.objects.filter(user=user)
        if type:
            qs = qs.filter(type=type)
        if category:
            qs = qs.filter(category=category)
        if is_read is not None:
            qs = qs.filter(is_read=is_read)
        if search:
            qs = qs.filter(Q(title__icontains=search) | Q(message__icontains=search))
        qs = qs.order_by("-created_at")
        if offset:
            qs = qs[offset:]
        if limit:
            qs = qs[:limit]
        return qs

    def resolve_admin_notification_campaigns(self, info, status=None, limit=None, offset=None):
        require_staff(info)
        qs = NotificationCampaign.objects.select_related("created_by").order_by("-created_at")
        if status:
            qs = qs.filter(status=status)
        if offset:
            qs = qs[offset:]
        if limit:
            qs = qs[:limit]
        return qs

    def resolve_users_for_notification(self, info, search=None):
        require_staff(info)
        qs = User.objects.filter(is_active=True).order_by("username")
        if search:
            qs = qs.filter(
                Q(username__icontains=search) |
                Q(email__icontains=search) |
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search)
            )
        return qs[:20]  # Limit to 20 results for performance

    def resolve_unread_notification_count(self, info):
        user = require_auth(info)
        return Notification.objects.filter(user=user, is_read=False).count()

    def resolve_monthly_savings(self, info, year):
        """
        Calculate net savings per month using transaction data only.
        Net savings = sum of SAVING transactions (deposit - withdraw - close).
        """
        from django.db.models.functions import ExtractMonth

        user = require_auth(info)
        savings_txns = Transaction.objects.filter(
            user=user,
            date__year=year,
            type='saving',
        )

        monthly = {}
        for txn in savings_txns:
            m = txn.date.month
            if m not in monthly:
                monthly[m] = {"month": m, "savings": 0.0, "deposit": 0.0, "withdraw": 0.0, "close": 0.0}
            amount = float(txn.amount)

            if txn.action == 'deposit':
                # Deposit into savings goal = adds to savings
                monthly[m]["savings"] += amount
                monthly[m]["deposit"] += amount
            elif txn.action == 'withdraw':
                # Withdraw from savings goal = reduces savings
                monthly[m]["savings"] -= amount
                monthly[m]["withdraw"] += amount
            elif txn.action == 'close':
                # Close (tất toán) = reduces savings (money returned to balance)
                monthly[m]["savings"] -= amount
                monthly[m]["close"] += amount

        return [monthly[k] for k in sorted(monthly)]


# ──── Mutation ────

class Mutation(graphene.ObjectType):
    register = Register.Field()
    create_user = CreateUser.Field()
    update_user = UpdateUser.Field()
    update_me = UpdateMe.Field()
    upload_avatar = UploadAvatar.Field()
    delete_user = DeleteUser.Field()

    create_category = CreateCategory.Field()
    update_category = UpdateCategory.Field()
    delete_category = DeleteCategory.Field()

    create_transaction = CreateTransaction.Field()
    update_transaction = UpdateTransaction.Field()
    delete_transaction = DeleteTransaction.Field()

    create_saving_goal = CreateSavingGoal.Field()
    update_saving_goal = UpdateSavingGoal.Field()
    delete_saving_goal = DeleteSavingGoal.Field()
    deposit_to_goal = DepositToGoal.Field()
    withdraw_from_goal = WithdrawFromGoal.Field()

    # Notification mutations
    mark_notification_read = MarkNotificationRead.Field()
    mark_all_notifications_read = MarkAllNotificationsRead.Field()
    delete_notification = DeleteNotification.Field()
    delete_all_notifications = DeleteAllNotifications.Field()
    create_admin_notification = CreateAdminNotification.Field()

    # Admin campaign mutations
    create_admin_notification_campaign = CreateAdminNotificationCampaign.Field()
    save_notification_draft = SaveNotificationDraft.Field()
    delete_notification_campaign = DeleteNotificationCampaign.Field()
    resend_notification_campaign = ResendNotificationCampaign.Field()
