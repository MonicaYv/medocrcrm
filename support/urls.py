from django.urls import path
from . import views

urlpatterns = [
    path('support/', views.support_view, name='support'),
    path('ajax/get-issue-options/', views.get_issue_options, name='get_issue_options'),
    path('api/filter-tickets/', views.filter_support_tickets, name='filter_tickets')
]