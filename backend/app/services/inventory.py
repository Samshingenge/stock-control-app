from typing import List
from collections import defaultdict
from sqlmodel import Session, select

from ..models import PaymentMethod, Product, Purchase, PurchaseItem, Sale, SaleItem
from ..utils import ensure


def create_purchase(db: Session, supplier_id: int, items: List[dict]) -> Purchase:
    ensure(len(items) > 0, "No items provided")
    purchase = Purchase(supplier_id=supplier_id, total=0)
    db.add(purchase)
    total = 0.0
    for it in items:
        product = db.get(Product, it["product_id"])  # type: ignore[arg-type]
        ensure(product is not None, f"Product {it['product_id']} not found")
        qty = float(it["qty"])
        unit_cost = float(it["unit_cost"])
        subtotal = qty * unit_cost
        pi = PurchaseItem(
            purchase=purchase,
            product=product,
            qty=qty,
            unit_cost=unit_cost,
            subtotal=subtotal,
        )
        db.add(pi)
        product.stock_qty += qty
        total += subtotal
    purchase.total = round(total, 2)
    db.commit()
    db.refresh(purchase)
    return purchase


def create_sale(
    db: Session,
    employee_id: int | None,
    payment_method: PaymentMethod,
    items: List[dict],
    due_date=None,
) -> Sale:
    ensure(len(items) > 0, "No items provided")
    sale = Sale(
        employee_id=employee_id,
        payment_method=payment_method,
        total=0,
        due_date=due_date,
    )
    db.add(sale)
    total = 0.0
    for it in items:
        product = db.get(Product, it["product_id"])  # type: ignore[arg-type]
        ensure(product is not None, f"Product {it['product_id']} not found")
        qty = float(it["qty"])
        unit_price = float(it["unit_price"])
        subtotal = qty * unit_price
        ensure(product.stock_qty - qty >= 0, f"Insufficient stock for {product.name}")
        si = SaleItem(
            sale=sale,
            product=product,
            qty=qty,
            unit_price=unit_price,
            subtotal=subtotal,
        )
        db.add(si)
        product.stock_qty -= qty
        total += subtotal
    sale.total = round(total, 2)
    db.commit()
    db.refresh(sale)
    return sale


def low_stock(db: Session, limit: int = 10) -> List[Product]:
    stmt = (
        select(Product)
        .where(Product.stock_qty <= Product.reorder_level)
        .order_by(Product.stock_qty.asc())
        .limit(limit)
    )
    rows = db.exec(stmt).all()
    if rows and isinstance(rows[0], tuple):
        rows = [r[0] for r in rows]
    return rows

def total_stock_value(db: Session) -> float:
    rows = db.exec(select(Product)).all()
    if rows and isinstance(rows[0], tuple):
        rows = [r[0] for r in rows]
    value = 0.0
    for p in rows:
        value += (p.cost_price or 0) * (p.stock_qty or 0)
    return round(value, 2)

# Purchases Services – implement cancel and update

def cancel_purchase(db: Session, purchase_id: int) -> bool:
    p = db.get(Purchase, purchase_id)
    if not p:
        return False
    items = db.exec(select(PurchaseItem).where(PurchaseItem.purchase_id == purchase_id)).all()

    # make sure rolling back won't send stock negative
    for it in items:
        prod = db.get(Product, it.product_id)
        ensure(prod is not None, "Product missing")
        ensure((prod.stock_qty or 0) - it.qty >= 0,
               f"Cannot cancel: {prod.name} stock would go negative")

    # apply rollback
    for it in items:
        prod = db.get(Product, it.product_id)
        prod.stock_qty -= it.qty
        db.add(prod)
        db.delete(it)

    db.delete(p)
    db.commit()
    return True

def update_purchase(db: Session, purchase_id: int, supplier_id: int | None,
                    items: list[dict] | None) -> Purchase:
    p = db.get(Purchase, purchase_id)
    ensure(p is not None, "Purchase not found")
    if supplier_id is not None:
        p.supplier_id = supplier_id

    if items is not None:
        # current totals by product
        current = defaultdict(lambda: {"qty": 0.0})
        cur_items = db.exec(select(PurchaseItem).where(PurchaseItem.purchase_id == purchase_id)).all()
        for it in cur_items:
            current[it.product_id]["qty"] += float(it.qty)

        # desired totals by product
        desired = defaultdict(lambda: {"qty": 0.0})
        for it in items:
            desired[int(it["product_id"])]["qty"] += float(it["qty"])

        # adjust stock by delta (desired - current)
        for pid in set(current.keys()) | set(desired.keys()):
            old = current[pid]["qty"]
            new = desired[pid]["qty"]
            delta = new - old
            prod = db.get(Product, pid)
            ensure(prod is not None, "Product missing")
            ensure((prod.stock_qty or 0) + delta >= 0,
                   f"Adjusting purchase would send {prod.name} stock negative")
            prod.stock_qty += delta
            db.add(prod)

        # replace items
        for it in cur_items:
            db.delete(it)
        total = 0.0
        for it in items:
            prod = db.get(Product, int(it["product_id"]))
            qty = float(it["qty"]); unit_cost = float(it["unit_cost"])
            subtotal = qty * unit_cost
            db.add(PurchaseItem(purchase=p, product=prod, qty=qty, unit_cost=unit_cost, subtotal=subtotal))
            total += subtotal
        p.total = round(total, 2)

    db.add(p); db.commit(); db.refresh(p)
    return p