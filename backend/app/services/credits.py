from typing import List

from sqlmodel import Session, select

from ..models import CreditTransaction, CreditType, Employee, Sale
from ..utils import ensure


def record_credit_charge(db: Session, sale: Sale) -> None:
    ensure(sale.employee_id is not None, "Credit sale requires employee")
    txn = CreditTransaction(
        employee_id=sale.employee_id,
        type=CreditType.charge,
        amount=sale.total,
        sale_id=sale.id,
    )
    db.add(txn)
    db.commit()


def record_credit_payment(
    db: Session, employee_id: int, amount: float, note: str | None = None
) -> CreditTransaction:
    ensure(amount > 0, "Payment must be positive")
    employee = db.get(Employee, employee_id)
    ensure(employee is not None, "Employee not found")
    txn = CreditTransaction(
        employee_id=employee_id,
        type=CreditType.payment,
        amount=amount,
        note=note,
    )
    db.add(txn)
    db.commit()
    db.refresh(txn)
    return txn


def balance_for_employee(db: Session, employee_id: int) -> float:
    stmt = select(CreditTransaction).where(CreditTransaction.employee_id == employee_id)
    bal = 0.0
    for t in db.exec(stmt):
        bal += t.amount if t.type == CreditType.charge else -t.amount
    return round(bal, 2)


def outstanding_credit_sum(db: Session) -> float:
    stmt = select(CreditTransaction)
    per_emp: dict[int, float] = {}
    for t in db.exec(stmt):
        sgn = 1 if t.type == CreditType.charge else -1
        per_emp[t.employee_id] = round(
            per_emp.get(t.employee_id, 0) + sgn * t.amount, 2
        )
    total = sum(v for v in per_emp.values() if v > 0)
    return round(total, 2)


def credit_summary(db: Session) -> List[dict]:
    employees = db.exec(select(Employee)).all()
    out = []
    for e in employees:
        bal = balance_for_employee(db, e.id)  # type: ignore[arg-type]
        if bal != 0:
            out.append(
                {"employee_id": e.id, "employee_name": e.name, "balance": bal}
            )
    out.sort(key=lambda x: -x["balance"])
    return out
