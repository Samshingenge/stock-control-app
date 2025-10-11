from typing import List

from sqlmodel import Session, select

from ..models import Employee


def list_employees(db: Session) -> List[Employee]:
    return list(db.exec(select(Employee).order_by(Employee.name.asc())))


def create_employee(db: Session, e: Employee) -> Employee:
    db.add(e)
    db.commit()
    db.refresh(e)
    return e
