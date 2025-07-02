from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from django.db.models import Q
from django.http import JsonResponse
from .models import IssueType, IssueOption, SupportTicket
from django.core import serializers
from rest_framework.decorators import api_view

@login_required
@api_view(['POST'])
def support_view(request):
    issue_types = IssueType.objects.all()
    search_query = request.GET.get('search', '').strip()
    tickets = SupportTicket.objects.filter(user=request.user).order_by('-created_at')

    if search_query:
        ticket_id_numeric = search_query.replace('#', '').strip()
        if ticket_id_numeric.isdigit():
            real_id = int(ticket_id_numeric) - 10000000
            tickets = tickets.filter(id=real_id)
        else:
            tickets = tickets.filter(
                Q(issue_option__name__icontains=search_query) |
                Q(issue_option__issue_type__name__icontains=search_query)
            )

    if request.method == 'POST':
        issue_type_id = request.POST.get('issue_type')
        issue_option_id = request.POST.get('select_issue')
        description = request.POST.get('description')
        image = request.FILES.get('image')

        if issue_type_id and issue_option_id:
            try:
                issue_option = IssueOption.objects.get(id=issue_option_id, issue_type_id=issue_type_id)
                ticket = SupportTicket.objects.create(
                    user=request.user,
                    created_by=request.user,
                    issue_option=issue_option,
                    description=description,
                    image=image
                )
                return JsonResponse({
                    'success': True,
                    'ticket_id': ticket.ticket_id(),
                    'message': 'Ticket created successfully.'
                })
            except IssueOption.DoesNotExist:
                return JsonResponse({'success': False, 'message': 'Invalid issue type or option'}, status=400)

        return JsonResponse({'success': False, 'message': 'Missing issue type or option'}, status=400)

    # If it's not POST, return HTML page as usual
    issue_options = IssueOption.objects.all()
    return render(request, 'support.html', {
        'issue_types': issue_types,
        'issue_options': issue_options,
        'tickets': tickets,
        'search_query': search_query,
    })
# 🔄 AJAX endpoint to get filtered issue options
@login_required
def get_issue_options(request):
    issue_type_id = request.GET.get('issue_type_id')
    options = []

    if issue_type_id:
        options = IssueOption.objects.filter(issue_type_id=issue_type_id).values('id', 'name')

    return JsonResponse({'options': list(options)})

@login_required
def filter_support_tickets(request):
    status = request.GET.get('status')
    issue_type = request.GET.get('issue_type')

    tickets = SupportTicket.objects.all()

    if status:
        tickets = tickets.filter(status=status)
    if issue_type:
        tickets = tickets.filter(issue_option__issue_type__name=issue_type)

    data = serializers.serialize("json", tickets.select_related("issue_option", "user"))
    return JsonResponse({"tickets": data})