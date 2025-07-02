from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.conf import settings

def send_custom_email(
    to_email,
    subject,
    template_name,
    context,
    from_email=None,
):
    if from_email is None:
        from_email = settings.DEFAULT_FROM_EMAIL
    html_content = render_to_string(template_name, context)
    msg = EmailMultiAlternatives(
        subject=subject,
        body=html_content,
        from_email=from_email,
        to=[to_email],
    )
    msg.attach_alternative(html_content, "text/html")
    msg.send()
