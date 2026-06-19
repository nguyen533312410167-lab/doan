from django.urls import path
from . import views

urllist = [
    ('auth/login', views.login),
    ('auth/register', views.register),
    ('auth/refresh', views.refresh),
    ('auth/me', views.get_me),
    ('auth/auto-login', views.auto_login),
    ('user/profile', views.update_profile),
    ('user/avatar', views.upload_avatar),
    ('user/change-password', views.change_password),
]

urlpatterns = []
for route, view_func in urllist:
    urlpatterns.append(path(f'{route}/', view_func))
    urlpatterns.append(path(route, view_func))
