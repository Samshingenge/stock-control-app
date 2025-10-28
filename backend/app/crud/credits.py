from sqlmodel import Session

from ..services.credits import (
    balance_for_employee,
    credit_summary,
    record_credit_payment,
    payment_history,
)


def add_payment(db: Session, employee_id: int, amount: float, note: str | None = None):
    return record_credit_payment(db, employee_id, amount, note)


def employee_balance(db: Session, employee_id: int) -> float:
    return balance_for_employee(db, employee_id)


def summary(db: Session):
    return credit_summary(db)


def payment_history_crud(db: Session):
    return payment_history(db)
