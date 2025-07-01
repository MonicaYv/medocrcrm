from django.urls import path
from . import views

urlpatterns = [
    path('register', views.welcome, name='welcome'),
    path('register/<str:role>', views.register_by_role, name='register_by_role'),
    path('save/customer', views.save_user, name='save_user'),
    path('save/ngo', views.save_ngo, name='save_ngo'),
    path('login', views.login_page, name='login'),
    path('auth/login', views.login_auth, name='login_auth'),
    path('save/client', views.save_client, name='save_client'),
]
