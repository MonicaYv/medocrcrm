import re
import json
import polyline
import requests
from bson import ObjectId
from django.conf import settings
from django.http import JsonResponse
from .models import SavedLocation, SearchHistory, PincodeLocation
from registration.models import NGOProfile, AdvertiserProfile, ClientProfile, PharmacyProfile, LabProfile, DoctorProfile, HospitalProfile
from django.views.decorators.csrf import csrf_exempt
from django.shortcuts import render
from math import radians, cos, sin, sqrt, atan2
from dashboard.utils import dashboard_login_required, get_common_context
from django.views.decorators.http import require_POST

@dashboard_login_required
def map_view(request):
    user = request.user_obj
    if user.user_type == 'ngo':
        profile = NGOProfile.objects.filter(user=user).first()
    elif user.user_type == 'advertiser':
        profile = AdvertiserProfile.objects.filter(user=user).first()
    elif user.user_type == 'client':
        profile = ClientProfile.objects.filter(user=user).first()
    elif user.user_type == 'pharmacy':
        profile = PharmacyProfile.objects.filter(user=user).first()
    elif user.user_type == 'lab':
        profile = LabProfile.objects.filter(user=user).first()
    elif user.user_type == 'doctor':
        profile = DoctorProfile.objects.filter(user=user).first()
    elif user.user_type == 'hospital':
        profile = HospitalProfile.objects.filter(user=user).first()
    else:
        pass

    if profile:
        context = get_common_context(request, user)
        context.update({
            'user': user,
            'address': profile.address if hasattr(profile, 'address') else '',
            'city': profile.city,
            'state': profile.state,
            'pincode': profile.pincode,
        })
        return render(request, 'maps/maps.html', context)
    else:
        return JsonResponse({"error": "Invalid input"}, status=400)

@dashboard_login_required
@require_POST
def get_routes(request):
    try:
        body = json.loads(request.body)
        start_lat = body.get('start_lat')
        start_lng = body.get('start_lng')
        end_lat = body.get('end_lat')
        end_lng = body.get('end_lng')
        mode = body.get('mode', 'auto')
    except Exception as e:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)
    if not all([start_lat, start_lng, end_lat, end_lng]):
        return JsonResponse({'error': 'Missing coordinates'}, status=400)
    urls = [
        "http://192.168.1.110:3095/route",  # Local
        "https://valhalla1.openstreetmap.de/route"  # Public fallback
    ]
    payload = {
        "locations": [
            {"lat": float(start_lat), "lon": float(start_lng)},
            {"lat": float(end_lat), "lon": float(end_lng)}
        ],
        "costing": mode,
        "alternatives": True,
        "directions_options": {
            "units": "kilometers",
            "language": "en-US"
        },
        "alternatives": {
            "target_count": 3
        }
    }
    headers = {'Content-Type': 'application/json'}
    last_exception = None
    
    for valhalla_url in urls:
        try:
            response = requests.post(valhalla_url, data=json.dumps(payload), headers=headers, timeout=5)
            response.raise_for_status()
            data = response.json()

            routes = []
            for leg in data.get('trip', {}).get('legs', []):
                shape = leg.get('shape')
                summary = leg.get('summary', {})
                maneuvers = leg.get('maneuvers', [])

                decoded_coords = polyline.decode(shape, precision=6)
                steps = []
                for m in maneuvers:
                    steps.append({
                        'instruction': m.get('instruction'),
                        'length': m.get('length'),
                        'time': m.get('time')
                    })

                routes.append({
                    'coordinates': decoded_coords,
                    'distance': summary.get('length'),
                    'duration': summary.get('time'),
                    'steps': steps
                })
            return JsonResponse({'routes': routes})

        except requests.exceptions.RequestException as e:
            last_exception = e
            continue

    return JsonResponse({'error': f"All routing servers failed: {last_exception}"}, status=500)

@require_POST
@csrf_exempt
def get_amenities(request):
    """
    Expects JSON body:
    {   "lat": 18.5204,
        "lng": 73.8567,
        "type": "hospital"    # one of: hospital, pharmacy, doctor, lab }
    Returns JSON response:{ "amenities": [
        {
            "title": "...",
        }…]}
    """
    try:
        body = json.loads(request.body)
        lat = float(body.get("lat"))
        lng = float(body.get("lng"))
        amenity_type = body.get("type", "").lower()
        range = body.get("range", 1000)
    except (ValueError, TypeError, json.JSONDecodeError):
        return JsonResponse({"error": "Invalid payload"}, status=400)

    if amenity_type not in ("hospital", "pharmacy", "doctor", "lab"):
        return JsonResponse({"error": "Unknown amenity type"}, status=400)

    coll = settings.MONGO_COLLECTIONS[amenity_type]
    query = {
        "location": {
            "$near": {
                "$geometry": {"type": "Point", "coordinates": [lng, lat]},
                "$maxDistance": range
            }
        }
    }

    docs = list(
        coll.find(query)
        .limit(100)
        )
    amenities = []
    for d in docs:
        coords = d.get("location", {}).get("coordinates", [None, None])
        amenities.append({
            "mongo_id":     str(d.get("_id")),
            "type":          amenity_type,
            "title":         d.get("title"),
            "rating":        d.get("rating"),
            "reviews":       d.get("reviews"),
            "website":       d.get("website"),
            "phone_number":  d.get("phone_number"),
            "address":       d.get("address"),
            "latitude":      d.get("location", {}).get("coordinates", [])[1],
            "longitude":     d.get("location", {}).get("coordinates", [])[0],
            "opening_hours": d.get("opening_hours"),
            "tags": {
                "payment_modes":    d.get("payment_accepted"),
                "delivery_options": d.get("delivery_options"),
                "visit_policy":     d.get("visit_policy"),
                'parking':         d.get("parking"),
                'wifi':            d.get("wifi_availability"),
            }
        })

    return JsonResponse({"amenities": amenities})

def haversine(lat1, lon1, lat2, lon2):
    R = 6371
    d_lat = radians(lat2 - lat1)
    d_lon = radians(lon2 - lon1)
    a = sin(d_lat/2)**2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(d_lon/2)**2
    return R * 2 * atan2(sqrt(a), sqrt(1-a))

SEARCH_COLLECTIONS = {
    "doctor": settings.MONGO_COLLECTIONS["doctor"],
    "hospital": settings.MONGO_COLLECTIONS["hospital"],
    "lab": settings.MONGO_COLLECTIONS["lab"],
    "pharmacy": settings.MONGO_COLLECTIONS["pharmacy"],
}

@dashboard_login_required
@require_POST
def search_by_name(request):
    try:
        data = json.loads(request.body)
        query = data.get("q", "").strip()
        user_lat = float(data.get("lat"))
        user_lng = float(data.get("lng"))
    except (ValueError, TypeError, json.JSONDecodeError):
        return JsonResponse({"error": "Invalid input"}, status=400)

    if not query:
        return JsonResponse({"results": []})

    results = []
    places = []

    for type_key, collection in SEARCH_COLLECTIONS.items():
        matches = collection.find({
            "title": {"$regex": query, "$options": "i"},
            "location": {
                "$near": {
                    "$geometry": {
                        "type": "Point",
                        "coordinates": [user_lng, user_lat]
                    }
                }
            }
        }).limit(10)
        for doc in matches:
            coords = doc.get("location", {}).get("coordinates", [None, None])
            if coords[0] is None or coords[1] is None:
                continue
            
            rating = float(doc.get("rating") or 0)
            review_count = int(doc.get("reviews") or 0)

            results.append({
                "mongo_id": str(doc.get("_id")),
                "type": type_key,
                "title": doc.get("title"),
                "rating": rating,
                "reviews": review_count,
                "phone_number": doc.get("phone_number"),
                "email": doc.get("email", ""),
                "address": doc.get("address"),
                "latitude": coords[1],
                "longitude": coords[0],
                "distance": haversine(user_lat, user_lng, coords[1], coords[0]),
                "tags": {
                    "payment_modes":    doc.get("payment_modes"),
                    "delivery_options": doc.get("delivery_options"),
                    "visit_policy":     doc.get("visit_policy")
                }
            })

    # matches = settings.PLACES_COORDINATES.find({
    #     "full_text": {"$regex": query, "$options": "i"},
    #     "location": {
    #         "$near": {
    #             "$geometry": {
    #                 "type": "Point",
    #                 "coordinates": [user_lng, user_lat]
    #             }
    #         }
    #     }
    # })
    # for place in matches:
    #     coords = place.get("location", {}).get("coordinates", [None, None])
    #     if coords[0] is None or coords[1] is None:
    #         continue

    #     places.append({
    #         "mongo_id": str(place.get("_id")),
    #         "name": place.get("name"),
    #         "type": place.get("type"),
    #         "class": place.get("class"),
    #         "latitude": coords[1],
    #         "longitude": coords[0],
    #         "distance": haversine(user_lat, user_lng, coords[1], coords[0]),
    #         "country_code": place.get("country_code"),
    #         "osm_type": place.get("osm_type"),
    #         "importance": place.get("importance"),
    #         "full_text": place.get("full_text")
    #     })
        
    # places.sort(key=lambda x: (x["distance"], -x["importance"]))
    results.sort(key=lambda x: (x["distance"], -x["rating"], -x["reviews"]))
    
    # Limit results to top 5 for both
    return JsonResponse({"results": results[:5], "places": None})

# @require_POST
# def search_autocomplete(request):
#     try:
#         data = json.loads(request.body)
#         query = data.get("q", "").strip()
#         if not query:
#             return JsonResponse({"results": []})
#     except (ValueError, json.JSONDecodeError):
#         return JsonResponse({"error": "Invalid request"}, status=400)

#     try:
#         response = requests.get(
#             "http://122.170.111.109:3090/api",
#             params={"q": query},
#             timeout=3
#         )
#         response.raise_for_status()
#         photon_data = response.json()
#     except Exception as e:
#         return JsonResponse({"error": str(e)}, status=500)

#     results = []
#     for feature in photon_data.get("features", []):
#         geometry = feature.get("geometry", {}).get("coordinates", [None, None])
#         props = feature.get("properties", {})
#         if geometry[0] is not None and geometry[1] is not None:
#             results.append({
#                 "name": props.get("name") or props.get("street") or "Unnamed",
#                 "city": props.get("city"),
#                 "country": props.get("country"),
#                 "latitude": geometry[1],
#                 "longitude": geometry[0],
#                 "label": props.get("label")
#             })

#     return JsonResponse({"results": results})

@dashboard_login_required
def saved_amenity(request):
    user = request.user_obj

    if request.method == "POST":
        try:
            data = json.loads(request.body)
            mongo_id = data["mongo_id"]
            amenity_type = data["type"].lower()
        except (KeyError, json.JSONDecodeError):
            return JsonResponse({"error": "Invalid request"}, status=400)

        if amenity_type not in ("hospital", "pharmacy", "doctor", "lab"):
            return JsonResponse({"error": "Invalid amenity type"}, status=400)

        try:
            oid = ObjectId(mongo_id)
            coll = settings.MONGO_COLLECTIONS[amenity_type]
            doc = coll.find_one({"_id": oid})
            if not doc:
                return JsonResponse({"error": "Amenity not found"}, status=404)
        except Exception:
            return JsonResponse({"error": "Invalid ID"}, status=400)

        saved, created = SavedLocation.objects.get_or_create(
            user=user,
            mongo_id=str(mongo_id),
            amenity_type=amenity_type
        )

        if not created:
            return JsonResponse({"message": "Already saved"})

        return JsonResponse({
            "message": "Amenity saved",
            "saved_id": str(saved.id),
            "created": created
        })

    elif request.method == "GET":
        saved_locations = SavedLocation.objects.filter(user=user)

        grouped = {}
        for loc in saved_locations:
            grouped.setdefault(loc.amenity_type, []).append(ObjectId(loc.mongo_id))

        results = []
        for amenity_type, ids in grouped.items():
            coll = settings.MONGO_COLLECTIONS[amenity_type]
            docs = coll.find({"_id": {"$in": ids}})
            for d in docs:
                results.append({
                    "mongo_id":      str(d.get("_id")),
                    "type":          amenity_type,
                    "title":         d.get("title"),
                    "rating":        d.get("rating"),
                    "reviews":       d.get("reviews"),
                    "website":       d.get("website"),
                    "phone_number":  d.get("phone_number"),
                    "address":       d.get("address"),
                    "latitude":      d.get("location", {}).get("coordinates", [])[1],
                    "longitude":     d.get("location", {}).get("coordinates", [])[0],
                    "opening_hours": d.get("opening_hours"),
                    "is_bookmarked": True,
                    "tags": {
                        "payment_modes":    d.get("payment_accepted"),
                        "delivery_options": d.get("delivery_options"),
                        "visit_policy":     d.get("visit_policy"),
                        'parking':          d.get("parking"),
                        'wifi':             d.get("wifi_availability"),
                    }
                })

        return JsonResponse({"saved": results})

    else:
        return JsonResponse({"error": "Method not allowed"}, status=405)

@dashboard_login_required
@require_POST
def remove_from_saved(request):
    try:
        body = json.loads(request.body)
        mongo_id = body["mongo_id"]
        amenity_type = body["amenity_type"]
    except (KeyError, json.JSONDecodeError):
        return JsonResponse({"error": "Invalid request"}, status=400)

    user = request.user_obj
    deleted, _ = SavedLocation.objects.filter(
        user=user,
        mongo_id=mongo_id,
        amenity_type=amenity_type
    ).delete()

    if deleted == 0:
        return JsonResponse({"message": "Not found in saved locations"}, status=404)
    
    return JsonResponse({"message": "Removed from saved locations"})

@dashboard_login_required
def search_history(request):
    user = request.user_obj

    if request.method == "POST":
        try:
            body = json.loads(request.body)
            mongo_id = body["mongo_id"]
            amenity_type = body["type"].lower()
        except (KeyError, json.JSONDecodeError):
            return JsonResponse({"error": "Invalid payload"}, status=400)

        if amenity_type not in ("hospital", "pharmacy", "doctor", "lab"):
            return JsonResponse({"error": "Invalid amenity type"}, status=400)

        try:
            oid = ObjectId(mongo_id)
        except Exception:
            return JsonResponse({"error": "Invalid MongoDB ID"}, status=400)

        coll = settings.MONGO_COLLECTIONS.get(amenity_type)
        if not coll or not coll.find_one({"_id": oid}):
            return JsonResponse({"error": "Amenity not found"}, status=404)

        saved, created = SearchHistory.objects.get_or_create(
            user=user,
            mongo_id=mongo_id,
            amenity_type=amenity_type
        )
        excess = SearchHistory.objects.filter(user=user).order_by('-id')[500:]
        if excess.exists():
            excess.delete()

        if not created:
            return JsonResponse({"message": "Already logged"})

        return JsonResponse({"message": "History saved"})

    elif request.method == "GET":
        try:
            limit = int(request.GET.get("limit", 10))
        except (ValueError, TypeError):
            return JsonResponse({"error": "Invalid limit"}, status=400)

        clicks = user.search_clicks.all()[:limit]

        grouped = {}
        for click in clicks:
            grouped.setdefault(click.amenity_type, []).append(ObjectId(click.mongo_id))

        results = []
        for amenity_type, ids in grouped.items():
            coll = settings.MONGO_COLLECTIONS[amenity_type]
            docs = coll.find({"_id": {"$in": ids}})
            for d in docs:
                results.append({
                    "mongo_id":     str(d.get("_id")),
                    "type":          amenity_type,
                    "title":         d.get("title"),
                    "rating":        d.get("rating"),
                    "reviews":       d.get("reviews"),
                    "website":       d.get("website"),
                    "phone_number":  d.get("phone_number"),
                    "address":       d.get("address"),
                    "latitude":      d.get("location", {}).get("coordinates", [])[1],
                    "longitude":     d.get("location", {}).get("coordinates", [])[0],
                    "opening_hours": d.get("opening_hours"),
                    "tags": {
                        "payment_modes":    d.get("payment_accepted"),
                        "delivery_options": d.get("delivery_options"),
                        "visit_policy":     d.get("visit_policy"),
                        'parking':          d.get("parking"),
                        'wifi':             d.get("wifi_availability"),
                    }
                })

        return JsonResponse({"clicked_results": results})

    else:
        return JsonResponse({"error": "Method not allowed"}, status=405)

@dashboard_login_required
@require_POST
def remove_from_history(request):
    try:
        body = json.loads(request.body)
        mongo_id = body["mongo_id"]
        amenity_type = body["amenity_type"]
    except (KeyError, json.JSONDecodeError):
        return JsonResponse({"error": "Invalid request"}, status=400)

    user = request.user_obj
    deleted, _ = SearchHistory.objects.filter(
        user=user,
        mongo_id=mongo_id,
        amenity_type=amenity_type
    ).delete()

    if deleted == 0:
        return JsonResponse({"message": "Not found in search history"}, status=404)

    return JsonResponse({"message": "Removed from search history"})

@require_POST
def reverse_geocode(request):
    try:
        body = json.loads(request.body)

        # Extract input
        city = body.get("profile_city").strip()
        pincode = body.get("profile_pincode").strip()
        if not city or not pincode:
            return JsonResponse({"error": "City name and pincode are required"}, status=400)

        if pincode:
            pincode_match = PincodeLocation.objects.filter(pincode=pincode).first()
            if pincode_match:
                return JsonResponse({
                    "latitude": pincode_match.latitude,
                    "longitude": pincode_match.longitude,
                    "location_name": f"Pincode {pincode}"
                })


        # Build regex for city name
        regex_query = {"$regex": re.escape(city), "$options": "i"}

        # Only search for type: city to avoid noise
        mongo_query = {
            "full_text": regex_query,
            "type": "city"
        }

        # No geospatial filtering
        matches = settings.PLACES_COORDINATES.find(mongo_query).limit(20)

        places = []
        for place in matches:
            coords = place.get("location", {}).get("coordinates", [None, None])
            if coords[0] is None or coords[1] is None:
                continue

            places.append({
                "name": place.get("name"),
                "type": place.get("type"),
                "latitude": coords[1],
                "longitude": coords[0],
                "importance": place.get("importance"),
                "full_text": place.get("full_text")
            })

        if not places:
            return JsonResponse({"error": "No matching city found"}, status=404)

        # Sort only by importance (no distance, since not spatial)
        places.sort(key=lambda x: -x["importance"])

        top = places[0]

        return JsonResponse({
            "latitude": top["latitude"],
            "longitude": top["longitude"],
            "location_name": top["full_text"] or top["name"]
        })

    except Exception as e:
        return JsonResponse({"error": "Reverse geocoding failed", "details": str(e)}, status=500)
