from django.shortcuts import render, redirect
from django.contrib import messages
from ngopost.utils import dashboard_login_required
from datetime import datetime
from .models import NGOPost
import logging
from registration.models import UserProfile
# It's generally better to move reusable functions to a utils.py file
# in a shared app, but for now, we'll import from registration.
from registration.views import validate_and_save_file
from django.http import HttpResponseBadRequest
from dashboard.utils import dashboard_login_required
from django.http import JsonResponse, Http404
from django.views.decorators.http import require_GET
# Get an instance of a logger
logger = logging.getLogger(__name__)

@dashboard_login_required
def post_view(request):
    user = request.user_obj
    logger.info(f"User: {user.email} (ID: {user.id})")
    logger.info(f"Request method: {request.method}")
    if request.method == 'POST':
        logger.info(f"POST data: {request.POST}")
        logger.info(f"FILES data: {request.FILES}")
        try:
            # --- Extract data and strip whitespace ---
            header = request.POST.get('header', '').strip()
            description = request.POST.get('description', '').strip()
            tags = request.POST.get('tags', '').strip()
            post_type = request.POST.get('post_type', '').strip()
            donation_frequency = request.POST.get('donation_frequency', '').strip()
            target_donation = request.POST.get('target_donation', '').strip()
            
            country = request.POST.get('country', '').strip()
            state = request.POST.get('state', '').strip()
            city = request.POST.get('city', '').strip()
            pincode = request.POST.get('pincode', '').strip()

            age_group = request.POST.get('age', '').strip()
            gender = request.POST.get('gender', '').strip()
            spending_power = request.POST.get('spending_power', '').strip()
            start_date = request.POST.get('start-date','').strip()
            end_date = request.POST.get('end-date','').strip()

            creative_files = request.FILES.getlist('creatives')
            logger.info(f"Found {len(creative_files)} creative files.")

            creative1_file = creative_files[0] if len(creative_files) > 0 else None
            creative2_file = creative_files[1] if len(creative_files) > 1 else None
            # --- Basic Validation ---
            required_fields = {
                'Header': header, 'Description': description, 'Tags': tags,
                'Post Type': post_type, 'Target Donation': target_donation,
                'Country': country, 'State': state, 'City': city, 'Pincode': pincode,
                'Start Date': start_date, 'End Date': end_date,
                'Creative Upload': creative1_file
            }
            missing_fields = [name for name, value in required_fields.items() if not value]
            ajax_header = request.headers.get('x-requested-with')
            ajax_meta = request.META.get('HTTP_X_REQUESTED_WITH')
            logger.info(f"AJAX header: {ajax_header}, META: {ajax_meta}")
            is_ajax = (ajax_header == 'XMLHttpRequest' or ajax_meta == 'XMLHttpRequest')

            # --- File Validation and Saving ---
            creative1_path, error = validate_and_save_file(creative1_file, 'post_creatives', 'Creative 1')
            if error:
                if is_ajax:
                    return JsonResponse({'missing_fields': ['Creative Upload']})
                messages.error(request, error)
                return render(request, 'post.html', {'form_data': request.POST})

            creative2_path = None
            if creative2_file:
                creative2_path, error = validate_and_save_file(creative2_file, 'post_creatives', 'Creative 2')
                if error:
                    if is_ajax:
                        return JsonResponse({'missing_fields': ['Creative Upload']})
                    messages.error(request, error)
                    return render(request, 'post.html', {'form_data': request.POST})

            # --- AJAX Handling ---
            if is_ajax:
                if missing_fields:
                    return JsonResponse({'missing_fields': missing_fields})
                # Save post if no missing fields
                post = NGOPost(
                    user=user,
                    header=header,
                    description=description,
                    tags=tags,
                    post_type=post_type,
                    donation_frequency=donation_frequency,
                    target_donation=target_donation.replace('Rs', '').replace(',', '').strip(),
                    country=country,
                    state=state,
                    city=city,
                    pincode=pincode,
                    age_group=age_group,
                    gender=gender,
                    spending_power=spending_power,
                    start_date=start_date,
                    end_date=end_date,
                    creative1=creative1_path,
                    creative2=creative2_path
                )
                post.save()
                logger.info(f"Successfully saved new post with ID: {post.id}")
                return JsonResponse({'success': True})

            # --- Normal POST Handling ---
            if missing_fields:
                messages.error(request, f"Please fill all required fields: {', '.join(missing_fields)}")
                return render(request, 'post.html', {'form_data': request.POST})

            # Save post for normal POST
            post = NGOPost(
                user=user,
                header=header,
                description=description,
                tags=tags,
                post_type=post_type,
                donation_frequency=donation_frequency,
                target_donation=target_donation.replace('Rs', '').replace(',', '').strip(),
                country=country,
                state=state,
                city=city,
                pincode=pincode,
                age_group=age_group,
                gender=gender,
                spending_power=spending_power,
                start_date=start_date,
                end_date=end_date,
                creative1=creative1_path,
                creative2=creative2_path
            )
            post.save()
            logger.info(f"Successfully saved new post with ID: {post.id}")
            messages.success(request, "Your post has been successfully created!")
            return redirect('posts')

        except (ValueError, TypeError) as e:
            logger.error(f"Error processing form data: {e}", exc_info=True)
            messages.error(request, f"Invalid data submitted. Please check your inputs. Error: {e}")
        except Exception as e:
            logger.error(f"An unexpected error occurred in post_view: {e}", exc_info=True)
            messages.error(request, f"An unexpected error occurred: {e}")

    # For GET requests, fetch the post history
    post_history = NGOPost.objects.filter(user=user).order_by('-created_at')
    
    # Placeholder for saved posts until the logic is defined
    saved_posts = NGOPost.objects.filter(user=request.user_obj, saved=True) 

    context = {
        'post_history': post_history,
        'saved_posts': saved_posts,
    }
    return render(request, 'post.html', context)

@require_GET
def post_detail_ajax(request, post_id):
    try:
        post = NGOPost.objects.get(id=post_id)
    except NGOPost.DoesNotExist:
        raise Http404('Post not found')
    data = {
        'id': post.id,
        'header': post.header,
        'description': post.description,
        'tags': post.tags,
        'post_type': post.post_type,
        'donation_frequency': post.donation_frequency,
        'target_donation': post.target_donation,
        'country': post.country,
        'state': post.state,
        'city': post.city,
        'pincode': post.pincode,
        'age_group': post.age_group,
        'gender': post.gender,
        'views': post.views if hasattr(post, 'views') else 0,
        'post_reference_id': post.id,  # or post.reference_id if you have a custom field
        'uploaded_by': post.user.email if post.user else '',
        'status': post.status if hasattr(post, 'status') else '',
        'donation_received': post.donation_received if hasattr(post, 'donation_received') else 0,
        'date_time': str(post.created_at) if hasattr(post, 'created_at') else '',
        'spending_power': post.spending_power,
        'start_date': str(post.start_date),
        'end_date': str(post.end_date),
        'creative1': post.creative1.url if post.creative1 else '',
        'creative2': post.creative2.url if post.creative2 else '',
        # Add more fields as needed
    }
    logger.info(f"AJAX Preview Data for post {post_id}: {data}")
    return JsonResponse(data)


