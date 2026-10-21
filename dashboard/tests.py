from datetime import date

from django.test import RequestFactory, SimpleTestCase, override_settings

from .utils import POINTS_ACTION_ALIASES
from .views import (
    build_media_url,
    get_dashboard_appointment_date_range,
    parse_pharmacy_overview_range,
)


@override_settings(MEDIA_URL="/document/")
class BuildMediaUrlTests(SimpleTestCase):
    def test_builds_document_url_for_stored_coupon_image_path(self):
        url = build_media_url("advertiser_docs/coupon_images/coupon.jpg")

        self.assertEqual(url, "/document/advertiser_docs/coupon_images/coupon.jpg")

    def test_strips_existing_media_prefix(self):
        url = build_media_url("document/advertiser_docs/coupon_images/coupon.jpg")

        self.assertEqual(url, "/document/advertiser_docs/coupon_images/coupon.jpg")

    def test_leaves_absolute_urls_unchanged(self):
        self.assertEqual(build_media_url("/document/coupon.jpg"), "/document/coupon.jpg")
        self.assertEqual(build_media_url("https://example.com/coupon.jpg"), "https://example.com/coupon.jpg")


class PointsChartDataTests(SimpleTestCase):
    def test_coupon_aliases_include_plural_action_name(self):
        self.assertIn("Coupons", POINTS_ACTION_ALIASES["Coupon"])


class DashboardAppointmentDateRangeTests(SimpleTestCase):
    def setUp(self):
        self.factory = RequestFactory()
        self.today = date(2026, 10, 16)

    def test_week_filter_returns_last_seven_days(self):
        request = self.factory.get("/", {"date_filter": "week"})

        self.assertEqual(
            get_dashboard_appointment_date_range(request, self.today),
            ("week", date(2026, 10, 10), self.today),
        )

    def test_custom_filter_sorts_reversed_dates(self):
        request = self.factory.get(
            "/",
            {
                "date_filter": "custom",
                "start_date": "2026-10-15",
                "end_date": "2026-10-12",
            },
        )

        self.assertEqual(
            get_dashboard_appointment_date_range(request, self.today),
            ("custom", date(2026, 10, 12), date(2026, 10, 15)),
        )

    def test_invalid_custom_dates_fall_back_to_today(self):
        request = self.factory.get(
            "/",
            {"date_filter": "custom", "start_date": "invalid"},
        )

        self.assertEqual(
            get_dashboard_appointment_date_range(request, self.today),
            ("today", self.today, self.today),
        )


class PharmacyOverviewDateRangeTests(SimpleTestCase):
    def setUp(self):
        self.today = date(2026, 10, 21)

    def test_week_filter_includes_today_and_previous_six_days(self):
        self.assertEqual(
            parse_pharmacy_overview_range("week", "", "", self.today),
            (date(2026, 10, 15), self.today),
        )

    def test_month_filter_includes_today_and_previous_twenty_nine_days(self):
        self.assertEqual(
            parse_pharmacy_overview_range("month", "", "", self.today),
            (date(2026, 9, 22), self.today),
        )

    def test_custom_filter_sorts_reversed_dates(self):
        self.assertEqual(
            parse_pharmacy_overview_range(
                "custom", "2026-10-20", "2026-10-12", self.today
            ),
            (date(2026, 10, 12), date(2026, 10, 20)),
        )

    def test_custom_filter_requires_both_valid_dates(self):
        with self.assertRaises(ValueError):
            parse_pharmacy_overview_range(
                "custom", "2026-10-12", "", self.today
            )
