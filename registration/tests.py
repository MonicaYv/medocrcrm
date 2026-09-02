from django.test import TestCase

from registration.views import identify_duplicate_kyc_field


class DuplicateKycFieldIdentificationTests(TestCase):
    def test_email_duplicate_message(self):
        field, message = identify_duplicate_kyc_field(
            'duplicate key value violates unique constraint "registration_user_email_key"'
        )

        self.assertEqual(field, "email")
        self.assertEqual(message, "Email already exists.")

    def test_phone_duplicate_message(self):
        field, message = identify_duplicate_kyc_field(
            'Key (phone_number)=(9999999999) already exists.'
        )

        self.assertEqual(field, "phone_number")
        self.assertEqual(message, "Phone number already exists.")

    def test_registration_number_duplicate_message(self):
        field, message = identify_duplicate_kyc_field(
            'duplicate key value violates unique constraint "registration_hospitalprofile_registration_no_key"'
        )

        self.assertEqual(field, "registration_number")
        self.assertEqual(message, "Registration number already exists.")

    def test_generic_duplicate_without_known_field(self):
        self.assertIsNone(
            identify_duplicate_kyc_field(
                'duplicate key value violates unique constraint "registration_unknown_field_key"'
            )
        )
