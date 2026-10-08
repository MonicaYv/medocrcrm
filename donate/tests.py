from decimal import Decimal
from types import SimpleNamespace
from unittest.mock import Mock, patch

from django.test import SimpleTestCase

from .views import _get_donation_document_data


class DonationDocumentDataTests(SimpleTestCase):
    @patch("donate.views.ContactPerson.objects.filter")
    @patch("donate.views.NGOProfile.objects.filter")
    @patch("donate.views.Donation.objects")
    def test_document_data_handles_missing_optional_fields(
        self, donation_manager, ngo_profile_filter, contact_person_filter
    ):
        user = SimpleNamespace(user_type="doctor", email="doctor@example.com")
        donation = SimpleNamespace(
            id=17,
            ngopost=SimpleNamespace(user=Mock()),
            payment_date=None,
            amount=Decimal("100.00"),
            payment_method="UPI",
            gst=None,
        )
        donation_manager.select_related.return_value.filter.return_value.first.return_value = donation
        ngo_profile_filter.return_value.first.return_value = None
        contact_person_filter.return_value.first.return_value = None

        result = _get_donation_document_data(user, donation.id)

        self.assertEqual(result["receipt_no"], donation.id)
        self.assertEqual(result["payment_date"], "")
        self.assertEqual(result["ngo_name"], "")
        self.assertEqual(result["name"], "")
        self.assertEqual(result["gst"], "0.00")
        self.assertEqual(result["finalTotal"], "100.00")
        donation_manager.select_related.return_value.filter.assert_called_once_with(
            id=donation.id, user=user
        )

    @patch("donate.views.Donation.objects")
    def test_document_data_returns_none_for_unknown_or_other_users_donation(
        self, donation_manager
    ):
        user = SimpleNamespace(user_type="doctor", email="doctor@example.com")
        donation_manager.select_related.return_value.filter.return_value.first.return_value = None

        self.assertIsNone(_get_donation_document_data(user, 999))
