import json
import jwt
from datetime import datetime, timedelta, date
from decimal import Decimal
from django.conf import settings
from django.contrib.auth import get_user_model
from django.db.models import Sum, Q
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from .models import Profile, Category, Transaction, SavingGoal

User = get_user_model()

ACCESS_SECRET = settings.SECRET_KEY
REFRESH_SECRET = settings.SECRET_KEY + "-refresh"
ACCESS_EXPIRES_MINUTES = 60 * 24  # 24 hours
REFRESH_EXPIRES_DAYS = 7


def json_body(request):
    try:
        return json.loads(request.body)
    except (json.JSONDecodeError, AttributeError):
        return {}


def make_tokens(user):
    now = datetime.utcnow()
    payload = {
        "id": user.id,
        "email": user.email,
        "iat": now,
    }
    access_payload = {**payload, "exp": now + timedelta(minutes=ACCESS_EXPIRES_MINUTES)}
    refresh_payload = {**payload, "exp": now + timedelta(days=REFRESH_EXPIRES_DAYS)}
    access_token = jwt.encode(access_payload, ACCESS_SECRET, algorithm="HS256")
    refresh_token = jwt.encode(refresh_payload, REFRESH_SECRET, algorithm="HS256")
    return access_token, refresh_token


def user_data(user):
    profile, _ = Profile.objects.get_or_create(user=user)
    avatar_url = None
    if profile.avatar:
        try:
            avatar_url = profile.avatar.url
        except Exception:
            avatar_url = None
    return {
        "id": user.id,
        "fullname": f"{user.last_name} {user.first_name}".strip() or user.username,
        "email": user.email,
        "avatar": avatar_url,
    }


def get_token_user(request):
    auth_header = request.META.get("HTTP_AUTHORIZATION", "")
    if not auth_header.startswith("Bearer "):
        return None
    token = auth_header.split(" ", 1)[1]
    try:
        payload = jwt.decode(token, ACCESS_SECRET, algorithms=["HS256"])
        return User.objects.get(pk=payload["id"])
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError, User.DoesNotExist):
        return None


# ─── Auth ───

import logging
logger = logging.getLogger(__name__)

@csrf_exempt
@require_http_methods(["POST"])
def login(request):
    body = json_body(request)
    username = (body.get("username") or "").strip()
    password = body.get("password", "")

    logger.warning(f"LOGIN: body={body}")
    logger.warning(f"LOGIN: username='{username}' password='{password}'")

    if not username or not password:
        return JsonResponse({"message": "Tên đăng nhập và mật khẩu là bắt buộc"}, status=400)

    try:
        user = User.objects.get(username=username)
        logger.warning(f"LOGIN: found user={user.username} active={user.is_active}")
    except User.DoesNotExist:
        logger.warning(f"LOGIN: user '{username}' not found")
        return JsonResponse({"message": "Invalid credentials"}, status=401)

    if not user.check_password(password):
        logger.warning(f"LOGIN: wrong password for {username}")
        return JsonResponse({"message": "Invalid credentials"}, status=401)

    if not user.is_active:
        return JsonResponse({"message": "Tài khoản đã bị vô hiệu hóa"}, status=401)

    access_token, refresh_token = make_tokens(user)
    return JsonResponse({
        "message": "Login successful",
        "user": user_data(user),
        "accessToken": access_token,
        "refreshToken": refresh_token,
    })


@csrf_exempt
@require_http_methods(["POST"])
def register(request):
    body = json_body(request)
    username = (body.get("username") or "").strip()
    fullname = (body.get("fullname") or "").strip()
    email = (body.get("email") or "").strip().lower()
    password = body.get("password", "")

    if not username:
        return JsonResponse({"message": "Tên đăng nhập là bắt buộc"}, status=400)
    if not email:
        return JsonResponse({"message": "Email là bắt buộc"}, status=400)
    if not password or len(password) < 6:
        return JsonResponse({"message": "Mật khẩu tối thiểu 6 ký tự"}, status=400)

    if User.objects.filter(username=username).exists():
        return JsonResponse({"message": "Tên đăng nhập đã tồn tại"}, status=400)
    if User.objects.filter(email=email).exists():
        return JsonResponse({"message": "Email already registered"}, status=400)

    name_parts = fullname.split(" ", 1)
    first_name = name_parts[0] if len(name_parts) > 0 else ""
    last_name = name_parts[1] if len(name_parts) > 1 else ""

    user = User.objects.create_user(
        username=username,
        email=email,
        password=password,
        first_name=first_name,
        last_name=last_name,
    )
    Profile.objects.get_or_create(user=user)

    access_token, refresh_token = make_tokens(user)
    return JsonResponse({
        "message": "Registration successful",
        "user": user_data(user),
        "accessToken": access_token,
        "refreshToken": refresh_token,
    }, status=201)


@csrf_exempt
@require_http_methods(["POST"])
def refresh(request):
    body = json_body(request)
    refresh_token = body.get("refreshToken", "")

    if not refresh_token:
        return JsonResponse({"message": "Refresh token required"}, status=400)

    try:
        payload = jwt.decode(refresh_token, REFRESH_SECRET, algorithms=["HS256"])
        user = User.objects.get(pk=payload["id"])
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError, User.DoesNotExist):
        return JsonResponse({"message": "Invalid refresh token"}, status=401)

    access_token, new_refresh_token = make_tokens(user)
    return JsonResponse({
        "accessToken": access_token,
        "refreshToken": new_refresh_token,
    })


@csrf_exempt
@require_http_methods(["POST"])
def auto_login(request):
    try:
        user = User.objects.filter(is_staff=True).first()
        if not user:
            user = User.objects.filter(is_active=True).first()
        if not user:
            return JsonResponse({"message": "No user found"}, status=404)

        access_token, refresh_token = make_tokens(user)
        return JsonResponse({
            "message": "Auto login successful",
            "user": user_data(user),
            "accessToken": access_token,
            "refreshToken": refresh_token,
        })
    except Exception as e:
        return JsonResponse({"message": f"Server error: {str(e)}"}, status=500)


@csrf_exempt
@require_http_methods(["GET"])
def get_me(request):
    user = get_token_user(request)
    if not user:
        return JsonResponse({"message": "Unauthorized"}, status=401)
    return JsonResponse(user_data(user))


@csrf_exempt
@require_http_methods(["PUT"])
def update_profile(request):
    user = get_token_user(request)
    if not user:
        return JsonResponse({"message": "Unauthorized"}, status=401)

    body = json_body(request)
    fullname = body.get("fullname")
    avatar = body.get("avatar")

    if fullname is not None:
        name_parts = fullname.strip().split(" ", 1)
        user.first_name = name_parts[0] if len(name_parts) > 0 else ""
        user.last_name = name_parts[1] if len(name_parts) > 1 else ""
    if avatar is not None:
        profile, _ = Profile.objects.get_or_create(user=user)
        profile.avatar = avatar
        profile.save()

    user.save()
    return JsonResponse(user_data(user))


@csrf_exempt
@require_http_methods(["POST"])
def upload_avatar(request):
    user = get_token_user(request)
    if not user:
        return JsonResponse({"message": "Unauthorized"}, status=401)

    if "file" not in request.FILES:
        return JsonResponse({"message": "No file uploaded"}, status=400)

    file = request.FILES["file"]
    profile, _ = Profile.objects.get_or_create(user=user)
    profile.avatar.save(file.name, file, save=True)

    avatar_url = None
    try:
        avatar_url = profile.avatar.url
    except Exception:
        pass

    return JsonResponse({"avatar": avatar_url})


@csrf_exempt
@require_http_methods(["PUT"])
def change_password(request):
    user = get_token_user(request)
    if not user:
        return JsonResponse({"message": "Unauthorized"}, status=401)

    body = json_body(request)
    old_password = body.get("oldPassword", "")
    new_password = body.get("newPassword", "")

    if not user.check_password(old_password):
        return JsonResponse({"message": "Old password incorrect"}, status=400)
    if len(new_password) < 6:
        return JsonResponse({"message": "Mật khẩu mới tối thiểu 6 ký tự"}, status=400)

    user.set_password(new_password)
    user.save()
    return JsonResponse({"message": "Password updated"})


# ─── Categories ───

def category_data(cat):
    return {
        "id": cat.id,
        "name": cat.name,
        "name_vi": cat.name_vi,
        "type": cat.type,
        "icon": cat.icon,
        "sort_order": cat.sort_order,
        "is_active": cat.is_active,
    }


@csrf_exempt
@require_http_methods(["GET"])
def get_categories(request):
    user = get_token_user(request)
    if not user:
        return JsonResponse({"message": "Unauthorized"}, status=401)
    cats = Category.objects.filter(is_active=True).order_by("sort_order")
    return JsonResponse([category_data(c) for c in cats], safe=False)


@csrf_exempt
@require_http_methods(["POST"])
def create_category(request):
    user = get_token_user(request)
    if not user:
        return JsonResponse({"message": "Unauthorized"}, status=401)
    body = json_body(request)
    cat = Category.objects.create(
        name=body.get("name"),
        name_vi=body.get("name_vi", ""),
        type=body.get("type"),
        icon=body.get("icon", ""),
        sort_order=body.get("sort_order", 0),
    )
    return JsonResponse(category_data(cat), status=201)


@csrf_exempt
@require_http_methods(["PUT"])
def update_category(request, id):
    user = get_token_user(request)
    if not user:
        return JsonResponse({"message": "Unauthorized"}, status=401)
    try:
        cat = Category.objects.get(pk=id)
    except Category.DoesNotExist:
        return JsonResponse({"message": "Not found"}, status=404)
    body = json_body(request)
    for field in ("name", "name_vi", "type", "icon", "sort_order", "is_active"):
        if field in body and body[field] is not None:
            setattr(cat, field, body[field])
    cat.save()
    return JsonResponse(category_data(cat))


@csrf_exempt
@require_http_methods(["DELETE"])
def delete_category(request, id):
    user = get_token_user(request)
    if not user:
        return JsonResponse({"message": "Unauthorized"}, status=401)
    try:
        cat = Category.objects.get(pk=id)
        cat.delete()
        return JsonResponse({"message": "Deleted"})
    except Category.DoesNotExist:
        return JsonResponse({"message": "Not found"}, status=404)


# ─── Transactions ───

def transaction_data(txn):
    return {
        "id": txn.id,
        "user_id": txn.user_id,
        "category_id": txn.category_id,
        "type": txn.type,
        "amount": float(txn.amount),
        "note": txn.note,
        "date": txn.date.isoformat(),
        "created_at": txn.created_at.isoformat(),
        "updated_at": txn.updated_at.isoformat(),
        "category_name": txn.category.name_vi or txn.category.name if txn.category else None,
    }


@csrf_exempt
@require_http_methods(["GET"])
def get_transactions(request):
    user = get_token_user(request)
    if not user:
        return JsonResponse({"message": "Unauthorized"}, status=401)
    qs = Transaction.objects.filter(user=user).select_related("category")

    typ = request.GET.get("type")
    category_id = request.GET.get("category_id")
    year = request.GET.get("year")
    month = request.GET.get("month")
    search = request.GET.get("search")

    if typ:
        qs = qs.filter(type=typ)
    if category_id:
        qs = qs.filter(category_id=category_id)
    if year:
        qs = qs.filter(date__year=int(year))
    if month:
        qs = qs.filter(date__month=int(month))
    if search:
        qs = qs.filter(Q(note__icontains=search) | Q(category__name_vi__icontains=search) | Q(category__name__icontains=search))

    qs = qs.order_by("-date", "-created_at")
    return JsonResponse([transaction_data(t) for t in qs], safe=False)


@csrf_exempt
@require_http_methods(["GET"])
def get_transaction_by_id(request, id):
    user = get_token_user(request)
    if not user:
        return JsonResponse({"message": "Unauthorized"}, status=401)
    try:
        txn = Transaction.objects.select_related("category").get(pk=id, user=user)
        return JsonResponse(transaction_data(txn))
    except Transaction.DoesNotExist:
        return JsonResponse({"message": "Not found"}, status=404)


@csrf_exempt
@require_http_methods(["POST"])
def create_transaction(request):
    user = get_token_user(request)
    if not user:
        return JsonResponse({"message": "Unauthorized"}, status=401)
    body = json_body(request)
    category = None
    if body.get("category_id"):
        try:
            category = Category.objects.get(pk=body["category_id"])
        except Category.DoesNotExist:
            pass
    txn = Transaction.objects.create(
        user=user,
        category=category,
        type=body["type"],
        amount=body["amount"],
        note=body.get("note", ""),
        date=datetime.strptime(body["date"], "%Y-%m-%d").date(),
    )
    return JsonResponse(transaction_data(txn), status=201)


@csrf_exempt
@require_http_methods(["PUT"])
def update_transaction(request, id):
    user = get_token_user(request)
    if not user:
        return JsonResponse({"message": "Unauthorized"}, status=401)
    try:
        txn = Transaction.objects.get(pk=id, user=user)
    except Transaction.DoesNotExist:
        return JsonResponse({"message": "Not found"}, status=404)
    body = json_body(request)
    if "type" in body and body["type"] is not None:
        txn.type = body["type"]
    if "amount" in body and body["amount"] is not None:
        txn.amount = body["amount"]
    if "category_id" in body and body["category_id"] is not None:
        try:
            txn.category = Category.objects.get(pk=body["category_id"])
        except Category.DoesNotExist:
            txn.category = None
    if "note" in body and body["note"] is not None:
        txn.note = body["note"]
    if "date" in body and body["date"] is not None:
        txn.date = datetime.strptime(body["date"], "%Y-%m-%d").date()
    txn.save()
    return JsonResponse(transaction_data(txn))


@csrf_exempt
@require_http_methods(["DELETE"])
def delete_transaction(request, id):
    user = get_token_user(request)
    if not user:
        return JsonResponse({"message": "Unauthorized"}, status=401)
    deleted, _ = Transaction.objects.filter(pk=id, user=user).delete()
    return JsonResponse({"ok": deleted > 0})


# ─── Goals ───

def goal_data(goal):
    progress = 0
    if goal.target_amount > 0:
        progress = float(goal.current_amount) / float(goal.target_amount) * 100
    days_left = (goal.due_date - date.today()).days
    return {
        "id": goal.id,
        "user_id": goal.user_id,
        "name": goal.name,
        "target_amount": float(goal.target_amount),
        "current_amount": float(goal.current_amount),
        "due_date": goal.due_date.isoformat(),
        "note": goal.note,
        "is_completed": goal.is_completed,
        "progress_percent": round(progress, 2),
        "days_left": days_left,
        "created_at": goal.created_at.isoformat(),
        "updated_at": goal.updated_at.isoformat(),
    }


@csrf_exempt
@require_http_methods(["GET"])
def get_goals(request):
    user = get_token_user(request)
    if not user:
        return JsonResponse({"message": "Unauthorized"}, status=401)
    goals = SavingGoal.objects.filter(user=user).order_by("due_date")
    return JsonResponse([goal_data(g) for g in goals], safe=False)


@csrf_exempt
@require_http_methods(["POST"])
def create_goal(request):
    user = get_token_user(request)
    if not user:
        return JsonResponse({"message": "Unauthorized"}, status=401)
    body = json_body(request)
    goal = SavingGoal.objects.create(
        user=user,
        name=body["name"],
        target_amount=body["target_amount"],
        due_date=datetime.strptime(body["due_date"], "%Y-%m-%d").date(),
        note=body.get("note", ""),
    )
    return JsonResponse(goal_data(goal), status=201)


@csrf_exempt
@require_http_methods(["PUT"])
def update_goal(request, id):
    user = get_token_user(request)
    if not user:
        return JsonResponse({"message": "Unauthorized"}, status=401)
    try:
        goal = SavingGoal.objects.get(pk=id, user=user)
    except SavingGoal.DoesNotExist:
        return JsonResponse({"message": "Not found"}, status=404)
    body = json_body(request)
    for field in ("name", "target_amount", "current_amount", "note", "is_completed"):
        if field in body and body[field] is not None:
            setattr(goal, field, body[field])
    if "due_date" in body and body["due_date"] is not None:
        goal.due_date = datetime.strptime(body["due_date"], "%Y-%m-%d").date()
    goal.save()
    return JsonResponse(goal_data(goal))


@csrf_exempt
@require_http_methods(["DELETE"])
def delete_goal(request, id):
    user = get_token_user(request)
    if not user:
        return JsonResponse({"message": "Unauthorized"}, status=401)
    deleted, _ = SavingGoal.objects.filter(pk=id, user=user).delete()
    return JsonResponse({"ok": deleted > 0})


@csrf_exempt
@require_http_methods(["POST"])
def deposit_goal(request, id):
    user = get_token_user(request)
    if not user:
        return JsonResponse({"message": "Unauthorized"}, status=401)
    try:
        goal = SavingGoal.objects.get(pk=id, user=user)
    except SavingGoal.DoesNotExist:
        return JsonResponse({"message": "Not found"}, status=404)
    body = json_body(request)
    amount = Decimal(str(body.get("amount", 0)))
    goal.current_amount += amount
    goal.save()
    return JsonResponse(goal_data(goal))


@csrf_exempt
@require_http_methods(["POST"])
def withdraw_goal(request, id):
    user = get_token_user(request)
    if not user:
        return JsonResponse({"message": "Unauthorized"}, status=401)
    try:
        goal = SavingGoal.objects.get(pk=id, user=user)
    except SavingGoal.DoesNotExist:
        return JsonResponse({"message": "Not found"}, status=404)
    body = json_body(request)
    amount = Decimal(str(body.get("amount", 0)))
    goal.current_amount -= amount
    goal.save()
    return JsonResponse(goal_data(goal))


# ─── Dashboard ───

@csrf_exempt
@require_http_methods(["GET"])
def get_dashboard(request):
    user = get_token_user(request)
    if not user:
        return JsonResponse({"message": "Unauthorized"}, status=401)

    today = date.today()
    first_of_month = today.replace(day=1)

    # Current month income/expense
    month_income = Transaction.objects.filter(
        user=user, type="income", date__gte=first_of_month, date__lte=today
    ).aggregate(total=Sum("amount"))["total"] or 0

    month_expense = Transaction.objects.filter(
        user=user, type="expense", date__gte=first_of_month, date__lte=today
    ).aggregate(total=Sum("amount"))["total"] or 0

    # Recent transactions
    recent_txns = Transaction.objects.filter(user=user).select_related("category").order_by("-date", "-created_at")[:10]

    # Goals summary
    goals = SavingGoal.objects.filter(user=user)
    total_saved = goals.aggregate(total=Sum("current_amount"))["total"] or 0
    total_target = goals.aggregate(total=Sum("target_amount"))["total"] or 0

    # Stats by category this month
    category_stats = (
        Transaction.objects.filter(user=user, date__gte=first_of_month, date__lte=today)
        .values("category__name_vi", "category__name", "type")
        .annotate(total=Sum("amount"))
        .order_by("-total")
    )

    return JsonResponse({
        "month_income": float(month_income),
        "month_expense": float(month_expense),
        "balance": float(month_income - month_expense),
        "recent_transactions": [transaction_data(t) for t in recent_txns],
        "total_saved": float(total_saved),
        "total_target": float(total_target),
        "category_stats": [
            {
                "name": s["category__name_vi"] or s["category__name"],
                "type": s["type"],
                "total": float(s["total"]),
            }
            for s in category_stats
        ],
    })


# ─── Notifications ───

def notification_data(n):
    return {
        "id": n.id,
        "title": n.title,
        "message": n.message,
        "type": n.type,
        "is_read": n.is_read,
        "created_at": n.created_at.isoformat(),
    }


@csrf_exempt
@require_http_methods(["GET"])
def get_notifications(request):
    return JsonResponse([], safe=False)


@csrf_exempt
@require_http_methods(["GET"])
def get_unread_count(request):
    return JsonResponse({"count": 0})


@csrf_exempt
@require_http_methods(["PUT"])
def mark_as_read(request, id):
    return JsonResponse({"ok": True})


@csrf_exempt
@require_http_methods(["PUT"])
def mark_all_as_read(request):
    return JsonResponse({"ok": True})


# ─── Settings ───

@csrf_exempt
@require_http_methods(["GET"])
def get_settings(request):
    user = get_token_user(request)
    if not user:
        return JsonResponse({"message": "Unauthorized"}, status=401)
    profile, _ = Profile.objects.get_or_create(user=user)
    return JsonResponse({
        "currency": "VND",
        "language": "vi",
        "theme": "light",
        "notifications_enabled": True,
        "phone": profile.phone,
        "address": profile.address,
    })


@csrf_exempt
@require_http_methods(["PUT"])
def update_settings(request):
    user = get_token_user(request)
    if not user:
        return JsonResponse({"message": "Unauthorized"}, status=401)
    body = json_body(request)
    profile, _ = Profile.objects.get_or_create(user=user)
    if "phone" in body:
        profile.phone = body["phone"]
    if "address" in body:
        profile.address = body["address"]
    profile.save()
    return JsonResponse({"message": "Settings updated"})