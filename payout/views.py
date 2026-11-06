from django.shortcuts import render

# Create your views here.
def payout_view(request):
    return render(request, 'payout.html')