from django.urls import path
from . import views

urlpatterns = [
    path('', views.dashboard_home, name='advertiser-home'),
    path('api/coupon-chart-data/', views.get_coupon_chart_data, name='coupon_chart_data'),
    path('save-event/', views.save_event, name='save_event'),
    path('get-events/', views.get_events, name='get_events'),
    path('get-upcoming-events/', views.get_upcoming_events, name='get_upcoming_events'),
    path('ngo-graph-data/', views.get_ngo_graph_data, name='ngo-graph-data'),
    path('saved/', views.saved, name='saved'),
    path('advance/', views.advance, name='advance'),
    path('cart/', views.cart, name='cart'),
    path('saved-coupon-history/', views.adv_saved_coupon_history, name='saved_coupon_history'),
    path('coupon_detail/<int:coupon_id>/', views.coupon_detail, name='coupon_detail'),
    path('saved/platform-bill/<int:coupon_id>/', views.platform_bill, name='platform_bill'),
    path('export-saved-coupon-history/', views.export_saved_coupon_history, name='export_saved_coupon_history'),
    path('donation-history/', views.get_donation_history, name='donation_history'),
    path('export-donation-history/', views.export_donation_history, name='export_donation_history'),
    path('toggle-saved/donation/', views.toggle_saved_donation, name='toggle_saved_donation'),
    path('get-donate-bill/<int:donation_id>/', views.get_donate_bill, name='get-donate-bill'),
    path('get-platform-bill/<int:donation_id>/', views.get_platform_bill, name='get-platform-bill'),
    path('advance/advance-history/', views.advance_history, name='advance-history'),
    path("advance/add/", views.add_advance_amount, name="add_advance"),
    path("advance/history/ajax/",views.ajax_advance_history, name="ajax_advance_history"),
    path("advance/summary/ajax/",views.ajax_advance_summary,name="ajax_advance_summary"),
    path("advance/receipt/<int:advance_id>/", views.get_advance_receipt, name="get_advance_receipt"),

]
