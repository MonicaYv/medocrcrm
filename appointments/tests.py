from django.test import SimpleTestCase

from .utils import visit_type_filter_aliases, visit_types_match


class VisitTypeMatchingTests(SimpleTestCase):
    def test_clinic_slug_matches_in_clinic_label(self):
        self.assertTrue(visit_types_match("clinic_visit", "In-Clinic Visit"))

    def test_home_slug_matches_home_label(self):
        self.assertTrue(visit_types_match("home_visit", "Home Visit"))

    def test_unrelated_visit_types_do_not_match(self):
        self.assertFalse(visit_types_match("clinic_visit", "Home Visit"))
        self.assertFalse(visit_types_match("clinic_visit", ""))

    def test_report_filters_use_shared_visit_type_aliases(self):
        self.assertIn("in-clinic visit", visit_type_filter_aliases("clinic"))
