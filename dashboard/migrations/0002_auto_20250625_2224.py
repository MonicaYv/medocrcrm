from django.db import migrations

def create_initial_sidebar_menus(apps, schema_editor):
    SettingMenu = apps.get_model('dashboard', 'SettingMenu')
    sidebar_items = [
        {
            "name": "Home",
            "url": "/",
            "icon": "home",
            "order": 1,
            "user_types": ['advertiser', 'client', 'ngo', 'provider', 'user'],
        },
        {
            "name": "Maps",
            "url": "/map/",
            "icon": "map_search",
            "order": 2,
            "user_types": ['advertiser', 'client', 'ngo', 'provider', 'user'],
        },
        {
            "name": "Posts",
            "url": "/posts/",
            "icon": "post_add",
            "order": 3,
            "user_types": ['ngo'],
        },
        {
            "name": "Coupons",
            "url": "/coupons/",
            "icon": "coupons",
            "order": 3,
            "user_types": ['advertiser'],
        },
        {
            "name": "Subscription",
            "url": "/subscription/",
            "icon": "credit_score",
            "order": 3,
            "user_types": ['client'],
        },
        {
            "name": "Reports",
            "url": "/reports/",
            "icon": "document_scanner",
            "order": 4,
            "user_types": ['client'],
        },
        {
            "name": "Points",
            "url": "/points/",
            "icon": "account_balance_wallet",
            "order": 5,
            "user_types": ['advertiser', 'client', 'ngo', 'provider', 'user'],
        },
        {
            "name": "Settings",
            "url": "/settings/",
            "icon": "settings",
            "order": 6,
            "user_types": ['advertiser', 'client', 'ngo', 'provider', 'user'],
        },
        {
            "name": "Help",
            "url": "/help/",
            "icon": "call",
            "order": 7,
            "user_types": ['advertiser', 'client', 'ngo', 'provider', 'user'],
        },
        {
            "name": "Donate",
            "url": "/donate/",
            "icon": "volunteer_activism",
            "order": 8,
            "user_types": ['user', 'advertiser', 'client', 'provider'],
        },
    ]

    for item in sidebar_items:
        SettingMenu.objects.update_or_create(
            name=item["name"],
            defaults={
                "url": item["url"],
                "icon": item["icon"],
                "order": item["order"],
                "user_types": item["user_types"],
                "is_active": True,
            }
        )

class Migration(migrations.Migration):

    dependencies = [
        ('dashboard', '0001_initial'), # or your previous migration name
    ]

    operations = [
        migrations.RunPython(create_initial_sidebar_menus),
    ]
