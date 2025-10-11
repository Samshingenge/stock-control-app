from typing import List

from sqlmodel import Session, select

from sqlalchemy import select
from ..models import Product, PurchaseItem, SaleItem

def delete_product(db: Session, pid: int) -> bool:
    prod = db.get(Product, pid)
    if not prod:
        return False

    # Safety: block delete if stock remains
    if (prod.stock_qty or 0) != 0:
        raise ValueError("Cannot delete: product has non-zero stock.")

    # Safety: block delete if it was ever used in purchases or sales
    used_in_purchase = db.exec(select(PurchaseItem.id).where(PurchaseItem.product_id == pid).limit(1)).first()
    used_in_sale = db.exec(select(SaleItem.id).where(SaleItem.product_id == pid).limit(1)).first()
    if used_in_purchase or used_in_sale:
        raise ValueError("Cannot delete: product has transaction history.")

    db.delete(prod)
    db.commit()
    return True



def list_products(db: Session) -> List[Product]:
    res = db.exec(select(Product).order_by(Product.name.asc()))
    rows = res.all()
    # Older SQLModel/SQLAlchemy can return rows as tuples like (Product,)
    if rows and isinstance(rows[0], tuple):
        rows = [r[0] for r in rows]
    return rows


def create_product(db: Session, p: Product) -> Product:
    db.add(p)
    db.commit()
    db.refresh(p)
    return p


def update_product(db: Session, pid: int, **kwargs) -> Product | None:
    prod = db.get(Product, pid)
    if not prod:
        return None
    for k, v in kwargs.items():
        if v is not None:
            setattr(prod, k, v)
    db.add(prod)
    db.commit()
    db.refresh(prod)
    return prod
