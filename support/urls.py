from django.urls import path
from . import views

urlpatterns = [
    path('', views.support_view, name='support_view'),
    path('get-issue-options/', views.get_issue_options, name='get_issue_options'),
    path('filter-tickets/', views.filter_support_tickets, name='filter_support_tickets'),
]
