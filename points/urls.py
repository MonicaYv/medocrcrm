from django.urls import path
from . import views


app_name = 'points'

urlpatterns = [
    path('', views.points_dashboard, name='points'),
    path('get-cards/', views.get_coupon_cards, name='get_cards'),
    path('get-popular-coupons/', views.get_popular_coupon_cards, name='get_popular_coupon_cards'),
    path('chart-data/', views.get_points_chart_data, name='chart_data'),
    path('history/', views.points_history_view, name='points_history'),
    path('history/ajax/', views.ajax_filtered_points, name='ajax_filtered_history'),
    path('claim-coupon/', views.claim_coupon, name='claim-coupon'),
    path("claimed-coupons/ajax/", views.get_claimed_coupons, name="get_claimed_coupons"),

]
