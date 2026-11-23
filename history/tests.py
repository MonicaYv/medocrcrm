from types import SimpleNamespace
from unittest.mock import MagicMock, patch

from django.test import SimpleTestCase
from django.test import override_settings

from .views import get_hospital_bed_inventory


class HospitalBedInventoryTests(SimpleTestCase):
    @override_settings(MONGO_DB=None)
    def test_ambiguous_bed_number_does_not_mark_multiple_rooms_occupied(self):
        room_one = SimpleNamespace(id=1, name="Ward")
        room_two = SimpleNamespace(id=2, name="ICU")
        beds = [
            SimpleNamespace(id=10, bed_room_id=1, bed_no=1, bed_room=room_one),
            SimpleNamespace(id=11, bed_room_id=2, bed_no=1, bed_room=room_two),
        ]
        bed_records = MagicMock()
        bed_records.select_related.return_value.order_by.return_value = beds
        appointment_records = MagicMock()
        appointment_records.values.return_value.annotate.return_value.values_list.return_value = []

        with (
            patch(
                "history.views.HospitalRoomRateCard.objects.filter",
                return_value=bed_records,
            ),
            patch(
                "history.views.HospitalAppointments.objects.filter",
                return_value=appointment_records,
            ),
        ):
            _, rooms, warning = get_hospital_bed_inventory(
                SimpleNamespace(id=1),
                {
                    "no_1": {
                        "bed_no": "1",
                        "status": "Occupied",
                    }
                },
            )

        self.assertEqual([room["occupied"] for room in rooms], [0, 0])
        self.assertIn("bed numbers are shared across room types", warning)
