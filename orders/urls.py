from django.urls import path
from . import views

urlpatterns = [
    path('', views.orders, name='orders'),
    path('<int:order_id>/<str:status>/', views.update_order_status, name='update_order_status'),
]
