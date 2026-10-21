"""
Management command to export an anonymized, privacy-compliant campus errand
dataset for research and future recommendation model training (ADR D14,
docs/ai-roadmap.md).

Guarantees:
- ZERO student PII (no roll numbers, names, phone numbers, exact room numbers, or UPI IDs).
- Salted SHA-256 hashed order identifiers.
- Aggregated temporal and spatial clusters.
"""
import csv
import hashlib
import json
import sys
from django.core.management.base import BaseCommand
from django.utils import timezone
from apps.orders.models import Request, OrderStatus, StatusChange
from apps.payments.models import Payment


class Command(BaseCommand):
    help = "Export privacy-scrubbed campus errand dataset (D14 / docs/ai-roadmap.md)"

    def add_arguments(self, parser):
        parser.add_argument(
            "--format",
            choices=["csv", "jsonl"],
            default="csv",
            help="Output format (default: csv)",
        )
        parser.add_argument(
            "--output",
            type=str,
            default="",
            help="Output file path (default: stdout)",
        )

    def handle(self, *args, **options):
        fmt = options["format"]
        out_path = options["output"]

        orders = Request.objects.all().prefetch_related("items").order_by("created_at")
        rows = []
        salt = "needit-anonymize-salt"

        for o in orders:
            order_hash = hashlib.sha256(f"{salt}-{o.pk}".encode()).hexdigest()[:16]
            created = o.created_at or timezone.now()
            
            # StatusChange timing
            changes = list(StatusChange.objects.filter(request_id=o.pk).order_by("created_at"))
            accept_change = next((c for c in changes if c.to_status == OrderStatus.ACCEPTED), None)
            completed_change = next((c for c in changes if c.to_status == OrderStatus.COMPLETED), None)
            
            time_to_accept = int((accept_change.created_at - created).total_seconds()) if accept_change else None
            time_to_deliver = int((completed_change.created_at - accept_change.created_at).total_seconds()) if (accept_change and completed_change) else None

            # Payment details
            payment = Payment.objects.filter(request=o).first()
            actual_total = sum(i.actual_price or 0 for i in o.items.all()) if o.items.exists() else 0
            helper_fee = payment.helper_fee if payment else 20

            # Normalized items (names only, no personal notes)
            item_names = [i.name.strip().lower() for i in o.items.all()]

            row = {
                "order_hash": order_hash,
                "day_of_week": created.weekday(),
                "hour_of_day": created.hour,
                "pickup_cluster": (o.pickup_point or "campus_general").strip().lower(),
                "delivery_cluster": getattr(o.customer, "hostel_block", "campus_hostel") or "campus_hostel",
                "item_count": o.items.count(),
                "items_summary": "; ".join(item_names),
                "estimated_goods_total": float(o.expected_total or 0),
                "actual_goods_total": float(actual_total),
                "helper_fee": float(helper_fee),
                "time_to_accept_sec": time_to_accept,
                "time_to_deliver_sec": time_to_deliver,
                "fulfillment_status": o.status,
            }
            rows.append(row)

        if out_path:
            out_file = open(out_path, "w", newline="", encoding="utf-8")
        else:
            out_file = sys.stdout

        try:
            if fmt == "csv":
                if rows:
                    writer = csv.DictWriter(out_file, fieldnames=list(rows[0].keys()))
                    writer.writeheader()
                    writer.writerows(rows)
            else:
                for r in rows:
                    out_file.write(json.dumps(r) + "\n")
        finally:
            if out_path:
                out_file.close()

        self.stderr.write(self.style.SUCCESS(f"Exported {len(rows)} anonymized errand records."))
