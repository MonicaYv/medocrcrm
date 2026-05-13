from django.shortcuts import render
from dashboard.utils import dashboard_login_required, get_common_context
import os
import tempfile
from django.http import JsonResponse
# from .utils import process_document
import os
import requests
import traceback

OCR_SERVICE_URL = os.getenv("OCR_SERVICE_URL")

@dashboard_login_required
def shared(request):
    user = request.user_obj
    context = get_common_context(request, user)
    return render(request, 'share.html', context)

@dashboard_login_required
def ocr_upload(request):
    if request.method != "POST":
        return JsonResponse({"error": "Only POST allowed"}, status=405)

    file = request.FILES.get("file")
    if not file:
        return JsonResponse({"error": "No file uploaded"}, status=400)

    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(file.name)[1]) as tmp_file:
            for chunk in file.chunks():
                tmp_file.write(chunk)
            tmp_path = tmp_file.name

        with open(tmp_path, "rb") as f:
            response = requests.post(
                OCR_SERVICE_URL,
                files={"file": f},
                timeout=60
            )

        result = response.json()
        os.remove(tmp_path)

        return JsonResponse(result, safe=False)

    except Exception as e:
        traceback.print_exc()
        return JsonResponse({"error": str(e)}, status=500)

@dashboard_login_required
def database_upload(request):
    pass

@dashboard_login_required
def save_bills(request):
    pass

@dashboard_login_required
def save_prescriptions(request):
    pass