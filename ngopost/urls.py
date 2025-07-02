from django.urls import path
from . import views

urlpatterns = [
    path('', views.post_view, name='posts'),
    path('<int:post_id>/detail/', views.post_detail_ajax, name='post_detail_ajax'),
] 