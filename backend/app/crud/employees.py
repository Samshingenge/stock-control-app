from typing import List
from sqlmodel import Session, select
from ..models import Employee, Sale, CreditTransaction


def list_employees(db: Session) -> List[Employee]:
    return list(db.exec(select(Employee).order_by(Employee.name.asc())))


def create_employee(db: Session, e: Employee) -> Employee:
    db.add(e)
    db.commit()
    db.refresh(e)
    return e


def update_employee(db: Session, eid: int, **fields) -> Employee | None:
    emp = db.get(Employee, eid)
    if not emp:
        return None
    for k, v in fields.items():
        if v is not None:
            setattr(emp, k, v)
    db.add(emp)
    db.commit()
    db.refresh(emp)
    return emp


def delete_employee(db: Session, eid: int) -> bool:
    emp = db.get(Employee, eid)
    if not emp:
        return False
    # Safety: block delete if the employee has sales or credit transactions
    has_sale = db.exec(select(Sale.id).where(Sale.employee_id == eid).limit(1)).first()
    has_credit = db.exec(select(CreditTransaction.id).where(CreditTransaction.employee_id == eid).limit(1)).first()
    if has_sale or has_credit:
        raise ValueError("Cannot delete: employee has transaction history.")
    db.delete(emp)
    db.commit()
    return True