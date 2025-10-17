from sqlalchemy import func
from sqlmodel import Session, select
from ..services.inventory import create_purchase
from ..models import Purchase, PurchaseItem, Supplier, Product

def create_purchase_tx(db: Session, supplier_id: int, items: list[dict]):
    return create_purchase(db, supplier_id, items)

def list_purchases(db: Session) -> list[dict]:
    """
    Returns rows shaped for PurchaseListOut:
    {id, supplier_id, supplier_name, total, created_at, item_count, products}
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

    # Get product information for each purchase
    result = []
    for r in rows:
        # Get products for this purchase
        products = []
        if r.item_count > 0:
            product_stmt = (
                select(Product.name, PurchaseItem.qty, PurchaseItem.unit_cost, PurchaseItem.subtotal)
                .join(PurchaseItem, PurchaseItem.product_id == Product.id)
                .where(PurchaseItem.purchase_id == r.id)
            )
            product_rows = db.exec(product_stmt).all()
            for product_row in product_rows:
                products.append({
                    "name": product_row.name,
                    "qty": float(product_row.qty or 0),
                    "unit_cost": float(product_row.unit_cost or 0),
                    "subtotal": float(product_row.subtotal or 0)
                })

        result.append({
            "id": r.id,
            "supplier_id": r.supplier_id,
            "supplier_name": r.supplier_name,
            "total": float(r.total or 0),
            "created_at": r.created_at.isoformat(),
            "item_count": int(r.item_count or 0),
            "products": products,
        })

    return result
