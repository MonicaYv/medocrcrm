from django.test import SimpleTestCase, override_settings

from .views import build_media_url


@override_settings(MEDIA_URL="/document/", MEDIA_ROOT=r"C:\app\document")
class BuildMediaUrlTests(SimpleTestCase):
    def test_keeps_full_stored_pharmacy_path(self):
        url = build_media_url(
            "pharmacy_docs/store_front/store.jpg",
            "pharmacy_docs/store_front",
        )

        self.assertEqual(url, "/document/pharmacy_docs/store_front/store.jpg")

    def test_prefixes_legacy_basename_with_default_subdir(self):
        url = build_media_url("store.jpg", "pharmacy_docs/store_front")

        self.assertEqual(url, "/document/pharmacy_docs/store_front/store.jpg")

    def test_strips_existing_media_prefix(self):
        url = build_media_url(
            "document/pharmacy_docs/store_front/store.jpg",
            "pharmacy_docs/store_front",
        )

        self.assertEqual(url, "/document/pharmacy_docs/store_front/store.jpg")

    def test_leaves_absolute_or_remote_urls_unchanged(self):
        self.assertEqual(build_media_url("/document/store.jpg"), "/document/store.jpg")
        self.assertEqual(build_media_url("https://example.com/store.jpg"), "https://example.com/store.jpg")
