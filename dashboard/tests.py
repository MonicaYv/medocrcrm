from django.test import SimpleTestCase, override_settings

from .utils import POINTS_ACTION_ALIASES
from .views import build_media_url


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
