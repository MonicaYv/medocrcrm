import json
from datetime import datetime
from .utils import send_custom_email
from dashboard.utils import dashboard_login_required, get_common_context
from .models import IssueType, IssueOption, SupportTicket, FAQ, ChatOptionGroup, ChatSupport
from django.db.models import Q
from django.shortcuts import render, get_object_or_404
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods, require_GET, require_POST
from django.core.serializers.json import DjangoJSONEncoder
from registration.views import validate_and_save_file
from rest_framework import serializers
from django.conf import settings

@dashboard_login_required
@require_http_methods(["GET", "POST"])
def support_view(request):
    user = request.user_obj
    context = get_common_context(request, user)
    issue_types = IssueType.objects.all()
    search_query = request.GET.get('search', '').strip()

    issue_types = IssueType.objects.exclude(name='chatbot_query').all()
    tickets = SupportTicket.objects.filter(user_id=user.id).order_by('-created_at')

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
    context.update({
        'issue_types': issue_types,
        'tickets': tickets,
    })
    return render(request, 'support.html', context)

@dashboard_login_required
def get_issue_options(request):
    issue_type_id = request.GET.get('issue_type_id')
    options = IssueOption.objects.filter(issue_type_id=issue_type_id)
    data = [{'id': opt.id, 'name': opt.name} for opt in options]
    return JsonResponse({'options': data})

@require_POST
@dashboard_login_required
def log_custom_query(request):
    user = request.user_obj
    try:
        data = json.loads(request.body)
        query_text = data.get('query')

        if not query_text:
            return JsonResponse({'message': 'Query text is required.'}, status=400)
        
        if not user:
            return JsonResponse({'message': 'User not authenticated.'}, status=401)
        
        try:
            chatbot_issue_option = IssueOption.objects.get(
                issue_type__name='chatbot_query', 
                name='custome user query'         
            )
        except IssueOption.DoesNotExist:
            return JsonResponse(
                {'message': 'System error: Could not categorize query. Please contact direct support.'},
                status=500
            )
        except Exception as e:
            return JsonResponse(
                {'message': 'An internal error occurred while setting up the ticket.'},
                status=500
            )
        
        ticket = SupportTicket.objects.create(
            user=user,
            created_by=user, 
            issue_option=chatbot_issue_option, 
            description=query_text, 
            image=None 
        )

        return JsonResponse({
            'success': True,
            'ticket_id': ticket.ticket_id(),
            'message': 'Your query has been submitted as a ticket! We will get back to you shortly.'
        }, status=200)
    
    except json.JSONDecodeError:
        return JsonResponse({'message': 'Invalid data format.'}, status=400)
    
    except Exception as e:
        return JsonResponse({'message': 'An unexpected server error occurred. Please try again.'}, status=500)
    
@require_GET
@dashboard_login_required 
def get_user_tickets(request):
    try:
        user = request.user_obj
        user_tickets = SupportTicket.objects.filter(user=user).order_by('-created_at')

        tickets_data = []
        for ticket in user_tickets:
            tickets_data.append({
                'ticket_id': ticket.ticket_id(),
                'description': ticket.description,
                'status': ticket.status,
                'issue_option_name': ticket.issue_option.name if ticket.issue_option else 'N/A',
                'created_at': ticket.created_at.isoformat(), 
                # 'last_updated_at': ticket.created_at.isoformat(),
            })

        return JsonResponse({'success': True, 'tickets': tickets_data}, safe=False, encoder=DjangoJSONEncoder)

    except Exception as e:
        return JsonResponse({'success': False, 'message': 'Failed to retrieve tickets.'}, status=500)

@require_GET
@dashboard_login_required
def get_bot_content_api(request):
    user = request.user_obj

    # Default
    user_type = user.user_type or 'user'

    # Safety fallback if user_type is missing or generic
    if user_type == 'user':
        if hasattr(user, 'ngoprofile'):
            user_type = 'ngo'
        elif hasattr(user, 'advertiserprofile'):
            user_type = 'advertiser'
        elif hasattr(user, 'clientprofile'):
            user_type = 'client'
        elif hasattr(user, 'pharmacyprofile'):
            user_type = 'pharmacy'
        elif hasattr(user, 'lab_profile'):
            user_type = 'lab'
        elif hasattr(user, 'doctor_profile'):
            user_type = 'doctor'
        elif hasattr(user, 'hospital_profile'):
            user_type = 'hospital'

    try:
        chat_group = ChatOptionGroup.objects.get(
            user_type=user_type,
            is_active=True
        )
        return JsonResponse(chat_group.options_data, status=200)

    except ChatOptionGroup.DoesNotExist:
        try:
            user_group = ChatOptionGroup.objects.get(
                user_type='user',
                is_active=True
            )

            fallback_data = user_group.options_data.copy()

            if user_type != 'user':
                fallback_data["initial_message"] = (
                    f"No specific content found for your type ({user_type}). "
                    + fallback_data.get(
                        "initial_message",
                        "Here's some general information:"
                    )
                )

            return JsonResponse(fallback_data, status=200)

        except ChatOptionGroup.DoesNotExist:
            return JsonResponse(
                {
                    "initial_message": (
                        "Sorry, chatbot content is not configured. "
                        "Please contact support."
                    )
                },
                status=500
            )

    except Exception:
        return JsonResponse(
            {
                "initial_message": (
                    "Sorry, an unexpected error occurred. "
                    "Please try again later."
                )
            },
            status=500
        )


@dashboard_login_required 
def submit_support_ticket(request):
    user = request.user_obj

    if request.method == 'POST':
        issue_type_id = request.POST.get('issue_type')
        issue_option_id = request.POST.get('select_issue')
        description = request.POST.get('description')
        image_file = request.FILES.get('image')
        
        image_path = None
        if image_file:
            image_path, error = validate_and_save_file(
                image_file,
                subdir='support_issues',
                field_label='Support Ticket Image',
                user_type='user'
            )
            if error:
                return JsonResponse({'success': False, 'message': error}, status=400)

        if issue_type_id and issue_option_id:
            try:
                issue_option = IssueOption.objects.get(id=issue_option_id, issue_type_id=issue_type_id)
                ticket = SupportTicket.objects.create(
                    user=user,
                    created_by=user,
                    issue_option=issue_option,
                    description=description,
                    image=image_path,
                )
                return JsonResponse({'success': True, 'ticket_id': ticket.ticket_id(), 'message': 'Ticket created successfully.'})
            except IssueOption.DoesNotExist:
                return JsonResponse({'success': False, 'message': 'Invalid issue type or option'}, status=400)

        return JsonResponse({'success': False, 'message': 'Missing issue type or option'}, status=400)

    return JsonResponse({'success': False, 'message': 'Invalid request method'}, status=405)

@dashboard_login_required
def get_ticket_lists(request):
    user = request.user_obj
    user_type = user.user_type
    tickets = SupportTicket.objects.select_related(
        'issue_option__issue_type'
    ).filter(
        user__user_type=user_type,  
        user=user  
    ).order_by('-id')

    ticket_list = []

    for ticket in tickets:
        ticket_list.append({
            "ticket_id": ticket.ticket_id(),
            "date_time": ticket.created_at.strftime("%d/%m/%Y, %H:%M"),
            "issue_type": ticket.issue_option.issue_type.name if ticket.issue_option else "N/A",
            "status": ticket.get_status_display(),
            "status_class": get_status_class(str(ticket.status)),
        })

    return JsonResponse(ticket_list, safe=False)

@dashboard_login_required
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

def get_status_class(status_id):
    return {
        '1': 'bg-light-gray text-dark-gray',
        '2': 'bg-peach text-burnt-orange',
        '3': 'bg-dark-gray text-light-gray',
        '4': 'bg-mint-cream text-green',
        '5': 'bg-light-red text-dark-red',
        '6': 'bg-pale-red text-dark-red',
    }.get(status_id, 'badge-light')
    
@dashboard_login_required
def ticket_details(request):
    user = request.user_obj
    email = user.email
    usertype = user.user_type

    if request.method == "POST":
        try:
            data = json.loads(request.body)
            ticket_id = data.get("ticket_id", "")

            db_id = int(ticket_id.replace("#", "")) - 10000000

            ticket = SupportTicket.objects.select_related(
                "issue_option__issue_type", "created_by"
            ).get(id=db_id)

            created_at = ticket.created_at.strftime("%d/%m/%Y, %I:%M %p")
            updated_at = ticket.updated_at.strftime("%d/%m/%Y, %I:%M %p")

            if ticket.image:
                image_url = request.build_absolute_uri(
                    f"/document/{ticket.image}"
                )
            else:
                image_url = ""

            return JsonResponse({
                "ticket_id": ticket.ticket_id(),
                "email": email,
                "usertype": usertype,
                "created_at": created_at,
                "updated_at": updated_at,
                "issue_type": ticket.issue_option.issue_type.name if ticket.issue_option else "N/A",
                "status": ticket.get_status_display(),
                "description": ticket.description,
                "img": image_url,
            })

        except Exception as e:
            print("❌ ERROR in ticket_details:", str(e))
            return JsonResponse({"error": str(e)})

    return JsonResponse({"error": "Invalid request method"})

@dashboard_login_required
@require_http_methods(["GET", "POST"])
def ticket_messages(request, ticket_id):
    """Persist the existing ticket-chat controls, including media/attachments."""
    user = request.user_obj
    ticket = get_object_or_404(SupportTicket, id=ticket_id, user=user)
    session_id = f"ticket-{ticket.id}"
    if request.method == "POST":
        message = request.POST.get("message", "").strip()
        upload = request.FILES.get("attachment")
        if not message and not upload:
            return JsonResponse({"success": False, "message": "Enter a message or select a file."}, status=400)
        attachment_url = ""
        message_type = "text"
        if upload:
            attachment_url, error = validate_and_save_file(
                upload, subdir="support_chat", field_label="Support attachment", user_type="user"
            )
            if error:
                return JsonResponse({"success": False, "message": error}, status=400)
            message_type = "media" if upload.content_type.startswith("image/") or upload.content_type.startswith("video/") else "attachment"
        ChatSupport.objects.create(
            chat_session_id=session_id, user=user, message=message or upload.name,
            sender_type="user", sender_id=user.id, message_type=message_type,
            attachment_url=attachment_url or None,
        )
    messages = ChatSupport.objects.filter(chat_session_id=session_id).order_by("created_at")
    return JsonResponse({"success": True, "messages": [{
        "message": item.message, "sender_type": item.sender_type,
        "message_type": item.message_type,
        "attachment_url": (
            f"{settings.MEDIA_URL.rstrip('/')}/{item.attachment_url.lstrip('/')}"
            if item.attachment_url else ""
        ),
        "created_at": item.created_at.strftime("%H:%M"),
    } for item in messages]})

@dashboard_login_required
def filter_tickets(request):
    if request.method == "POST":
        data = json.loads(request.body)
        from_date_str = data.get("from_date")
        to_date_str = data.get("to_date")

        try:
            from_date = datetime.strptime(from_date_str, "%Y-%m-%d").date()
            to_date = (
                datetime.strptime(to_date_str, "%Y-%m-%d").date()
                if to_date_str else None
            )
        except Exception:
            return JsonResponse({"error": "Invalid date format"})

        if to_date:
            tickets = SupportTicket.objects.filter(
                created_at__date__gte=from_date,
                created_at__date__lte=to_date
            ).order_by("-created_at")
        else:
            tickets = SupportTicket.objects.filter(
                created_at__date=from_date
            ).order_by("-created_at")

        results = [
            {
                "ticket_id": ticket.ticket_id(),
                "date_time": ticket.created_at.strftime("%d/%m/%Y, %H:%M"),
                "issue_type": ticket.issue_option.issue_type.name if ticket.issue_option else "N/A",
                "status": ticket.get_status_display(),
                "status_class": get_status_class(ticket.status),
            }
            for ticket in tickets
        ]

        return JsonResponse({"tickets": results})

    return JsonResponse({"error": "Invalid method"})

def filter_tickets_old(request):
    if request.method == "POST":
        data = json.loads(request.body)
        from_date_str = data.get("from_date")
        to_date_str = data.get("to_date")

        try:
            from_date = datetime.strptime(from_date_str, "%Y-%m-%d").date()
            to_date = datetime.strptime(to_date_str, "%Y-%m-%d").date()
        except Exception:
            return JsonResponse({"error": "Invalid date format"})

        tickets = SupportTicket.objects.filter(
            created_at__date__gte=from_date,
            created_at__date__lte=to_date,
        ).order_by("-created_at")

        results = [
            {
                "ticket_id": ticket.ticket_id(),
                "date_time": ticket.created_at.strftime("%d/%m/%Y, %H:%M"),
                "issue_type": ticket.issue_option.issue_type.name if ticket.issue_option else "N/A",
                "status": ticket.get_status_display(),
                "status_class": get_status_class(ticket.status),
            }
            for ticket in tickets
        ]

        return JsonResponse({"tickets": results})

    return JsonResponse({"error": "Invalid method"})

@dashboard_login_required
def faq_lists(request):
    user = request.user_obj
    query = request.GET.get('search', '').strip()

    if query:
        faqs = FAQ.objects.filter(
            Q(question__icontains=query) | Q(answer__icontains=query),
            user=user
        )
    else:
       faqs = FAQ.objects.filter(user=user)

    return render(request, 'support-faq.html', {'faqs': faqs})

def faq_lists_old(request):
    query = request.GET.get('search', '').strip()

    if query:
        faqs = FAQ.objects.filter(
            Q(question__icontains=query) | Q(answer__icontains=query)
        )
    else:
        faqs = FAQ.objects.all()

    return render(request, 'support-faq.html', {'faqs': faqs})

def send_support_email(request):
    if request.method == 'POST':
        email = request.POST.get('email')
        description = request.POST.get('description')

        if not email or not description:
            return JsonResponse({'error': 'Missing fields'}, status=400)

        try:
            context = {
                'email': email,
                'description': description,
            }

            send_custom_email(
                to_email='laxmi.kumari@aibuzz.net',
                subject=f"Support Request from {email}",
                template_name='emails/email-template.html',
                context=context,
                from_email=email
            )

            return JsonResponse({'message': 'Email sent successfully!'})
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)

    return JsonResponse({'error': 'Invalid request'}, status=400)
