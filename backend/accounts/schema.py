import graphene
from django.contrib.auth import get_user_model
from django.core.exceptions import PermissionDenied, ValidationError
from django.core.validators import validate_email
from django.db.models import Q
from graphene_django import DjangoObjectType
from graphene_file_upload.scalars import Upload
from graphql import GraphQLError

from .models import Profile


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


class ProfileType(DjangoObjectType):
    avatar_url = graphene.String()

    class Meta:
        model = Profile
        fields = ("id", "avatar", "phone", "address", "created_at", "updated_at")

    def resolve_avatar_url(self, info):
        if not self.avatar:
            return None
        return info.context.build_absolute_uri(self.avatar.url)


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


class Query(graphene.ObjectType):
    me = graphene.Field(UserType)
    users = graphene.List(
        UserType,
        search=graphene.String(),
        is_active=graphene.Boolean(),
    )
    user = graphene.Field(UserType, id=graphene.ID(required=True))

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


class Mutation(graphene.ObjectType):
    register = Register.Field()
    create_user = CreateUser.Field()
    update_user = UpdateUser.Field()
    update_me = UpdateMe.Field()
    upload_avatar = UploadAvatar.Field()
    delete_user = DeleteUser.Field()
