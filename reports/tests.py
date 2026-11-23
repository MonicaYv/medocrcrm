from decimal import Decimal

from django.test import RequestFactory, TestCase

from orders.models import OrderStatusChoices, PurchaseMedicine, UserPurchase
from registration.models import PharmacyProfile, User
from reports.views import _pharmacy_reports_context
from services.models import PharmacyBidding, PharmacyBidStatus, PharmacyMedicine


class PharmacyReportDataTests(TestCase):
    def setUp(self):
        self.user = User.objects.create(user_type="pharmacy")
        self.pharmacy = PharmacyProfile.objects.create(
            user=self.user,
            company_name="Report Test Pharmacy",
        )
        self.request_factory = RequestFactory()

    def create_order(self, *, status, assigned_pharmacy=None, amount="0"):
        return UserPurchase.objects.create(
            order_status=status,
            assigned_pharmacy=assigned_pharmacy,
            final_amount=Decimal(amount),
            total_amount=Decimal(amount),
        )

    def get_report_context(self):
        request = self.request_factory.get("/reports/", {"period": "month"})
        return _pharmacy_reports_context(request, self.user)

    def test_orders_and_sales_only_include_pharmacy_related_data(self):
        assigned_order = self.create_order(
            status=OrderStatusChoices.DELIVERED,
            assigned_pharmacy=self.pharmacy,
            amount="125",
        )
        bid_order = self.create_order(
            status=OrderStatusChoices.PENDING,
            amount="500",
        )
        self.create_order(status=OrderStatusChoices.PENDING, amount="300")
        PharmacyBidding.objects.create(
            order=bid_order,
            pharmacy=self.pharmacy,
            bid_amount=Decimal("50"),
            bid_gst=Decimal("9"),
            total_amount=Decimal("59"),
            delivery_time=2,
            bid_status=PharmacyBidStatus.REJECTED,
        )
        PurchaseMedicine.objects.create(
            purchase=assigned_order,
            medicine_id="assigned-medicine",
            product_name="Assigned medicine",
            quantity=2,
            price=Decimal("10"),
            mrp=Decimal("10"),
            total_price=Decimal("20"),
        )
        PurchaseMedicine.objects.create(
            purchase=bid_order,
            medicine_id="unassigned-medicine",
            product_name="Unassigned medicine",
            quantity=1,
            price=Decimal("500"),
            mrp=Decimal("500"),
            total_price=Decimal("500"),
        )

        context = self.get_report_context()

        self.assertEqual(context["total_orders"], "2")
        self.assertEqual(context["total_revenue"], "125")
        self.assertEqual(
            [item["name"] for item in context["top_products"]],
            ["Assigned medicine"],
        )

    def test_stock_alerts_filter_and_sort_numeric_low_stock(self):
        for name, quantity in [
            ("One hundred", "100"),
            ("Five", "5"),
            ("Three", "3"),
            ("Invalid", "unknown"),
            ("Twenty", "20"),
            ("Zero", "0"),
            ("Two", "2"),
            ("Twenty two", "22"),
        ]:
            PharmacyMedicine.objects.create(
                pharmacy=self.pharmacy,
                category="General",
                name=name,
                type="ordinary",
                quantity=quantity,
                price=Decimal("1"),
            )

        context = self.get_report_context()

        self.assertEqual(
            [(item["name"], item["quantity"]) for item in context["stock_alerts"]],
            [("Zero", 0), ("Two", 2), ("Three", 3), ("Five", 5), ("Twenty", 20)],
        )
