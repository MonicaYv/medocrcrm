from django.shortcuts import render

# Create your views here.
def offers_view(request):
    return render(request, 'offers.html')