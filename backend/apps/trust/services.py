from .models import ProblemEvent, TrustPolicy


def record_problem(user, kind, order=None, report=None, note=""):
    """Idempotent per report; flakes dedupe per (user, order, kind) so a
    double-sweep or repeated cancel can't count twice."""
    if report is not None:
        _, created = ProblemEvent.objects.get_or_create(
            report=report, defaults={
                "user": user, "kind": kind, "order": order, "note": note,
            })
        return created
    _, created = ProblemEvent.objects.get_or_create(
        user=user, order=order, kind=kind, defaults={"note": note})
    return created


def problem_count(user):
    return ProblemEvent.objects.filter(user=user).count()


def block_reason(user, role):
    """None if allowed, else the client-facing block message."""
    policy = TrustPolicy.get()
    count = problem_count(user)
    limit = policy.helper_max_problems if role == "helper" else policy.customer_max_problems
    if count >= limit:
        return (f"Your account is temporarily blocked "
                f"({count} confirmed problems, limit {limit}). Contact the admins.")
    return None
