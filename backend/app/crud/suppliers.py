from typing import List

from sqlmodel import Session, select

from ..models import Supplier


def list_suppliers(db: Session) -> List[Supplier]:
    return list(db.exec(select(Supplier).order_by(Supplier.name.asc())))


def create_supplier(db: Session, s: Supplier) -> Supplier:
    db.add(s)
    db.commit()
    db.refresh(s)
    return s
