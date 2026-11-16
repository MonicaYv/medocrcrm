from types import SimpleNamespace
from unittest.mock import patch

from django.test import RequestFactory, SimpleTestCase

from settings.views import send_change_password_otp


class SendChangePasswordOtpTests(SimpleTestCase):
    def setUp(self):
        self.request = RequestFactory().post("/settings/send-change-password-otp/")
        self.request.session = {"user_id": 1}
        self.user = SimpleNamespace(email="ngo@example.com")

    @patch("dashboard.utils.User.objects.filter")
    @patch("settings.views.async_to_sync")
    def test_missing_email_returns_bad_request(self, async_to_sync, user_filter):
        self.user.email = ""
        user_filter.return_value.first.return_value = self.user

        response = send_change_password_otp(self.request)

        self.assertEqual(response.status_code, 400)
        self.assertIn(b"No email address", response.content)
        async_to_sync.assert_not_called()

    @patch("dashboard.utils.User.objects.filter")
    @patch("settings.views.async_to_sync")
    def test_email_send_exception_returns_gateway_error(self, async_to_sync, user_filter):
        user_filter.return_value.first.return_value = self.user
        async_to_sync.return_value.side_effect = OSError("SMTP unavailable")

        response = send_change_password_otp(self.request)

        self.assertEqual(response.status_code, 502)
        self.assertIn(b"Unable to send OTP email", response.content)

    @patch("settings.views.cache.set")
    @patch("dashboard.utils.User.objects.filter")
    @patch("settings.views.async_to_sync")
    def test_successful_send_caches_otp_token(
        self, async_to_sync, user_filter, cache_set
    ):
        user_filter.return_value.first.return_value = self.user
        async_to_sync.return_value.return_value = {
            "success": True,
            "otp_token": "secret",
        }

        response = send_change_password_otp(self.request)

        self.assertEqual(response.status_code, 200)
        self.assertIn(b'"success": true', response.content)
        cache_set.assert_called_once()
