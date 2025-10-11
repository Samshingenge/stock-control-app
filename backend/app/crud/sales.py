from sqlmodel import Session

from ..models import PaymentMethod
from ..services.credits import record_credit_charge
from ..services.inventory import create_sale


def create_sale_tx(
    db: Session,
    employee_id: int | None,
    payment_method: PaymentMethod,
    items: list[dict],
    due_date=None,
):
    sale = create_sale(db, employee_id, payment_method, items, due_date)
    if payment_method == PaymentMethod.credit:
        record_credit_charge(db, sale)
    return sale
