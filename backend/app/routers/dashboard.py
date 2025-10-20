# app/routers/dashboard.py
from fastapi import APIRouter
from sqlmodel import select
from app.db import SessionDep
from app.models import Product  # adjust import path if your Product lives elsewhere

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

@router.get("/summary")
def summary(db: SessionDep):
    # No .scalars(): SQLModel's Session.exec(select(Model)) already returns a ScalarResult of Model
    products = db.exec(select(Product)).all()

    total_products = len(products)
    total_stock_value = sum((p.stock_qty or 0) * (p.cost_price or 0) for p in products)
    low_stock = sum(1 for p in products if (p.stock_qty or 0) <= (p.reorder_level or 0))

    # Get top sold products from sales data
    from app.models import SaleItem, Sale
    from sqlmodel import func

    # Get product sales aggregated by product
    sales_query = db.exec(
        select(
            Product.name,
            func.sum(SaleItem.qty).label('total_sold')
        )
        .join(SaleItem, Product.id == SaleItem.product_id)
        .join(Sale, SaleItem.sale_id == Sale.id)
        .where(Sale.payment_method == "cash")  # Only count actual sales, not credit
        .group_by(Product.id, Product.name)
        .order_by(func.sum(SaleItem.qty).desc())
    )

    top_sold_products = []
    for row in sales_query:
        top_sold_products.append({
            "name": row.name,
            "total_sold": float(row.total_sold) if row.total_sold else 0
        })

    return {
        "total_products": total_products,
        "total_stock_value": total_stock_value,
        "low_stock": low_stock,
        "top_sold_products": top_sold_products[:5],  # Top 5 products
    }
