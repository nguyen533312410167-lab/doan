import graphene
from django.contrib.auth import get_user_model
from django.core.exceptions import PermissionDenied, ValidationError
from django.core.validators import validate_email
from django.db.models import Q, Sum
from graphene_django import DjangoObjectType
from graphene_file_upload.scalars import Upload
from graphql import GraphQLError

from .models import Profile, Category, Transaction, SavingGoal


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
        model = Category


# ──── Transaction ────

class TransactionType(DjangoObjectType):
    category_name = graphene.String()

    class Meta:
        model = Transaction
        fields = (
            "id", "user", "category", "type", "amount",
            "note", "date", "created_at", "updated_at",
        )

    def resolve_category_name(self, info):
        if self.category:
            return self.category.name_vi or self.category.name
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
        if self.target_amount > 0:
            return float(self.current_amount) / float(self.target_amount) * 100
        return 0

    def resolve_days_left(self, info):
        from datetime import date
        delta = self.due_date - date.today()
        return delta.days


# ──── User Mutations (existing) ────

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
        note = graphene.String()
        date = graphene.String(required=True)

    transaction = graphene.Field(TransactionType)

    @classmethod
    def mutate(cls, root, info, transaction_type, amount, date, category_id=None, note=""):
        user = require_auth(info)
        category = None
        if category_id:
            try:
                category = Category.objects.get(pk=category_id)
            except Category.DoesNotExist:
                pass
        from datetime import datetime
        parsed_date = datetime.strptime(date, "%Y-%m-%d").date()
        txn = Transaction.objects.create(
            user=user, amount=amount,
            category=category, note=note, date=parsed_date,
            **{'type': transaction_type},
        )
        return CreateTransaction(transaction=txn)


class UpdateTransaction(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)
        transaction_type = graphene.String()
        amount = graphene.String()
        category_id = graphene.ID()
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

        if "transaction_type" in kwargs and kwargs["transaction_type"] is not None:
            txn.type = kwargs["transaction_type"]
        if "amount" in kwargs and kwargs["amount"] is not None:
            txn.amount = kwargs["amount"]
        if "category_id" in kwargs and kwargs["category_id"] is not None:
            try:
                txn.category = Category.objects.get(pk=kwargs["category_id"])
            except Category.DoesNotExist:
                txn.category = None
        if "note" in kwargs and kwargs["note"] is not None:
            txn.note = kwargs["note"]
        if "date" in kwargs and kwargs["date"] is not None:
            from datetime import datetime
            txn.date = datetime.strptime(kwargs["date"], "%Y-%m-%d").date()
        txn.save()
        return UpdateTransaction(transaction=txn)


class DeleteTransaction(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)

    ok = graphene.Boolean()

    @classmethod
    def mutate(cls, root, info, id):
        user = require_auth(info)
        deleted, _ = Transaction.objects.filter(pk=id, user=user).delete()
        return DeleteTransaction(ok=deleted > 0)


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
            user=user, name=name, target_amount=target_amount,
            due_date=parsed_date, note=note,
        )
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

        for field in ("name", "target_amount", "current_amount", "note", "is_completed"):
            if field in kwargs and kwargs[field] is not None:
                setattr(goal, field, kwargs[field])
        if "due_date" in kwargs and kwargs["due_date"] is not None:
            from datetime import datetime
            goal.due_date = datetime.strptime(kwargs["due_date"], "%Y-%m-%d").date()
        goal.save()
        return UpdateSavingGoal(saving_goal=goal)


class DeleteSavingGoal(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)

    ok = graphene.Boolean()

    @classmethod
    def mutate(cls, root, info, id):
        user = require_auth(info)
        deleted, _ = SavingGoal.objects.filter(pk=id, user=user).delete()
        return DeleteSavingGoal(ok=deleted > 0)


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

    # Stats
    monthly_stats = graphene.List(
        graphene.JSONString,
        year=graphene.Int(required=True),
    )

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


# ──── Mutation ────

class Mutation(graphene.ObjectType):
    # User mutations
    register = Register.Field()
    create_user = CreateUser.Field()
    update_user = UpdateUser.Field()
    update_me = UpdateMe.Field()
    upload_avatar = UploadAvatar.Field()
    delete_user = DeleteUser.Field()

    # Category mutations
    create_category = CreateCategory.Field()
    update_category = UpdateCategory.Field()
    delete_category = DeleteCategory.Field()

    # Transaction mutations
    create_transaction = CreateTransaction.Field()
    update_transaction = UpdateTransaction.Field()
    delete_transaction = DeleteTransaction.Field()

    # Saving goal mutations
    create_saving_goal = CreateSavingGoal.Field()
    update_saving_goal = UpdateSavingGoal.Field()
    delete_saving_goal = DeleteSavingGoal.Field()