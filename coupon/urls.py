from django.urls import path
from . import views

urlpatterns = [
    path('', views.coupon_view, name='coupons'),
    path('coupon_detail/<int:coupon_id>/', views.coupon_detail, name='coupon_detail'),
    path('coupon-history/', views.get_coupon_history, name='coupon_history'),
    path('saved-coupons/', views.get_saved_coupon_history, name='saved_coupons'),
    path('platform-bill/<int:coupon_id>/', views.platform_bill, name='platform_bill'),
    path('export-coupon-history/', views.export_coupon_history, name='export_coupon_history'),
    path('export-saved-coupon-history/', views.export_saved_coupon_history, name='export_saved_coupon_history'),
    path("seller/create/", views.create_seller_coupon, name="create-seller-coupon"),
    path("ajax/get-created-coupons/", views.get_created_coupons, name="get_created_coupons"),
    path("redeem-copy/", views.pharmacy_coupon_redeem, name="pharmacy_coupon_redeem"),
    path("redeem-created-copy/", views.created_coupon_redeem, name="created_coupon_redeem"),

]
