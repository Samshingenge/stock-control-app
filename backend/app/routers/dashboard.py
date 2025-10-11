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

    return {
        "total_products": total_products,
        "total_stock_value": total_stock_value,
        "low_stock": low_stock,
    }
