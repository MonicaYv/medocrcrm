from django.urls import path
from . import views
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('', views.support_view, name='support_view'),
    path('submit-ticket/', views.submit_support_ticket, name='submit_support_ticket'),
    path('filter-tickets/', views.filter_support_tickets, name='filter_support_tickets'),
    path('get-bot-content/', views.get_bot_content_api, name='get_bot_content_api'),
    path('get-user-tickets/', views.get_user_tickets, name='get_user_tickets'),
    path('get-issue-options/', views.get_issue_options, name='get-issue-options'),
    path('get-tickets-list/', views.get_ticket_lists, name='get-tickets-list'),
    path('get-tickets-details/', views.ticket_details, name='get-tickets-details'),
    path('tickets/<int:ticket_id>/messages/', views.ticket_messages, name='ticket_messages'),
    path('get-tickets-filters/', views.filter_tickets, name='get-tickets-filters'),
    path('get-faq-lists/', views.faq_lists, name='get-faq-lists'),
    path('send-support-email/', views.send_support_email, name='send-support-email'),
]
if settings.DEBUG:
    urlpatterns += static(
        settings.MEDIA_URL,
        document_root=settings.MEDIA_ROOT
    )
