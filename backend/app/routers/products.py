# app/routers/products.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select, func

from ..deps import get_db
from .. import schemas
from ..models import Product, SaleItem, PurchaseItem
from app.db import SessionDep
from app.models import Product
from app.schemas import ProductOut, ProductUpdate

router = APIRouter(prefix="/products", tags=["products"])

@router.get("/", response_model=list[ProductOut])
def list_products(db: SessionDep):
    # Works with SQLModel 0.0.16+: exec(select(...)) returns an iterable
    return list(db.exec(select(Product)))

@router.post("/", response_model=schemas.ProductOut, status_code=201)
def create_product(payload: schemas.ProductCreate, db: Session = Depends(get_db)):
    p = Product(**payload.model_dump())
    db.add(p)
    db.commit()
    db.refresh(p)
    return schemas.ProductOut.model_validate(p)

@router.patch("/{product_id}", response_model=ProductOut)
def update_product(product_id: int, payload: ProductUpdate, db: SessionDep):
    prod = db.get(Product, product_id)
    if not prod:
        raise HTTPException(status_code=404, detail="Product not found")

    # Pydantic v2 uses model_dump; v1 uses dict
    try:
        data = payload.model_dump(exclude_unset=True)      # v2
    except AttributeError:                                 # v1
        data = payload.dict(exclude_unset=True)

    # Handle SKU change explicitly with uniqueness check
    if "sku" in data and data["sku"] is not None:
        new_sku = data["sku"].strip().upper()
        if new_sku != prod.sku:
            exists = db.exec(
                select(Product).where(Product.sku == new_sku, Product.id != product_id)
            ).first()
            if exists:
                raise HTTPException(status_code=409, detail="SKU already exists")
            prod.sku = new_sku
        # remove so we don't double-apply below
        del data["sku"]

    # Apply the rest of the fields
    for k, v in data.items():
        setattr(prod, k, v)

    try:
        db.add(prod)
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Constraint error while saving")
    db.refresh(prod)
    return prod

@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(product_id: int, db: SessionDep):
    prod = db.get(Product, product_id)
    if not prod:
        raise HTTPException(status_code=404, detail="Product not found")

    try:
        db.delete(prod)
        db.commit()
    except IntegrityError:
        db.rollback()
        # If your DB has FK constraints to purchases/sales, surface a clear message
        raise HTTPException(
            status_code=409,
            detail="Cannot delete: product is referenced by purchases or sales.",
        )
    return None