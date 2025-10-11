from sqlalchemy import func
from sqlmodel import Session, select
from ..services.inventory import create_purchase
from ..models import Purchase, PurchaseItem, Supplier

def create_purchase_tx(db: Session, supplier_id: int, items: list[dict]):
    return create_purchase(db, supplier_id, items)

def list_purchases(db: Session) -> list[dict]:
    """
    Returns rows shaped for PurchaseListOut:
    {id, supplier_id, supplier_name, total, created_at, item_count}
    """
    stmt = (
        select(
            Purchase.id,
            Purchase.supplier_id,
            Supplier.name.label("supplier_name"),
            Purchase.total,
            Purchase.created_at,
            func.count(PurchaseItem.id).label("item_count"),
        )
        .join(Supplier, Supplier.id == Purchase.supplier_id)
        .outerjoin(PurchaseItem, PurchaseItem.purchase_id == Purchase.id)
        .group_by(Purchase.id, Supplier.name)
        .order_by(Purchase.created_at.desc())
        .limit(100)
    )
    rows = db.exec(stmt).all()
    return [
        {
            "id": r.id,
            "supplier_id": r.supplier_id,
            "supplier_name": r.supplier_name,
            "total": float(r.total or 0),
            "created_at": r.created_at.isoformat(),
            "item_count": int(r.item_count or 0),
        }
        for r in rows
    ]
