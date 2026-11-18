/**
 * Orders Module Workflow JavaScript
 * Handles all tabs, filters, search, metrics, popups, and order state transitions.
 */

(function () {
  'use strict';

  // Initial orders dataset matching all 12 orders from design screenshots
  const INITIAL_ORDERS = [
    {
      id: "ORD-3312",
      numericId: 3312,
      customer: {
        name: "Meera Pillai",
        avatar: "MP",
        avatarBg: "bg-[#1e4d92]",
        avatarColor: "text-white",
        area: "Powai",
        age: 29,
        gender: "Female",
        phone: "+91 98201 44521",
        address: "Building, Sambare, Vikhroli E 23 604"
      },
      medicinesSummary: "Prescribed Medicine",
      medicinesCount: 1,
      prescriptionStatus: "Clarification Needed",
      prescriptionBadgeClass: "bg-amber-100 text-amber-800 border-amber-200",
      fulfilment: "Home Delivery",
      dueSlot: "Cancelled 10:20 AM",
      dueSlotSub: "",
      amount: 260,
      paymentStatus: "Refund Pending",
      paymentMethod: "UPI",
      status: "Cancelled",
      statusBadgeClass: "bg-gray-100 text-gray-700 border-gray-200",
      tab: "cancelled",
      needsAttention: true,
      attentionType: "prescription",
      attentionLabel: "1 prescription to review",
      items: [
        { name: "Prescribed Medicine (Special Dosage)", qty: "1 pack", unitPrice: 260, total: 260, batch: "BATCH-902", expiry: "10/2026" }
      ],
      rxDetails: {
        fileName: "Prescription for Meera Pillai - MPT-1004.pdf",
        doctor: "Dr. A. K. Gupta - MBBS, MD (General Medicine)",
        regNo: "MCI-49201",
        date: "22 Jul 2025",
        status: "Clarification Needed",
        notes: "Dosage frequency unclear for Tab 2. Requested clarification from prescribing doctor."
      },
      cancellationDetails: {
        cancelledAt: "22 Jul 2025 • 10:20 AM",
        cancelledBy: "System / Customer",
        reason: "Order was cancelled because prescription required clarification and was not verified before cut-off time.",
        refundStatus: "Refund Pending - ₹260.00 via UPI (Ref #REF-992101)"
      },
      paymentDetails: {
        subtotal: 240,
        delivery: 20,
        tax: 0,
        total: 260,
        status: "Refund Pending",
        method: "UPI",
        transactionId: "UPI-REF-992101-CANCEL"
      },
      activity: [
        { title: "Order Cancelled & Refund Initiated", time: "22 Jul 2025 • 10:20 AM", status: "cancelled" },
        { title: "Prescription clarification requested", time: "22 Jul 2025 • 09:40 AM", status: "pending" },
        { title: "Order placed by customer", time: "22 Jul 2025 • 09:15 AM", status: "completed" }
      ]
    },
    {
      id: "ORD-3311",
      numericId: 3311,
      customer: {
        name: "Rahul Verma",
        avatar: "RV",
        avatarBg: "bg-blue-600",
        avatarColor: "text-white",
        area: "Powai",
        age: 34,
        gender: "Male",
        phone: "+91 98192 77312",
        address: "B-204, Raheja Nest, Chandivali, Powai"
      },
      medicinesSummary: "Multivitamin Complex + Zinc 50mg",
      medicinesCount: 2,
      prescriptionStatus: "Not Required",
      prescriptionBadgeClass: "bg-gray-100 text-gray-500",
      fulfilment: "Home Delivery",
      dueSlot: "Collected 11:15 AM",
      dueSlotSub: "",
      amount: 560,
      paymentStatus: "Paid",
      paymentMethod: "Card",
      status: "Collected",
      statusBadgeClass: "bg-emerald-100 text-emerald-800 border-emerald-200",
      tab: "completed",
      needsAttention: false,
      items: [
        { name: "Multivitamin Complex", qty: "1 bottle (60 tabs)", unitPrice: 380, total: 380, batch: "MVC-8821", expiry: "04/2027", stockLeft: 64 },
        { name: "Zinc 50mg Tablets", qty: "1 bottle (30 tabs)", unitPrice: 180, total: 180, batch: "ZN-5510", expiry: "11/2026", stockLeft: 82 }
      ],
      paymentDetails: {
        subtotal: 560,
        delivery: 0,
        tax: 0,
        total: 560,
        status: "Paid",
        method: "Credit Card (ending 4092)",
        transactionId: "TXN-CC-8829104"
      },
      invoice: {
        invoiceNo: "INV-2025-0722-3311",
        date: "22 Jul 2025",
        subtotal: 560,
        cgst: 14.00,
        sgst: 14.00,
        total: 560.00
      },
      activity: [
        { title: "Order collected by customer", time: "22 Jul 2025 • 11:15 AM", status: "completed" },
        { title: "Order ready at pharmacy store", time: "22 Jul 2025 • 10:45 AM", status: "completed" },
        { title: "Packing completed", time: "22 Jul 2025 • 10:30 AM", status: "completed" },
        { title: "Order placed & paid", time: "22 Jul 2025 • 10:00 AM", status: "completed" }
      ]
    },
    {
      id: "ORD-3310",
      numericId: 3310,
      customer: {
        name: "Anjali Rao",
        avatar: "AR",
        avatarBg: "bg-rose-500",
        avatarColor: "text-white",
        area: "Andheri East",
        age: 42,
        gender: "Female",
        phone: "+91 98205 11984",
        address: "Flat 402, Lotus Grandeur, Veera Desai Road, Andheri East"
      },
      medicinesSummary: "Crocin 650mg + Augmentin 625mg",
      medicinesCount: 2,
      prescriptionStatus: "Verified",
      prescriptionBadgeClass: "bg-emerald-100 text-emerald-800 border-emerald-200",
      fulfilment: "Home Delivery",
      dueSlot: "Delivered 11:40 AM",
      dueSlotSub: "",
      amount: 380,
      paymentStatus: "Paid",
      paymentMethod: "UPI",
      status: "Delivered",
      statusBadgeClass: "bg-emerald-100 text-emerald-800 border-emerald-200",
      tab: "completed",
      needsAttention: false,
      items: [
        { name: "Crocin 650mg Tablet", qty: "1 strip (15 tabs)", unitPrice: 180, total: 180, batch: "B-4921", expiry: "12/2026", stockLeft: 120 },
        { name: "Augmentin 625mg Duo", qty: "1 strip (6 tabs)", unitPrice: 200, total: 200, batch: "AUG-881", expiry: "08/2026", stockLeft: 45 }
      ],
      rxDetails: {
        fileName: "Prescription for Anjali Rao - MPT-1003.pdf",
        doctor: "Dr. Sunita Deshmukh - MD (Internal Medicine)",
        regNo: "MCI-71822",
        date: "21 Jul 2025",
        status: "Verified",
        notes: "Prescription verified on 22 Jul 2025 10:05 AM"
      },
      paymentDetails: {
        subtotal: 380,
        delivery: 0,
        tax: 0,
        total: 380,
        status: "Paid",
        method: "UPI (Google Pay)",
        transactionId: "UPI-492019385012"
      },
      invoice: {
        invoiceNo: "INV-2025-0722-3310",
        date: "22 Jul 2025",
        subtotal: 380,
        cgst: 9.50,
        sgst: 9.50,
        total: 380.00
      },
      activity: [
        { title: "Delivered to customer address", time: "22 Jul 2025 • 11:40 AM", status: "completed" },
        { title: "Out for delivery with rider", time: "22 Jul 2025 • 11:15 AM", status: "completed" },
        { title: "Order packed & marked ready", time: "22 Jul 2025 • 10:50 AM", status: "completed" },
        { title: "Prescription verified", time: "22 Jul 2025 • 10:05 AM", status: "completed" },
        { title: "Order received", time: "22 Jul 2025 • 09:55 AM", status: "completed" }
      ]
    },
    {
      id: "ORD-3309",
      numericId: 3309,
      customer: {
        name: "Sneha Patil",
        avatar: "SP",
        avatarBg: "bg-emerald-600",
        avatarColor: "text-white",
        area: "Kurla",
        age: 26,
        gender: "Female",
        phone: "+91 97692 88410",
        address: "Room 12, Ganesh Chawl, Pipeline Road, Kurla West"
      },
      medicinesSummary: "Pantoprazole 40mg + Cremaffin 200ml",
      medicinesCount: 2,
      prescriptionStatus: "Verified",
      prescriptionBadgeClass: "bg-emerald-100 text-emerald-800 border-emerald-200",
      fulfilment: "Home Delivery",
      dueSlot: "Due 12:30 PM",
      dueSlotSub: "20m late",
      dueSlotSubClass: "text-red-500 font-semibold",
      amount: 180,
      paymentStatus: "COD",
      paymentMethod: "COD",
      status: "Out for Delivery",
      statusBadgeClass: "bg-purple-100 text-purple-800 border-purple-200",
      hasAlert: true,
      tab: "out_for_delivery",
      needsAttention: true,
      attentionType: "delayed",
      attentionLabel: "1 delayed delivery",
      items: [
        { name: "Pantoprazole 40mg", qty: "1 strip (10 tabs)", unitPrice: 85, total: 85, batch: "PAN-1092", expiry: "09/2026" },
        { name: "Cremaffin Syrup 200ml", qty: "1 bottle", unitPrice: 95, total: 95, batch: "CRF-338", expiry: "03/2027" }
      ],
      deliveryDetails: {
        partner: "Shadowfax Express",
        rider: "Ramesh Patel",
        phone: "+91 98201 99123",
        status: "In Transit (Delayed due to traffic on LBS Marg)",
        eta: "12:50 PM",
        trackingId: "SHDW-9921820",
        destination: "Pipeline Road, Kurla West"
      },
      paymentDetails: {
        subtotal: 180,
        delivery: 0,
        tax: 0,
        total: 180,
        status: "Cash On Delivery (To collect ₹180)",
        method: "COD",
        transactionId: "Pending Collection"
      },
      activity: [
        { title: "Rider reported traffic delay (20 mins)", time: "22 Jul 2025 • 12:25 PM", status: "warning" },
        { title: "Dispatched & out for delivery", time: "22 Jul 2025 • 12:05 PM", status: "completed" },
        { title: "Order packed & ready for handover", time: "22 Jul 2025 • 11:45 AM", status: "completed" },
        { title: "Prescription verified", time: "22 Jul 2025 • 11:20 AM", status: "completed" }
      ]
    },
    {
      id: "ORD-3308",
      numericId: 3308,
      customer: {
        name: "Kavitha Nair",
        avatar: "KN",
        avatarBg: "bg-amber-500",
        avatarColor: "text-white",
        area: "Chembur",
        age: 38,
        gender: "Female",
        phone: "+91 98218 66201",
        address: "103, Sai Krupa CHS, Tilak Nagar, Chembur"
      },
      medicinesSummary: "Cetirizine 10mg + Montair LC",
      medicinesCount: 2,
      prescriptionStatus: "Verified",
      prescriptionBadgeClass: "bg-emerald-100 text-emerald-800 border-emerald-200",
      fulfilment: "Home Delivery",
      dueSlot: "ETA 1:20 PM",
      dueSlotSub: "",
      amount: 240,
      paymentStatus: "Paid",
      paymentMethod: "UPI",
      status: "Out for Delivery",
      statusBadgeClass: "bg-purple-100 text-purple-800 border-purple-200",
      tab: "out_for_delivery",
      needsAttention: false,
      items: [
        { name: "Cetirizine 10mg", qty: "1 strip (10 tabs)", unitPrice: 40, total: 40, batch: "CET-201", expiry: "01/2027" },
        { name: "Montair LC Tablets", qty: "1 strip (10 tabs)", unitPrice: 200, total: 200, batch: "MLC-990", expiry: "05/2026" }
      ],
      deliveryDetails: {
        partner: "Medoc Quick Courier",
        rider: "Deepak Shinde",
        phone: "+91 98199 44321",
        status: "In Transit (On schedule)",
        eta: "1:20 PM",
        trackingId: "MDQ-102938",
        destination: "Tilak Nagar, Chembur"
      },
      paymentDetails: {
        subtotal: 240,
        delivery: 0,
        tax: 0,
        total: 240,
        status: "Paid",
        method: "UPI (PhonePe)",
        transactionId: "UPI-PHN-88271039"
      },
      activity: [
        { title: "Rider picked up package", time: "22 Jul 2025 • 12:45 PM", status: "completed" },
        { title: "Order packed & marked ready", time: "22 Jul 2025 • 12:30 PM", status: "completed" },
        { title: "Prescription verified", time: "22 Jul 2025 • 12:10 PM", status: "completed" }
      ]
    },
    {
      id: "ORD-3307",
      numericId: 3307,
      customer: {
        name: "Vijay Mehta",
        avatar: "VM",
        avatarBg: "bg-cyan-600",
        avatarColor: "text-white",
        area: "Santacruz",
        age: 51,
        gender: "Male",
        phone: "+91 98202 33419",
        address: "Store Pickup: Medoc Pharmacy - Andheri East Branch"
      },
      medicinesSummary: "Amlodipine 5mg + Losartan 50mg",
      medicinesCount: 2,
      prescriptionStatus: "Verified",
      prescriptionBadgeClass: "bg-emerald-100 text-emerald-800 border-emerald-200",
      fulfilment: "Store Pickup",
      dueSlot: "Courier pickup 1:15 PM",
      dueSlotSub: "",
      amount: 200,
      paymentStatus: "Pay at Pickup",
      paymentMethod: "Pay at Pickup",
      status: "Ready",
      statusBadgeClass: "bg-cyan-100 text-cyan-800 border-cyan-200",
      tab: "ready",
      needsAttention: false,
      pickupCode: "8419",
      items: [
        { name: "Amlodipine 5mg", qty: "1 strip (15 tabs)", unitPrice: 75, total: 75, batch: "AML-441", expiry: "12/2026" },
        { name: "Losartan 50mg", qty: "1 strip (10 tabs)", unitPrice: 125, total: 125, batch: "LOS-802", expiry: "07/2026" }
      ],
      paymentDetails: {
        subtotal: 200,
        delivery: 0,
        tax: 0,
        total: 200,
        status: "To collect at store counter",
        method: "Cash / UPI at Store",
        transactionId: "Pending Collection at Store"
      },
      activity: [
        { title: "Order packed & kept at Store Pickup Counter #2", time: "22 Jul 2025 • 12:50 PM", status: "completed" },
        { title: "Customer notified for pickup", time: "22 Jul 2025 • 12:51 PM", status: "completed" },
        { title: "Order verified", time: "22 Jul 2025 • 12:35 PM", status: "completed" }
      ]
    },
    {
      id: "ORD-3306",
      numericId: 3306,
      customer: {
        name: "Deepa Shah",
        avatar: "DS",
        avatarBg: "bg-pink-600",
        avatarColor: "text-white",
        area: "Vile Parle",
        age: 31,
        gender: "Female",
        phone: "+91 98210 77654",
        address: "Flat 12, Shanti Sadan, Nehru Road, Vile Parle East"
      },
      medicinesSummary: "Vitamin D3 60K IU + Calcium 500mg",
      medicinesCount: 2,
      prescriptionStatus: "Not Required",
      prescriptionBadgeClass: "bg-gray-100 text-gray-500",
      fulfilment: "Home Delivery",
      dueSlot: "Courier pickup 1:15 PM",
      dueSlotSub: "",
      amount: 220,
      paymentStatus: "Paid",
      paymentMethod: "Card",
      status: "Ready",
      statusBadgeClass: "bg-cyan-100 text-cyan-800 border-cyan-200",
      tab: "ready",
      needsAttention: false,
      items: [
        { name: "Vitamin D3 60K IU Capsules", qty: "1 strip (4 caps)", unitPrice: 110, total: 110, batch: "VD3-102", expiry: "10/2026" },
        { name: "Shelcal Calcium 500mg", qty: "1 strip (15 tabs)", unitPrice: 110, total: 110, batch: "SHL-449", expiry: "02/2027" }
      ],
      dispatchDetails: {
        assignedCourier: "Dunzo Express",
        riderName: "Sunil Kumar",
        riderPhone: "+91 98200 12345",
        trackingId: "DNZ-492019"
      },
      paymentDetails: {
        subtotal: 220,
        delivery: 0,
        tax: 0,
        total: 220,
        status: "Paid",
        method: "Debit Card",
        transactionId: "TXN-DC-7749102"
      },
      activity: [
        { title: "Order packed in tamper-proof bag", time: "22 Jul 2025 • 01:00 PM", status: "completed" },
        { title: "Courier partner Dunzo assigned", time: "22 Jul 2025 • 01:05 PM", status: "completed" }
      ]
    },
    {
      id: "ORD-3305",
      numericId: 3305,
      customer: {
        name: "Amit Kumar",
        avatar: "AK",
        avatarBg: "bg-teal-600",
        avatarColor: "text-white",
        area: "Jogeshwari",
        age: 29,
        gender: "Male",
        phone: "+91 98190 22319",
        address: "Room 401, Sai Regency, Caves Road, Jogeshwari East"
      },
      medicinesSummary: "Paracetamol 500mg + Volini Gel 50g",
      medicinesCount: 2,
      prescriptionStatus: "Verified",
      prescriptionBadgeClass: "bg-emerald-100 text-emerald-800 border-emerald-200",
      fulfilment: "Home Delivery",
      dueSlot: "Today 2:15 PM",
      dueSlotSub: "",
      amount: 220,
      paymentStatus: "Paid",
      paymentMethod: "UPI",
      status: "Packing",
      statusBadgeClass: "bg-blue-100 text-blue-800 border-blue-200",
      tab: "packing",
      needsAttention: false,
      items: [
        { name: "Paracetamol 500mg Tablets", qty: "2 strips (20 tabs)", unitPrice: 35, total: 70, shelf: "Shelf A-12", batch: "P-902", expiry: "12/2026" },
        { name: "Volini Pain Relief Gel 50g", qty: "1 tube", unitPrice: 150, total: 150, shelf: "Shelf B-04", batch: "V-114", expiry: "08/2026" }
      ],
      paymentDetails: {
        subtotal: 220,
        delivery: 0,
        tax: 0,
        total: 220,
        status: "Paid",
        method: "UPI (Paytm)",
        transactionId: "UPI-PAYTM-9910248"
      },
      activity: [
        { title: "Order moved to packing queue", time: "22 Jul 2025 • 01:10 PM", status: "completed" },
        { title: "Prescription verified by pharmacist", time: "22 Jul 2025 • 01:05 PM", status: "completed" },
        { title: "Order placed & confirmed", time: "22 Jul 2025 • 12:55 PM", status: "completed" }
      ]
    },
    {
      id: "ORD-3304",
      numericId: 3304,
      customer: {
        name: "Rajan Mehta",
        avatar: "RM",
        avatarBg: "bg-indigo-600",
        avatarColor: "text-white",
        area: "Andheri West",
        age: 47,
        gender: "Male",
        phone: "+91 98208 44102",
        address: "Flat 503, Silver Arch, JP Road, Andheri West"
      },
      medicinesSummary: "Atorva 10mg + Ecosprin 75mg",
      medicinesCount: 2,
      prescriptionStatus: "Verified",
      prescriptionBadgeClass: "bg-emerald-100 text-emerald-800 border-emerald-200",
      fulfilment: "Home Delivery",
      dueSlot: "Today 1-2 PM",
      dueSlotSub: "",
      amount: 180,
      paymentStatus: "Pay at Pickup",
      paymentMethod: "Pay at Pickup",
      status: "Packing",
      statusBadgeClass: "bg-blue-100 text-blue-800 border-blue-200",
      tab: "packing",
      needsAttention: false,
      items: [
        { name: "Atorva 10mg Tablets", qty: "1 strip (15 tabs)", unitPrice: 125, total: 125, shelf: "Shelf C-08", batch: "ATV-771", expiry: "06/2026" },
        { name: "Ecosprin 75mg Capsules", qty: "1 strip (14 caps)", unitPrice: 55, total: 55, shelf: "Shelf C-14", batch: "EC-209", expiry: "09/2026" }
      ],
      paymentDetails: {
        subtotal: 180,
        delivery: 0,
        tax: 0,
        total: 180,
        status: "Pay at Pickup",
        method: "Store counter collection",
        transactionId: "Pending Collection"
      },
      activity: [
        { title: "Packing started by staff", time: "22 Jul 2025 • 01:15 PM", status: "completed" },
        { title: "Prescription verified", time: "22 Jul 2025 • 01:00 PM", status: "completed" }
      ]
    },
    {
      id: "ORD-3303",
      numericId: 3303,
      customer: {
        name: "Priya Sharma",
        avatar: "PS",
        avatarBg: "bg-sky-600",
        avatarColor: "text-white",
        area: "Goregaon",
        age: 33,
        gender: "Female",
        phone: "+91 98331 99014",
        address: "B-12, Gokuldham, Film City Road, Goregaon East"
      },
      medicinesSummary: "Amoxicillin 500mg + Prescribed Item",
      medicinesCount: 2,
      prescriptionStatus: "Verified",
      prescriptionBadgeClass: "bg-emerald-100 text-emerald-800 border-emerald-200",
      fulfilment: "Home Delivery",
      dueSlot: "Today 2:00 PM",
      dueSlotSub: "",
      amount: 420,
      paymentStatus: "COD",
      paymentMethod: "COD",
      status: "Pending",
      statusBadgeClass: "bg-amber-100 text-amber-800 border-amber-200",
      hasAlert: true,
      tab: "pending",
      needsAttention: true,
      attentionType: "stock",
      attentionLabel: "1 stock shortage",
      items: [
        { name: "Amoxicillin 500mg Capsules", qty: "2 strips (20 caps)", unitPrice: 140, total: 280, isShortage: true, stockAvailable: 0 },
        { name: "Prescribed Item (Vitamin C 500mg)", qty: "1 strip (15 tabs)", unitPrice: 140, total: 140, isShortage: false, stockAvailable: 48 }
      ],
      stockShortageDetails: {
        itemName: "Amoxicillin 500mg Capsules",
        orderedQty: "2 strips (20 caps)",
        availableStock: "0 units in store",
        suggestedAlternatives: [
          { name: "Moxikind-CV 500mg (Generic Alternative - In Stock: 24 strips)", price: 145 },
          { name: "Novamox 500mg (Cipla - In Stock: 18 strips)", price: 140 }
        ]
      },
      paymentDetails: {
        subtotal: 420,
        delivery: 0,
        tax: 0,
        total: 420,
        status: "Cash On Delivery (To collect ₹420)",
        method: "COD",
        transactionId: "Pending Collection"
      },
      activity: [
        { title: "Stock shortage flagged by automated inventory check", time: "22 Jul 2025 • 01:20 PM", status: "warning" },
        { title: "Prescription verified successfully", time: "22 Jul 2025 • 01:15 PM", status: "completed" },
        { title: "Order received", time: "22 Jul 2025 • 01:10 PM", status: "completed" }
      ]
    },
    {
      id: "ORD-3302",
      numericId: 3302,
      customer: {
        name: "Gaurav Sharma",
        avatar: "GS",
        avatarBg: "bg-yellow-500",
        avatarColor: "text-white",
        area: "Borivali",
        age: 28,
        gender: "Male",
        phone: "+91 98765 43210",
        address: "Building, Sambare, Vikhroli E 23 604"
      },
      medicinesSummary: "Metformin 500mg + Pantop 40mg",
      medicinesCount: 2,
      prescriptionStatus: "Pending Review",
      prescriptionBadgeClass: "bg-amber-100 text-amber-800 border-amber-200",
      fulfilment: "Home Delivery",
      dueSlot: "Today 1:45 PM",
      dueSlotSub: "",
      amount: 260,
      paymentStatus: "Paid",
      paymentMethod: "UPI",
      status: "Pending",
      statusBadgeClass: "bg-amber-100 text-amber-800 border-amber-200",
      hasAlert: true,
      tab: "pending",
      needsAttention: true,
      attentionType: "prescription",
      attentionLabel: "1 prescription to review",
      items: [
        { name: "Metformin 500mg", qty: "1 strip (10 tabs)", unitPrice: 140, total: 140, batch: "MTF-881", expiry: "11/2026" },
        { name: "Pantop 40mg", qty: "1 strip (10 tabs)", unitPrice: 120, total: 120, batch: "PAN-402", expiry: "04/2027" }
      ],
      rxDetails: {
        fileName: "Prescription for Gaurav Sharma - MPT-1002.pdf",
        doctor: "Dr. A. K. Gupta - MBBS, MD",
        hospital: "Apollo Clinics, Borivali West",
        regNo: "MCI-49201 / Reg #2014-08-3921",
        date: "22 Jul 2025",
        status: "Pending Review",
        itemsList: [
          "Tab Metformin 500mg - 1 tablet twice daily after meals (30 days)",
          "Cap Pantop 40mg - 1 capsule once daily before breakfast (15 days)"
        ]
      },
      paymentDetails: {
        subtotal: 260,
        delivery: 0,
        tax: 0,
        total: 260,
        status: "Paid",
        method: "UPI (Google Pay)",
        transactionId: "UPI-REF-91823791"
      },
      activity: [
        { title: "Prescription uploaded & waiting for review", time: "22 Jul 2025 • 12:46 PM", status: "pending" },
        { title: "Sample order confirmed", time: "22 Jul 2025 • 12:45 PM", status: "completed" },
        { title: "Prescription draft uploaded", time: "22 Jul 2025 • 12:44 PM", status: "completed" }
      ]
    },
    {
      id: "ORD-3301",
      numericId: 3301,
      customer: {
        name: "Monica Singh",
        avatar: "MS",
        avatarBg: "bg-emerald-500",
        avatarColor: "text-white",
        area: "Andheri East",
        age: 27,
        gender: "Female",
        phone: "+91 98204 55192",
        address: "Flat 201, Crystal Tower, Chakala, Andheri East"
      },
      medicinesSummary: "Crocin 500mg Tablet + Vitamin C 500mg",
      medicinesCount: 2,
      prescriptionStatus: "Not Required",
      prescriptionBadgeClass: "bg-gray-100 text-gray-500",
      fulfilment: "Home Delivery",
      dueSlot: "Today 1:30 PM",
      dueSlotSub: "",
      amount: 450,
      paymentStatus: "Paid",
      paymentMethod: "UPI",
      status: "Pending",
      statusBadgeClass: "bg-amber-100 text-amber-800 border-amber-200",
      tab: "pending",
      needsAttention: false,
      items: [
        { name: "Crocin 500mg Tablet", qty: "2 strips (30 tabs)", unitPrice: 150, total: 300, batch: "CR-501", expiry: "12/2026" },
        { name: "Vitamin C 500mg Chewable", qty: "1 bottle (60 tabs)", unitPrice: 150, total: 150, batch: "VTC-202", expiry: "09/2027" }
      ],
      paymentDetails: {
        subtotal: 450,
        delivery: 0,
        tax: 0,
        total: 450,
        status: "Paid",
        method: "UPI (BHIM UPI)",
        transactionId: "UPI-BHIM-771928"
      },
      activity: [
        { title: "Order received & ready to pack", time: "22 Jul 2025 • 01:10 PM", status: "completed" },
        { title: "Payment verified", time: "22 Jul 2025 • 01:09 PM", status: "completed" }
      ]
    }
  ];

  // Deep clone initial state
  let ordersList = JSON.parse(JSON.stringify(INITIAL_ORDERS));

  // State object
  const state = {
    currentTab: 'all',
    searchQuery: '',
    fulfilmentFilter: 'all',
    paymentFilter: 'all',
    prescriptionFilter: 'all',
    sortOrder: 'newest',
    needsAttentionOnly: false,
    dateRange: 'today',
    customFromDate: '2024-05-12',
    customToDate: '2024-05-18',
    activeOrder: null,
    orderDetailsActiveTab: 'overview'
  };

  // Toast notification helper
  function notify(message, type = 'info') {
    if (window.toastr) {
      toastr.options = {
        closeButton: true,
        progressBar: true,
        positionClass: "toast-top-right",
        timeOut: "3500"
      };
      if (type === 'success') toastr.success(message);
      else if (type === 'warning') toastr.warning(message);
      else if (type === 'error') toastr.error(message);
      else toastr.info(message);
    } else {
      console.log(`[${type.toUpperCase()}] ${message}`);
    }
  }

  // Modal open / close helpers
  function openModal(modalId) {
    const el = document.getElementById(modalId);
    if (el) {
      el.classList.remove('hidden');
      el.classList.add('flex');
      document.body.style.overflow = 'hidden';
    }
  }

  function closeModal(modalId) {
    const el = document.getElementById(modalId);
    if (el) {
      el.classList.add('hidden');
      el.classList.remove('flex');
      if (!document.querySelector('.orders-modal-overlay:not(.hidden)')) {
        document.body.style.overflow = '';
      }
    }
  }

  // Update counts on tabs and metric cards
  function updateCounts() {
    const totalCount = ordersList.length;
    const pendingCount = ordersList.filter(o => o.tab === 'pending').length;
    const packingCount = ordersList.filter(o => o.tab === 'packing').length;
    const readyCount = ordersList.filter(o => o.tab === 'ready').length;
    const ofdCount = ordersList.filter(o => o.tab === 'out_for_delivery').length;
    const completedCount = ordersList.filter(o => o.tab === 'completed').length;
    const cancelledCount = ordersList.filter(o => o.tab === 'cancelled').length;
    const attentionCount = ordersList.filter(o => o.needsAttention).length;

    // Tabs counters
    setTxt('tab-count-all', totalCount);
    setTxt('tab-count-pending', pendingCount);
    setTxt('tab-count-packing', packingCount);
    setTxt('tab-count-ready', readyCount);
    setTxt('tab-count-out-for-delivery', ofdCount);
    setTxt('tab-count-completed', completedCount);
    setTxt('tab-count-cancelled', cancelledCount);
    setTxt('attention-count-badge', attentionCount);

    // Metric cards
    setTxt('metric-total-orders', totalCount);
    setTxt('metric-to-prepare', pendingCount + packingCount);
    setTxt('metric-to-prepare-sub', `${pendingCount} Pending • ${packingCount} Packing`);
    setTxt('metric-ready-handover', readyCount);
    const storePickupCount = ordersList.filter(o => o.tab === 'ready' && o.fulfilment === 'Store Pickup').length;
    const courierPickupCount = readyCount - storePickupCount;
    setTxt('metric-ready-handover-sub', `${courierPickupCount} Courier Pickup • ${storePickupCount} Store Pickup`);
    setTxt('metric-ofd', ofdCount);
    const delayedCount = ordersList.filter(o => o.tab === 'out_for_delivery' && o.dueSlotSub.includes('late')).length;
    setTxt('metric-ofd-sub', delayedCount > 0 ? `${delayedCount} delivery running late` : 'All on schedule');
    setTxt('metric-completed', completedCount);
    const deliveredCount = ordersList.filter(o => o.status === 'Delivered').length;
    const collectedCount = ordersList.filter(o => o.status === 'Collected').length;
    setTxt('metric-completed-sub', `${deliveredCount} Delivered • ${collectedCount} Collected`);

    // Attention banner
    const bannerEl = document.getElementById('attention-banner');
    if (bannerEl) {
      if (attentionCount === 0) {
        bannerEl.classList.add('hidden');
      } else {
        bannerEl.classList.remove('hidden');
        setTxt('attention-banner-text', `${attentionCount} orders need attention`);
        const rxNeed = ordersList.filter(o => o.needsAttention && o.attentionType === 'prescription').length;
        const stockNeed = ordersList.filter(o => o.needsAttention && o.attentionType === 'stock').length;
        const delayNeed = ordersList.filter(o => o.needsAttention && o.attentionType === 'delayed').length;

        toggleDisplay('pill-rx-attention', rxNeed > 0);
        toggleDisplay('pill-stock-attention', stockNeed > 0);
        toggleDisplay('pill-delay-attention', delayNeed > 0);
      }
    }
  }

  function setTxt(id, txt) {
    const el = document.getElementById(id);
    if (el) el.textContent = txt;
  }

  function toggleDisplay(id, show) {
    const el = document.getElementById(id);
    if (el) {
      if (show) el.classList.remove('hidden');
      else el.classList.add('hidden');
    }
  }

  // Filter & sort logic
  function getFilteredOrders() {
    return ordersList.filter(order => {
      // Tab filter
      if (state.currentTab !== 'all') {
        if (state.currentTab !== order.tab) return false;
      }

      // Attention only toggle
      if (state.needsAttentionOnly && !order.needsAttention) {
        return false;
      }

      // Fulfilment filter
      if (state.fulfilmentFilter !== 'all') {
        if (state.fulfilmentFilter === 'home' && order.fulfilment !== 'Home Delivery') return false;
        if (state.fulfilmentFilter === 'store' && order.fulfilment !== 'Store Pickup') return false;
      }

      // Payment filter
      if (state.paymentFilter !== 'all') {
        if (state.paymentFilter === 'paid' && order.paymentStatus !== 'Paid') return false;
        if (state.paymentFilter === 'cod' && order.paymentStatus !== 'COD') return false;
        if (state.paymentFilter === 'pickup' && order.paymentStatus !== 'Pay at Pickup') return false;
        if (state.paymentFilter === 'refund' && !order.paymentStatus.includes('Refund')) return false;
      }

      // Prescription filter
      if (state.prescriptionFilter !== 'all') {
        if (state.prescriptionFilter === 'verified' && order.prescriptionStatus !== 'Verified') return false;
        if (state.prescriptionFilter === 'pending' && order.prescriptionStatus !== 'Pending Review') return false;
        if (state.prescriptionFilter === 'clarification' && order.prescriptionStatus !== 'Clarification Needed') return false;
        if (state.prescriptionFilter === 'not_required' && order.prescriptionStatus !== 'Not Required') return false;
      }

      // Search query filter (Order ID, customer, area, medicine)
      if (state.searchQuery) {
        const q = state.searchQuery.toLowerCase();
        const matchesId = order.id.toLowerCase().includes(q);
        const matchesCustomer = order.customer.name.toLowerCase().includes(q);
        const matchesArea = order.customer.area.toLowerCase().includes(q);
        const matchesMed = order.medicinesSummary.toLowerCase().includes(q);
        if (!matchesId && !matchesCustomer && !matchesArea && !matchesMed) return false;
      }

      return true;
    }).sort((a, b) => {
      if (state.sortOrder === 'newest') return b.numericId - a.numericId;
      if (state.sortOrder === 'oldest') return a.numericId - b.numericId;
      if (state.sortOrder === 'amount_high') return b.amount - a.amount;
      if (state.sortOrder === 'amount_low') return a.amount - b.amount;
      return 0;
    });
  }

  // Render Table
  function renderOrdersTable() {
    const tableBody = document.getElementById('orders-table-body');
    const emptyState = document.getElementById('orders-empty-state');
    if (!tableBody) return;

    const filtered = getFilteredOrders();
    setTxt('showing-orders-count', `Showing 1-${filtered.length} of ${filtered.length} orders`);

    if (filtered.length === 0) {
      tableBody.innerHTML = '';
      if (emptyState) emptyState.classList.remove('hidden');
      return;
    }

    if (emptyState) emptyState.classList.add('hidden');

    tableBody.innerHTML = filtered.map(order => {
      // Prescription sub-tag styling
      let rxTagHtml = '';
      if (order.prescriptionStatus === 'Clarification Needed') {
        rxTagHtml = `<span class="inline-block mt-0.5 text-[11px] font-medium text-amber-600">Clarification Needed</span>`;
      } else if (order.prescriptionStatus === 'Pending Review') {
        rxTagHtml = `<span class="inline-block mt-0.5 text-[11px] font-medium text-amber-600">Pending Review</span>`;
      } else if (order.prescriptionStatus === 'Verified') {
        rxTagHtml = `<span class="inline-block mt-0.5 text-[11px] font-medium text-emerald-600">Verified</span>`;
      } else {
        rxTagHtml = `<span class="inline-block mt-0.5 text-[11px] font-medium text-gray-400">Not Required</span>`;
      }

      // Status badge styling
      let statusBadge = '';
      if (order.status === 'Cancelled') {
        statusBadge = `<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">${order.status}</span>`;
      } else if (order.status === 'Collected' || order.status === 'Delivered') {
        statusBadge = `<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">${order.status}</span>`;
      } else if (order.status === 'Out for Delivery') {
        const alertIcon = order.hasAlert ? `<span class="material-symbols-outlined text-[14px] text-amber-600">warning</span>` : '';
        statusBadge = `<div class="flex items-center gap-1">
          <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">
            ${order.status}
          </span>
          ${alertIcon}
        </div>`;
      } else if (order.status === 'Ready') {
        statusBadge = `<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-cyan-50 text-cyan-700 border border-cyan-200">${order.status}</span>`;
      } else if (order.status === 'Packing') {
        statusBadge = `<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">${order.status}</span>`;
      } else {
        // Pending
        const alertIcon = order.hasAlert ? `<span class="material-symbols-outlined text-[14px] text-amber-600">warning</span>` : '';
        statusBadge = `<div class="flex items-center gap-1">
          <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
            ${order.status}
          </span>
          ${alertIcon}
        </div>`;
      }

      // Actions column button
      let actionBtnHtml = '';
      if (order.status === 'Cancelled') {
        actionBtnHtml = `<button type="button" class="action-view-cancellation px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition cursor-pointer" data-id="${order.id}">View Cancellation</button>`;
      } else if (order.status === 'Collected' || order.status === 'Delivered') {
        actionBtnHtml = `<button type="button" class="action-view-invoice px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition cursor-pointer" data-id="${order.id}">View Invoice</button>`;
      } else if (order.status === 'Out for Delivery') {
        actionBtnHtml = `<button type="button" class="action-track-delivery px-3 py-1.5 text-xs font-medium text-purple-700 bg-white border border-purple-300 rounded-md hover:bg-purple-50 transition cursor-pointer" data-id="${order.id}">Track Delivery</button>`;
      } else if (order.status === 'Ready') {
        if (order.fulfilment === 'Store Pickup') {
          actionBtnHtml = `<button type="button" class="action-confirm-pickup px-3 py-1.5 text-xs font-medium text-cyan-700 bg-white border border-cyan-300 rounded-md hover:bg-cyan-50 transition cursor-pointer" data-id="${order.id}">Confirm Pickup</button>`;
        } else {
          actionBtnHtml = `<button type="button" class="action-dispatch-order px-3 py-1.5 text-xs font-medium text-dodger-blue bg-white border border-blue-300 rounded-md hover:bg-blue-50 transition cursor-pointer" data-id="${order.id}">Dispatch Order</button>`;
        }
      } else if (order.status === 'Packing') {
        actionBtnHtml = `<button type="button" class="action-mark-ready px-3 py-1.5 text-xs font-medium text-dodger-blue bg-white border border-blue-300 rounded-md hover:bg-blue-50 transition cursor-pointer" data-id="${order.id}">Mark Ready</button>`;
      } else {
        // Pending actions
        if (order.attentionType === 'stock') {
          actionBtnHtml = `<button type="button" class="action-resolve-stock px-3 py-1.5 text-xs font-medium text-rose-600 bg-rose-50 border border-rose-300 rounded-md hover:bg-rose-100 transition cursor-pointer" data-id="${order.id}">Resolve Stock Issue</button>`;
        } else if (order.attentionType === 'prescription') {
          actionBtnHtml = `<button type="button" class="action-review-rx px-3 py-1.5 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-300 rounded-md hover:bg-amber-100 transition cursor-pointer" data-id="${order.id}">Review Prescription</button>`;
        } else {
          actionBtnHtml = `<button type="button" class="action-start-packing px-3 py-1.5 text-xs font-medium text-dodger-blue bg-white border border-blue-300 rounded-md hover:bg-blue-50 transition cursor-pointer" data-id="${order.id}">Start Packing</button>`;
        }
      }

      return `
        <tr class="hover:bg-slate-50/70 border-b border-gray-100 transition text-[13px]">
          <!-- ORDER ID -->
          <td class="py-3.5 px-4 font-semibold text-dodger-blue">
            <button type="button" class="hover:underline font-semibold text-dodger-blue cursor-pointer action-open-details" data-id="${order.id}">
              ${order.id}
            </button>
          </td>

          <!-- CUSTOMER -->
          <td class="py-3.5 px-4">
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-full ${order.customer.avatarBg} ${order.customer.avatarColor} flex items-center justify-center font-bold text-xs shrink-0">
                ${order.customer.avatar}
              </div>
              <div class="min-w-0">
                <p class="font-medium text-gray-900 leading-tight truncate">${order.customer.name}</p>
                <p class="text-[11px] text-gray-500 leading-tight">${order.customer.area}</p>
              </div>
            </div>
          </td>

          <!-- MEDICINES -->
          <td class="py-3.5 px-4">
            <div>
              <p class="font-medium text-gray-800 leading-tight">${order.medicinesSummary}</p>
              <div class="flex items-center gap-1.5">
                <span class="text-[11px] text-gray-500">${order.medicinesCount} product${order.medicinesCount > 1 ? 's' : ''}</span>
                <span class="text-gray-300">•</span>
                ${rxTagHtml}
              </div>
            </div>
          </td>

          <!-- FULFILMENT -->
          <td class="py-3.5 px-4">
            <span class="text-xs font-medium ${order.fulfilment === 'Home Delivery' ? 'text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded' : 'text-blue-700 bg-blue-50 px-2 py-0.5 rounded'}">
              ${order.fulfilment}
            </span>
          </td>

          <!-- DUE/SLOT -->
          <td class="py-3.5 px-4">
            <div>
              <p class="text-xs text-gray-800">${order.dueSlot}</p>
              ${order.dueSlotSub ? `<p class="text-[11px] ${order.dueSlotSubClass || 'text-gray-500'}">${order.dueSlotSub}</p>` : ''}
            </div>
          </td>

          <!-- AMOUNT -->
          <td class="py-3.5 px-4 font-semibold text-gray-900">
            ₹${order.amount}
          </td>

          <!-- PAYMENT -->
          <td class="py-3.5 px-4">
            <div>
              <p class="text-xs font-medium text-gray-800">${order.paymentStatus}</p>
              <p class="text-[11px] text-gray-500">${order.paymentMethod}</p>
            </div>
          </td>

          <!-- STATUS -->
          <td class="py-3.5 px-4">
            ${statusBadge}
          </td>

          <!-- ACTIONS -->
          <td class="py-3.5 px-4">
            <div class="flex items-center gap-2">
              <button type="button" class="w-8 h-8 rounded-full border border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-100 flex items-center justify-center text-gray-600 transition cursor-pointer action-open-details" title="View Details" data-id="${order.id}">
                <span class="material-symbols-outlined text-[17px]">visibility</span>
              </button>
              ${actionBtnHtml}
              <div class="relative group">
                <button type="button" class="w-7 h-7 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500 cursor-pointer action-more-menu-btn" data-id="${order.id}">
                  <span class="material-symbols-outlined text-[18px]">more_vert</span>
                </button>
                <div class="hidden group-hover:block absolute right-0 top-full mt-1 w-44 bg-white rounded-lg shadow-lg border border-gray-100 py-1.5 z-30 text-xs">
                  <button type="button" class="w-full text-left px-3 py-1.5 hover:bg-gray-50 text-gray-700 flex items-center gap-2 action-open-details" data-id="${order.id}">
                    <span class="material-symbols-outlined text-[16px]">info</span> View Details
                  </button>
                  <button type="button" class="w-full text-left px-3 py-1.5 hover:bg-gray-50 text-gray-700 flex items-center gap-2 action-quick-print" data-id="${order.id}">
                    <span class="material-symbols-outlined text-[16px]">print</span> Print Slip
                  </button>
                  <button type="button" class="w-full text-left px-3 py-1.5 hover:bg-gray-50 text-gray-700 flex items-center gap-2 action-contact-customer" data-id="${order.id}">
                    <span class="material-symbols-outlined text-[16px]">call</span> Call Customer
                  </button>
                </div>
              </div>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  // Populate Order Details Modal
  function populateOrderDetails(order) {
    state.activeOrder = order;

    // Header info
    setTxt('modal-order-title', `Order Details - ${order.id}`);
    setTxt('modal-order-subtitle', `${order.id} (Created 22 Jul 2025 • 12:45 PM)`);

    // Status badge
    const badgeEl = document.getElementById('modal-order-status-badge');
    if (badgeEl) {
      badgeEl.className = `px-2.5 py-0.5 rounded-full text-xs font-medium border ${order.statusBadgeClass}`;
      badgeEl.textContent = order.status;
    }

    // Tab 1: Overview
    const avatarEl = document.getElementById('details-customer-avatar');
    if (avatarEl) {
      avatarEl.className = `w-12 h-12 rounded-full ${order.customer.avatarBg} ${order.customer.avatarColor} flex items-center justify-center font-bold text-base shrink-0`;
      avatarEl.textContent = order.customer.avatar;
    }
    setTxt('details-customer-name', order.customer.name);
    setTxt('details-customer-meta', `${order.customer.age} • ${order.customer.gender}`);
    setTxt('details-customer-phone', order.customer.phone);
    setTxt('details-customer-address', order.customer.address);
    setTxt('details-order-slot', order.dueSlot);
    setTxt('details-fulfilment-badge', order.fulfilment);

    // Items table in Overview
    const itemsTableBody = document.getElementById('details-items-tbody');
    if (itemsTableBody) {
      itemsTableBody.innerHTML = order.items.map(item => `
        <tr class="border-b border-gray-100 text-xs">
          <td class="py-2.5 px-3 font-medium text-gray-900">${item.name}</td>
          <td class="py-2.5 px-3 text-gray-600">${item.qty}</td>
          <td class="py-2.5 px-3 text-gray-600">₹${item.unitPrice}</td>
          <td class="py-2.5 px-3 font-semibold text-gray-900 text-right">₹${item.total}</td>
        </tr>
      `).join('');
    }
    setTxt('details-items-subtotal', `₹${order.paymentDetails?.subtotal || order.amount}`);
    setTxt('details-items-total', `₹${order.amount}`);

    // Contextual button in Overview
    const contextualBox = document.getElementById('details-contextual-actions');
    if (contextualBox) {
      if (order.status === 'Cancelled') {
        contextualBox.innerHTML = `
          <button type="button" class="w-full sm:w-auto px-4 py-2 text-xs font-medium rounded-lg text-gray-700 bg-gray-100 hover:bg-gray-200 action-view-cancellation" data-id="${order.id}">
            View Cancellation Details
          </button>
        `;
      } else if (order.status === 'Completed' || order.status === 'Delivered' || order.status === 'Collected') {
        contextualBox.innerHTML = `
          <div class="flex items-center gap-2">
            <button type="button" class="px-4 py-2 text-xs font-medium rounded-lg text-dodger-blue bg-blue-50 border border-blue-200 hover:bg-blue-100 action-view-invoice" data-id="${order.id}">
              View Invoice
            </button>
            <button type="button" class="px-4 py-2 text-xs font-medium rounded-lg text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 action-view-inventory" data-id="${order.id}">
              View Inventory Deductions
            </button>
          </div>
        `;
      } else if (order.status === 'Out for Delivery') {
        contextualBox.innerHTML = `
          <button type="button" class="px-4 py-2 text-xs font-medium rounded-lg text-purple-700 bg-purple-50 border border-purple-200 hover:bg-purple-100 action-track-delivery" data-id="${order.id}">
            Track Live Delivery
          </button>
        `;
      } else if (order.status === 'Ready') {
        if (order.fulfilment === 'Store Pickup') {
          contextualBox.innerHTML = `
            <button type="button" class="px-4 py-2 text-xs font-medium rounded-lg text-white bg-cyan-600 hover:bg-cyan-700 action-confirm-pickup" data-id="${order.id}">
              Confirm Store Pickup
            </button>
          `;
        } else {
          contextualBox.innerHTML = `
            <button type="button" class="px-4 py-2 text-xs font-medium rounded-lg text-white bg-dodger-blue hover:bg-blue-600 action-dispatch-order" data-id="${order.id}">
              Dispatch Order
            </button>
          `;
        }
      } else if (order.status === 'Packing') {
        contextualBox.innerHTML = `
          <button type="button" class="px-4 py-2 text-xs font-medium rounded-lg text-white bg-dodger-blue hover:bg-blue-600 action-mark-ready" data-id="${order.id}">
            Prepare Order & Mark Ready
          </button>
        `;
      } else {
        // Pending
        let pendingBtns = '';
        if (order.attentionType === 'prescription') {
          pendingBtns += `
            <button type="button" class="px-4 py-2 text-xs font-medium rounded-lg text-amber-800 bg-amber-100 hover:bg-amber-200 border border-amber-300 action-review-rx mr-2" data-id="${order.id}">
              Review Prescription
            </button>
          `;
        }
        if (order.attentionType === 'stock') {
          pendingBtns += `
            <button type="button" class="px-4 py-2 text-xs font-medium rounded-lg text-rose-800 bg-rose-100 hover:bg-rose-200 border border-rose-300 action-resolve-stock mr-2" data-id="${order.id}">
              Review Stock Issue
            </button>
          `;
        }
        pendingBtns += `
          <button type="button" class="px-4 py-2 text-xs font-medium rounded-lg text-white bg-dodger-blue hover:bg-blue-600 action-start-packing" data-id="${order.id}">
            Start Packing
          </button>
        `;
        contextualBox.innerHTML = pendingBtns;
      }
    }

    // Tab 2: Prescription
    const rxCard = document.getElementById('details-rx-card');
    if (rxCard) {
      if (order.rxDetails) {
        rxCard.innerHTML = `
          <div class="border border-gray-200 rounded-lg p-4 bg-gray-50/60">
            <div class="flex items-start justify-between gap-3">
              <div class="flex items-start gap-3">
                <span class="material-symbols-outlined text-[32px] text-dodger-blue">description</span>
                <div>
                  <p class="font-semibold text-sm text-gray-900">${order.rxDetails.fileName}</p>
                  <p class="text-xs text-gray-500 mt-0.5">${order.rxDetails.doctor} • Reg: ${order.rxDetails.regNo}</p>
                  <p class="text-xs text-gray-400 mt-0.5">Uploaded on ${order.rxDetails.date}</p>
                </div>
              </div>
              <span class="px-2 py-0.5 rounded-full text-xs font-medium ${order.prescriptionBadgeClass}">
                ${order.prescriptionStatus}
              </span>
            </div>
            ${order.rxDetails.notes ? `<p class="text-xs text-amber-700 bg-amber-50 p-2.5 rounded mt-3 border border-amber-100"><span class="font-semibold">Note:</span> ${order.rxDetails.notes}</p>` : ''}
            <div class="flex items-center gap-2 mt-4">
              <button type="button" class="px-3.5 py-1.5 text-xs font-medium text-white bg-dodger-blue rounded hover:bg-blue-600 action-review-rx" data-id="${order.id}">
                Review Prescription
              </button>
              <button type="button" class="px-3.5 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 action-view-full-rx" data-id="${order.id}">
                View Full Rx
              </button>
            </div>
          </div>
        `;
      } else {
        rxCard.innerHTML = `
          <div class="border border-dashed border-gray-200 rounded-lg p-6 text-center text-gray-400">
            <span class="material-symbols-outlined text-[36px] text-gray-300">healing</span>
            <p class="text-xs mt-1">Prescription is not required for over-the-counter items in this order.</p>
          </div>
        `;
      }
    }

    // Tab 3: Payment
    setTxt('details-pay-subtotal', `₹${order.paymentDetails?.subtotal || order.amount}`);
    setTxt('details-pay-delivery', order.paymentDetails?.delivery ? `₹${order.paymentDetails.delivery}` : 'Free');
    setTxt('details-pay-tax', order.paymentDetails?.tax ? `₹${order.paymentDetails.tax}` : '₹0');
    setTxt('details-pay-total', `₹${order.amount}`);
    setTxt('details-pay-status', order.paymentDetails?.status || order.paymentStatus);
    setTxt('details-pay-method', order.paymentDetails?.method || order.paymentMethod);
    setTxt('details-pay-txnid', order.paymentDetails?.transactionId || 'N/A');

    // Tab 4: Activity
    const activityList = document.getElementById('details-activity-list');
    if (activityList) {
      if (order.activity && order.activity.length > 0) {
        activityList.innerHTML = order.activity.map((act, idx) => {
          let dotColor = 'bg-dodger-blue';
          if (act.status === 'warning') dotColor = 'bg-amber-500';
          if (act.status === 'cancelled') dotColor = 'bg-rose-500';
          if (act.status === 'completed') dotColor = 'bg-emerald-500';

          return `
            <div class="relative pl-6 pb-5 last:pb-0">
              ${idx < order.activity.length - 1 ? '<div class="absolute left-2.5 top-3 -bottom-1 w-0.5 bg-gray-200"></div>' : ''}
              <div class="absolute left-1 top-1.5 w-3.5 h-3.5 rounded-full ${dotColor} ring-4 ring-white"></div>
              <p class="text-xs font-semibold text-gray-900">${act.title}</p>
              <p class="text-[11px] text-gray-500 mt-0.5">${act.time}</p>
            </div>
          `;
        }).join('');
      } else {
        activityList.innerHTML = `<p class="text-xs text-gray-400">No activity recorded yet.</p>`;
      }
    }

    // Reset sub-tab to Overview
    switchOrderDetailsTab('overview');
    openModal('modal-order-details');
  }

  // Sub-tab switching inside Order Details
  function switchOrderDetailsTab(tabName) {
    state.orderDetailsActiveTab = tabName;
    ['overview', 'prescription', 'payment', 'activity'].forEach(t => {
      const btn = document.getElementById(`tab-btn-${t}`);
      const content = document.getElementById(`tab-content-${t}`);
      if (btn) {
        if (t === tabName) {
          btn.className = "py-3 px-4 border-b-2 border-dodger-blue font-semibold text-dodger-blue text-xs sm:text-sm cursor-pointer";
        } else {
          btn.className = "py-3 px-4 border-b-2 border-transparent font-medium text-gray-500 hover:text-gray-700 text-xs sm:text-sm cursor-pointer";
        }
      }
      if (content) {
        if (t === tabName) content.classList.remove('hidden');
        else content.classList.add('hidden');
      }
    });
  }

  // Review Prescription Popup
  function openReviewPrescriptionPopup(orderId) {
    const order = ordersList.find(o => o.id === orderId) || state.activeOrder;
    if (!order) return;
    state.activeOrder = order;

    setTxt('rx-popup-subtitle', `${order.id} - ${order.customer.name}`);
    setTxt('rx-popup-doctor', order.rxDetails?.doctor || "Dr. A. K. Gupta - MBBS, MD");
    setTxt('rx-popup-hospital', order.rxDetails?.hospital || "Apollo Clinics");
    setTxt('rx-popup-reg', order.rxDetails?.regNo || "MCI-49201");
    setTxt('rx-popup-date', order.rxDetails?.date || "22 Jul 2025");
    setTxt('rx-popup-patient', order.customer.name);

    // Reset checkboxes
    const c1 = document.getElementById('rx-check-1');
    const c2 = document.getElementById('rx-check-2');
    const c3 = document.getElementById('rx-check-3');
    const c4 = document.getElementById('rx-check-4');
    if (c1) c1.checked = true;
    if (c2) c2.checked = true;
    if (c3) c3.checked = true;
    if (c4) c4.checked = true;

    const notesInput = document.getElementById('rx-notes-input');
    if (notesInput) notesInput.value = '';

    openModal('modal-review-prescription');
  }

  // Resolve Stock Issue Popup
  function openResolveStockPopup(orderId) {
    const order = ordersList.find(o => o.id === orderId) || state.activeOrder;
    if (!order) return;
    state.activeOrder = order;

    setTxt('stock-popup-subtitle', `${order.id} - ${order.customer.name}`);
    const details = order.stockShortageDetails || {
      itemName: "Amoxicillin 500mg Capsules",
      orderedQty: "2 strips (20 caps)",
      availableStock: "0 units in store"
    };

    setTxt('stock-shortage-item', details.itemName);
    setTxt('stock-shortage-ordered', details.orderedQty);
    setTxt('stock-shortage-available', details.availableStock);

    openModal('modal-resolve-stock');
  }

  // Prepare Order (Packing) Popup
  function openPrepareOrderPopup(orderId) {
    const order = ordersList.find(o => o.id === orderId) || state.activeOrder;
    if (!order) return;
    state.activeOrder = order;

    setTxt('prepare-popup-subtitle', `${order.id} - ${order.customer.name}`);

    const tbody = document.getElementById('prepare-items-tbody');
    if (tbody) {
      tbody.innerHTML = order.items.map((item, idx) => `
        <tr class="border-b border-gray-100 text-xs">
          <td class="py-2.5 px-3 font-medium text-gray-900">${item.name}</td>
          <td class="py-2.5 px-3 text-gray-600">${item.qty}</td>
          <td class="py-2.5 px-3 text-gray-600">${item.shelf || 'Shelf A-12'} • ${item.batch || 'Batch #B-902'}</td>
          <td class="py-2.5 px-3 text-center">
            <input type="checkbox" id="prepare-item-check-${idx}" checked class="h-4 w-4 rounded border-gray-300 text-dodger-blue focus:ring-dodger-blue cursor-pointer">
          </td>
        </tr>
      `).join('');
    }

    openModal('modal-prepare-order');
  }

  // Dispatch Order Popup
  function openDispatchPopup(orderId) {
    const order = ordersList.find(o => o.id === orderId) || state.activeOrder;
    if (!order) return;
    state.activeOrder = order;

    setTxt('dispatch-popup-subtitle', `${order.id} - ${order.customer.name}`);
    const d = order.dispatchDetails || {
      assignedCourier: "Dunzo Express",
      riderName: "Sunil Kumar",
      riderPhone: "+91 98200 12345",
      trackingId: "DNZ-492019"
    };

    setTxt('dispatch-courier-name', d.assignedCourier);
    setTxt('dispatch-rider-name', d.riderName);
    setTxt('dispatch-rider-phone', d.riderPhone);
    setTxt('dispatch-tracking-id', d.trackingId);

    const c1 = document.getElementById('dispatch-check-1');
    const c2 = document.getElementById('dispatch-check-2');
    if (c1) c1.checked = true;
    if (c2) c2.checked = true;

    openModal('modal-dispatch-order');
  }

  // Confirm Store Pickup Popup
  function openConfirmPickupPopup(orderId) {
    const order = ordersList.find(o => o.id === orderId) || state.activeOrder;
    if (!order) return;
    state.activeOrder = order;

    setTxt('pickup-popup-subtitle', `${order.id} - ${order.customer.name}`);
    setTxt('pickup-popup-customer', order.customer.name);
    setTxt('pickup-popup-amount', `₹${order.amount}`);
    setTxt('pickup-popup-slot', order.dueSlot);

    const otpInput = document.getElementById('pickup-otp-input');
    if (otpInput) otpInput.value = order.pickupCode || '8419';

    const verifyCheck = document.getElementById('pickup-verify-check');
    if (verifyCheck) verifyCheck.checked = true;

    openModal('modal-confirm-pickup');
  }

  // Track Delivery Popup
  function openTrackDeliveryPopup(orderId) {
    const order = ordersList.find(o => o.id === orderId) || state.activeOrder;
    if (!order) return;
    state.activeOrder = order;

    setTxt('track-popup-subtitle', `${order.id} - ${order.customer.name}`);
    const d = order.deliveryDetails || {
      partner: "Shadowfax Express",
      rider: "Ramesh Patel",
      phone: "+91 98201 99123",
      status: "In Transit",
      eta: "1:20 PM",
      destination: order.customer.address
    };

    setTxt('track-partner', d.partner);
    setTxt('track-rider', d.rider);
    setTxt('track-status-pill', d.status);
    setTxt('track-destination', d.destination || order.customer.address);

    openModal('modal-track-delivery');
  }

  // Invoice Preview Popup
  function openInvoicePopup(orderId) {
    const order = ordersList.find(o => o.id === orderId) || state.activeOrder;
    if (!order) return;
    state.activeOrder = order;

    const inv = order.invoice || {
      invoiceNo: `INV-2025-0722-${order.numericId}`,
      date: "22 Jul 2025",
      subtotal: order.amount,
      cgst: (order.amount * 0.025).toFixed(2),
      sgst: (order.amount * 0.025).toFixed(2),
      total: order.amount.toFixed(2)
    };

    setTxt('invoice-no', inv.invoiceNo);
    setTxt('invoice-date', inv.date);
    setTxt('invoice-customer-name', order.customer.name);
    setTxt('invoice-customer-address', order.customer.address);

    const tbody = document.getElementById('invoice-items-tbody');
    if (tbody) {
      tbody.innerHTML = order.items.map(item => `
        <tr class="border-b border-gray-100 text-xs">
          <td class="py-2 px-3 font-medium text-gray-900">${item.name}</td>
          <td class="py-2 px-3 text-gray-500">3004</td>
          <td class="py-2 px-3 text-gray-700">${item.qty}</td>
          <td class="py-2 px-3 text-gray-700">₹${item.unitPrice}</td>
          <td class="py-2 px-3 text-right font-semibold text-gray-900">₹${item.total}</td>
        </tr>
      `).join('');
    }

    setTxt('invoice-subtotal', `₹${inv.subtotal}`);
    setTxt('invoice-cgst', `₹${inv.cgst}`);
    setTxt('invoice-sgst', `₹${inv.sgst}`);
    setTxt('invoice-grand-total', `₹${inv.total}`);

    openModal('modal-invoice-preview');
  }

  // Order Inventory Popup
  function openInventoryPopup(orderId) {
    const order = ordersList.find(o => o.id === orderId) || state.activeOrder;
    if (!order) return;
    state.activeOrder = order;

    setTxt('inventory-popup-subtitle', `${order.id} - ${order.medicinesSummary}`);

    const tbody = document.getElementById('inventory-items-tbody');
    if (tbody) {
      tbody.innerHTML = order.items.map(item => `
        <tr class="border-b border-gray-100 text-xs">
          <td class="py-2.5 px-3 font-medium text-gray-900">${item.name}</td>
          <td class="py-2.5 px-3 text-gray-600">${item.batch || 'B-4921'}</td>
          <td class="py-2.5 px-3 text-gray-600">${item.expiry || '12/2026'}</td>
          <td class="py-2.5 px-3 text-gray-900 font-semibold">${item.qty}</td>
          <td class="py-2.5 px-3 text-emerald-700 font-semibold">${item.stockLeft !== undefined ? item.stockLeft + ' in stock' : '45 in stock'}</td>
        </tr>
      `).join('');
    }

    openModal('modal-order-inventory');
  }

  // Cancellation Details Popup
  function openCancellationPopup(orderId) {
    const order = ordersList.find(o => o.id === orderId) || state.activeOrder;
    if (!order) return;
    state.activeOrder = order;

    setTxt('cancel-popup-subtitle', `${order.id} - ${order.customer.name}`);
    const cd = order.cancellationDetails || {
      cancelledAt: "22 Jul 2025 • 10:20 AM",
      cancelledBy: "System / Customer",
      reason: "Order was cancelled due to prescription clarification timeout.",
      refundStatus: `Refund Pending - ₹${order.amount}.00 via UPI`
    };

    setTxt('cancel-popup-time', cd.cancelledAt);
    setTxt('cancel-popup-by', cd.cancelledBy);
    setTxt('cancel-popup-reason', cd.reason);
    setTxt('cancel-popup-refund', cd.refundStatus);

    openModal('modal-cancellation-details');
  }

  // Export to CSV function
  function exportOrdersCsv() {
    const scopeRadio = document.querySelector('input[name="export_scope"]:checked');
    const isFilteredOnly = scopeRadio && scopeRadio.value === 'filtered';
    const listToExport = isFilteredOnly ? getFilteredOrders() : ordersList;

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Order ID,Customer,Area,Medicines,Fulfilment,Due Slot,Amount,Payment Status,Payment Method,Status\n";

    listToExport.forEach(o => {
      const row = [
        `"${o.id}"`,
        `"${o.customer.name}"`,
        `"${o.customer.area}"`,
        `"${o.medicinesSummary.replace(/"/g, '""')}"`,
        `"${o.fulfilment}"`,
        `"${o.dueSlot}"`,
        `"${o.amount}"`,
        `"${o.paymentStatus}"`,
        `"${o.paymentMethod}"`,
        `"${o.status}"`
      ].join(",");
      csvContent += row + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `medoc_orders_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    closeModal('modal-export');
    notify(`Export completed: ${listToExport.length} orders downloaded as CSV.`, 'success');
  }

  // Bind Events
  function initEvents() {
    // Tab switching
    document.querySelectorAll('.order-tab-btn').forEach(btn => {
      btn.addEventListener('click', function () {
        const tab = this.getAttribute('data-tab');
        state.currentTab = tab;

        document.querySelectorAll('.order-tab-btn').forEach(b => {
          b.classList.remove('border-dodger-blue', 'text-dodger-blue', 'font-semibold');
          b.classList.add('border-transparent', 'text-gray-500', 'font-medium');
        });

        this.classList.remove('border-transparent', 'text-gray-500', 'font-medium');
        this.classList.add('border-dodger-blue', 'text-dodger-blue', 'font-semibold');

        renderOrdersTable();
      });
    });

    // Needs Attention Toggle
    const attentionToggle = document.getElementById('needs-attention-toggle');
    if (attentionToggle) {
      attentionToggle.addEventListener('change', function () {
        state.needsAttentionOnly = this.checked;
        renderOrdersTable();
      });
    }

    // Attention Banner "Review Orders" link
    const reviewOrdersLink = document.getElementById('btn-review-orders');
    if (reviewOrdersLink) {
      reviewOrdersLink.addEventListener('click', function () {
        state.needsAttentionOnly = true;
        if (attentionToggle) attentionToggle.checked = true;
        renderOrdersTable();
      });
    }

    // Search Input
    const searchInput = document.getElementById('orders-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', function () {
        state.searchQuery = this.value.trim();
        renderOrdersTable();
      });
    }

    // Filter Dropdowns
    const filterFulfilment = document.getElementById('filter-fulfilment');
    if (filterFulfilment) {
      filterFulfilment.addEventListener('change', function () {
        state.fulfilmentFilter = this.value;
        renderOrdersTable();
      });
    }

    const filterPayment = document.getElementById('filter-payment');
    if (filterPayment) {
      filterPayment.addEventListener('change', function () {
        state.paymentFilter = this.value;
        renderOrdersTable();
      });
    }

    const filterPrescription = document.getElementById('filter-prescription');
    if (filterPrescription) {
      filterPrescription.addEventListener('change', function () {
        state.prescriptionFilter = this.value;
        renderOrdersTable();
      });
    }

    const filterSort = document.getElementById('filter-sort');
    if (filterSort) {
      filterSort.addEventListener('change', function () {
        state.sortOrder = this.value;
        renderOrdersTable();
      });
    }

    // Reset Filters
    const btnResetFilters = document.getElementById('btn-reset-filters');
    if (btnResetFilters) {
      btnResetFilters.addEventListener('click', function () {
        state.searchQuery = '';
        state.fulfilmentFilter = 'all';
        state.paymentFilter = 'all';
        state.prescriptionFilter = 'all';
        state.sortOrder = 'newest';
        state.needsAttentionOnly = false;

        if (searchInput) searchInput.value = '';
        if (filterFulfilment) filterFulfilment.value = 'all';
        if (filterPayment) filterPayment.value = 'all';
        if (filterPrescription) filterPrescription.value = 'all';
        if (filterSort) filterSort.value = 'newest';
        if (attentionToggle) attentionToggle.checked = false;

        renderOrdersTable();
        notify('Filters reset to default.', 'info');
      });
    }

    // Date Range Pills
    document.querySelectorAll('.date-filter-pill').forEach(pill => {
      pill.addEventListener('click', function () {
        const range = this.getAttribute('data-range');

        if (range === 'custom') {
          openModal('modal-custom-date');
          return;
        }

        state.dateRange = range;
        document.querySelectorAll('.date-filter-pill').forEach(p => {
          p.classList.remove('bg-dodger-blue', 'text-white', 'border-transparent');
          p.classList.add('bg-white', 'text-gray-700', 'border-gray-300');
        });
        this.classList.remove('bg-white', 'text-gray-700', 'border-gray-300');
        this.classList.add('bg-dodger-blue', 'text-white', 'border-transparent');

        if (range === 'today') setTxt('selected-date-display', 'Selected date : 22 Jul 2025');
        else if (range === 'yesterday') setTxt('selected-date-display', 'Selected date : 21 Jul 2025');
        else if (range === 'last7') setTxt('selected-date-display', 'Selected date : 15 - 22 Jul 2025');

        notify(`Date range changed to ${this.textContent.trim()}`, 'info');
      });
    });

    // Custom Date Apply Button
    const btnApplyCustomDate = document.getElementById('btn-apply-custom-date');
    if (btnApplyCustomDate) {
      btnApplyCustomDate.addEventListener('click', function () {
        const fromVal = document.getElementById('custom-from-date')?.value || '12/05/2024';
        const toVal = document.getElementById('custom-to-date')?.value || '18/05/2024';

        state.dateRange = 'custom';
        document.querySelectorAll('.date-filter-pill').forEach(p => {
          p.classList.remove('bg-dodger-blue', 'text-white', 'border-transparent');
          p.classList.add('bg-white', 'text-gray-700', 'border-gray-300');
        });

        const customPill = document.querySelector('.date-filter-pill[data-range="custom"]');
        if (customPill) {
          customPill.classList.remove('bg-white', 'text-gray-700', 'border-gray-300');
          customPill.classList.add('bg-dodger-blue', 'text-white', 'border-transparent');
        }

        setTxt('selected-date-display', `Selected date : ${fromVal} - ${toVal}`);
        closeModal('modal-custom-date');
        notify(`Custom date filter applied: ${fromVal} to ${toVal}`, 'success');
      });
    }

    // Export button (opens Export modal)
    document.querySelectorAll('.btn-open-export').forEach(btn => {
      btn.addEventListener('click', function () {
        const filteredCount = getFilteredOrders().length;
        setTxt('export-filtered-count-badge', `${filteredCount} orders`);
        setTxt('export-summary-count', `• ${filteredCount} orders selected`);
        openModal('modal-export');
      });
    });

    // Confirm Export CSV
    const btnConfirmExport = document.getElementById('btn-confirm-export');
    if (btnConfirmExport) {
      btnConfirmExport.addEventListener('click', exportOrdersCsv);
    }

    // Order Details sub-tabs
    ['overview', 'prescription', 'payment', 'activity'].forEach(t => {
      const btn = document.getElementById(`tab-btn-${t}`);
      if (btn) {
        btn.addEventListener('click', () => switchOrderDetailsTab(t));
      }
    });

    // Delegated actions on document for dynamically rendered rows
    document.addEventListener('click', function (e) {
      const target = e.target;

      // Close modal by clicking X or [data-close-modal]
      const closeBtn = target.closest('[data-close-modal]');
      if (closeBtn) {
        const modalId = closeBtn.getAttribute('data-close-modal');
        closeModal(modalId);
        return;
      }

      // Close modal on backdrop click
      if (target.classList.contains('orders-modal-overlay')) {
        target.classList.add('hidden');
        target.classList.remove('flex');
        if (!document.querySelector('.orders-modal-overlay:not(.hidden)')) {
          document.body.style.overflow = '';
        }
        return;
      }

      // View details click
      const viewDetailsBtn = target.closest('.action-open-details');
      if (viewDetailsBtn) {
        const orderId = viewDetailsBtn.getAttribute('data-id');
        const order = ordersList.find(o => o.id === orderId);
        if (order) populateOrderDetails(order);
        return;
      }

      // Review Prescription click
      const reviewRxBtn = target.closest('.action-review-rx');
      if (reviewRxBtn) {
        const orderId = reviewRxBtn.getAttribute('data-id');
        openReviewPrescriptionPopup(orderId);
        return;
      }

      // Resolve Stock Issue click
      const resolveStockBtn = target.closest('.action-resolve-stock');
      if (resolveStockBtn) {
        const orderId = resolveStockBtn.getAttribute('data-id');
        openResolveStockPopup(orderId);
        return;
      }

      // Start Packing click
      const startPackingBtn = target.closest('.action-start-packing');
      if (startPackingBtn) {
        const orderId = startPackingBtn.getAttribute('data-id');
        const order = ordersList.find(o => o.id === orderId);
        if (order) {
          order.status = 'Packing';
          order.tab = 'packing';
          order.statusBadgeClass = 'bg-blue-100 text-blue-800 border-blue-200';
          order.activity.unshift({
            title: "Packing started by pharmacy team",
            time: "Just now",
            status: "completed"
          });
          updateCounts();
          renderOrdersTable();
          notify(`Order ${order.id} moved to Packing queue.`, 'success');
          closeModal('modal-order-details');
        }
        return;
      }

      // Mark Ready / Prepare Order click
      const markReadyBtn = target.closest('.action-mark-ready');
      if (markReadyBtn) {
        const orderId = markReadyBtn.getAttribute('data-id');
        openPrepareOrderPopup(orderId);
        return;
      }

      // Dispatch Order click
      const dispatchBtn = target.closest('.action-dispatch-order');
      if (dispatchBtn) {
        const orderId = dispatchBtn.getAttribute('data-id');
        openDispatchPopup(orderId);
        return;
      }

      // Confirm Store Pickup click
      const confirmPickupBtn = target.closest('.action-confirm-pickup');
      if (confirmPickupBtn) {
        const orderId = confirmPickupBtn.getAttribute('data-id');
        openConfirmPickupPopup(orderId);
        return;
      }

      // Track Delivery click
      const trackDeliveryBtn = target.closest('.action-track-delivery');
      if (trackDeliveryBtn) {
        const orderId = trackDeliveryBtn.getAttribute('data-id');
        openTrackDeliveryPopup(orderId);
        return;
      }

      // View Invoice click
      const viewInvoiceBtn = target.closest('.action-view-invoice');
      if (viewInvoiceBtn) {
        const orderId = viewInvoiceBtn.getAttribute('data-id');
        openInvoicePopup(orderId);
        return;
      }

      // View Inventory click
      const viewInventoryBtn = target.closest('.action-view-inventory');
      if (viewInventoryBtn) {
        const orderId = viewInventoryBtn.getAttribute('data-id');
        openInventoryPopup(orderId);
        return;
      }

      // View Cancellation click
      const viewCancelBtn = target.closest('.action-view-cancellation');
      if (viewCancelBtn) {
        const orderId = viewCancelBtn.getAttribute('data-id');
        openCancellationPopup(orderId);
        return;
      }

      // Quick actions
      const callCustomerBtn = target.closest('.action-contact-customer');
      if (callCustomerBtn) {
        const orderId = callCustomerBtn.getAttribute('data-id');
        const order = ordersList.find(o => o.id === orderId);
        if (order) notify(`Connecting call to ${order.customer.name} (${order.customer.phone})...`, 'info');
        return;
      }

      const quickPrintBtn = target.closest('.action-quick-print');
      if (quickPrintBtn) {
        const orderId = quickPrintBtn.getAttribute('data-id');
        notify(`Printing packing slip for ${orderId}...`, 'info');
        window.print();
        return;
      }
    });

    // Workflow actions inside Popups

    // 1. Approve Prescription
    const btnApproveRx = document.getElementById('btn-approve-rx');
    if (btnApproveRx) {
      btnApproveRx.addEventListener('click', function () {
        if (!state.activeOrder) return;
        state.activeOrder.prescriptionStatus = 'Verified';
        state.activeOrder.prescriptionBadgeClass = 'bg-emerald-100 text-emerald-800 border-emerald-200';
        state.activeOrder.needsAttention = false;
        state.activeOrder.hasAlert = false;
        state.activeOrder.activity.unshift({
          title: "Prescription verified & approved by pharmacist",
          time: "Just now",
          status: "completed"
        });

        closeModal('modal-review-prescription');
        updateCounts();
        renderOrdersTable();
        notify(`Prescription for ${state.activeOrder.customer.name} approved & verified!`, 'success');

        if (!document.getElementById('modal-order-details').classList.contains('hidden')) {
          populateOrderDetails(state.activeOrder);
        }
      });
    }

    // 2. Reject Prescription
    const btnRejectRx = document.getElementById('btn-reject-rx');
    if (btnRejectRx) {
      btnRejectRx.addEventListener('click', function () {
        if (!state.activeOrder) return;
        state.activeOrder.prescriptionStatus = 'Clarification Needed';
        state.activeOrder.activity.unshift({
          title: "Prescription rejected - Clarification required",
          time: "Just now",
          status: "warning"
        });
        closeModal('modal-review-prescription');
        renderOrdersTable();
        notify(`Prescription marked as requiring clarification.`, 'warning');
      });
    }

    // 3. Confirm Stock Resolution
    const btnConfirmStock = document.getElementById('btn-confirm-stock-resolution');
    if (btnConfirmStock) {
      btnConfirmStock.addEventListener('click', function () {
        if (!state.activeOrder) return;
        state.activeOrder.needsAttention = false;
        state.activeOrder.hasAlert = false;
        // Apply substitution
        if (state.activeOrder.items && state.activeOrder.items[0]) {
          state.activeOrder.items[0].name = "Moxikind-CV 500mg (Generic Alternative)";
          state.activeOrder.items[0].isShortage = false;
        }
        state.activeOrder.activity.unshift({
          title: "Stock shortage resolved: Substituted with generic Moxikind-CV 500mg",
          time: "Just now",
          status: "completed"
        });

        closeModal('modal-resolve-stock');
        updateCounts();
        renderOrdersTable();
        notify(`Stock issue resolved for ${state.activeOrder.id}. Substitution applied.`, 'success');

        if (!document.getElementById('modal-order-details').classList.contains('hidden')) {
          populateOrderDetails(state.activeOrder);
        }
      });
    }

    // 4. Complete Packing & Mark Ready
    const btnCompletePacking = document.getElementById('btn-complete-packing');
    if (btnCompletePacking) {
      btnCompletePacking.addEventListener('click', function () {
        if (!state.activeOrder) return;
        state.activeOrder.status = 'Ready';
        state.activeOrder.tab = 'ready';
        state.activeOrder.statusBadgeClass = 'bg-cyan-100 text-cyan-800 border-cyan-200';
        state.activeOrder.activity.unshift({
          title: "Order packing completed & marked Ready",
          time: "Just now",
          status: "completed"
        });

        closeModal('modal-prepare-order');
        closeModal('modal-order-details');
        updateCounts();
        renderOrdersTable();
        notify(`Order ${state.activeOrder.id} packed and marked Ready for handover!`, 'success');
      });
    }

    // 5. Confirm Dispatch
    const btnConfirmDispatch = document.getElementById('btn-confirm-dispatch');
    if (btnConfirmDispatch) {
      btnConfirmDispatch.addEventListener('click', function () {
        if (!state.activeOrder) return;
        state.activeOrder.status = 'Out for Delivery';
        state.activeOrder.tab = 'out_for_delivery';
        state.activeOrder.statusBadgeClass = 'bg-purple-100 text-purple-800 border-purple-200';
        state.activeOrder.activity.unshift({
          title: "Package handed over to Dunzo Express rider Sunil Kumar",
          time: "Just now",
          status: "completed"
        });

        closeModal('modal-dispatch-order');
        closeModal('modal-order-details');
        updateCounts();
        renderOrdersTable();
        notify(`Order ${state.activeOrder.id} dispatched! Out for delivery with Dunzo Express.`, 'success');
      });
    }

    // 6. Complete Store Pickup Handover
    const btnHandoverPickup = document.getElementById('btn-handover-pickup');
    if (btnHandoverPickup) {
      btnHandoverPickup.addEventListener('click', function () {
        if (!state.activeOrder) return;
        state.activeOrder.status = 'Collected';
        state.activeOrder.tab = 'completed';
        state.activeOrder.paymentStatus = 'Paid';
        state.activeOrder.statusBadgeClass = 'bg-emerald-100 text-emerald-800 border-emerald-200';
        state.activeOrder.activity.unshift({
          title: "Order collected by customer Vijay Mehta. Payment verified.",
          time: "Just now",
          status: "completed"
        });

        closeModal('modal-confirm-pickup');
        closeModal('modal-order-details');
        updateCounts();
        renderOrdersTable();
        notify(`Store pickup verified! Order ${state.activeOrder.id} handed over to customer.`, 'success');
      });
    }

    // 7. Process Refund in Cancellation Popup
    const btnProcessRefund = document.getElementById('btn-process-refund');
    if (btnProcessRefund) {
      btnProcessRefund.addEventListener('click', function () {
        if (!state.activeOrder) return;
        state.activeOrder.paymentStatus = 'Refund Completed';
        setTxt('cancel-popup-refund', 'Refund Completed - ₹260.00 transferred via UPI');
        renderOrdersTable();
        notify(`Refund of ₹${state.activeOrder.amount} processed successfully via UPI!`, 'success');
      });
    }

    // 8. Print Invoice button
    const btnPrintInvoice = document.getElementById('btn-print-invoice');
    if (btnPrintInvoice) {
      btnPrintInvoice.addEventListener('click', function () {
        window.print();
      });
    }

    // 9. Download Invoice PDF button
    const btnDownloadInvoicePdf = document.getElementById('btn-download-invoice-pdf');
    if (btnDownloadInvoicePdf) {
      btnDownloadInvoicePdf.addEventListener('click', function () {
        notify('Generating Invoice PDF download...', 'info');
        setTimeout(() => {
          notify('Invoice PDF downloaded successfully.', 'success');
        }, 800);
      });
    }

    // 10. Call Rider button
    const btnCallRider = document.getElementById('btn-call-rider');
    if (btnCallRider) {
      btnCallRider.addEventListener('click', function () {
        notify('Calling Delivery Partner (+91 98201 99123)...', 'info');
      });
    }

    // Escape key listener to close modals
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        document.querySelectorAll('.orders-modal-overlay:not(.hidden)').forEach(modal => {
          modal.classList.add('hidden');
          modal.classList.remove('flex');
        });
        document.body.style.overflow = '';
      }
    });
  }

  // Initial initialization
  document.addEventListener('DOMContentLoaded', function () {
    updateCounts();
    renderOrdersTable();
    initEvents();
  });

})();
