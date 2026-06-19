from django.urls import path
from . import views

urllist = [
    # Auth
    ('auth/login', views.login),
    ('auth/register', views.register),
    ('auth/refresh', views.refresh),
    ('auth/me', views.get_me),
    ('auth/auto-login', views.auto_login),
    ('user/profile', views.update_profile),
    ('user/avatar', views.upload_avatar),
    ('user/change-password', views.change_password),
    # Categories
    ('categories', views.get_categories),
    ('categories/create', views.create_category),
    ('categories/<int:id>', views.update_category),
    ('categories/<int:id>/delete', views.delete_category),
    # Transactions
    ('transactions', views.get_transactions),
    ('transactions/create', views.create_transaction),
    ('transactions/<int:id>', views.get_transaction_by_id),
    ('transactions/<int:id>/update', views.update_transaction),
    ('transactions/<int:id>/delete', views.delete_transaction),
    # Dashboard
    ('dashboard', views.get_dashboard),
    # Goals
    ('goals', views.get_goals),
    ('goals/create', views.create_goal),
    ('goals/<int:id>/update', views.update_goal),
    ('goals/<int:id>/delete', views.delete_goal),
    ('goals/<int:id>/deposit', views.deposit_goal),
    ('goals/<int:id>/withdraw', views.withdraw_goal),
    # Notifications
    ('notifications', views.get_notifications),
    ('notifications/unread-count', views.get_unread_count),
    ('notifications/<int:id>/read', views.mark_as_read),
    ('notifications/read-all', views.mark_all_as_read),
    # Settings
    ('settings', views.get_settings),
    ('settings/update', views.update_settings),
]

urlpatterns = []
for route, view_func in urllist:
    urlpatterns.append(path(f'{route}/', view_func))
    urlpatterns.append(path(route, view_func))
