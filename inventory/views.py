from django.shortcuts import render

# Create your views here.

def inventory_view(request):
    return render(request, 'inventory.html')