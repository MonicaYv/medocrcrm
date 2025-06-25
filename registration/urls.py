from django.urls import path
from . import views

urlpatterns = [
    path('welcome', views.welcome, name='welcome'),
    path('user/<str:role>', views.register_by_role, name='register_by_role'),
    path('save/user', views.save_user, name='save_user'),
    path('save/ngo', views.save_ngo, name='save_ngo'),
    path('login', views.login_page, name='login_page'),
    path('auth/login', views.login_auth, name='login_auth'),
]
