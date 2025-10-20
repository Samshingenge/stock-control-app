from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from .. import schemas
from ..crud.purchases import create_purchase_tx, list_purchases as list_purchases_crud
from ..deps import get_db

from ..models import Purchase, PurchaseItem, Product, Supplier
from ..services.inventory import create_purchase as create_purchase_svc
from ..services.inventory import cancel_purchase as cancel_purchase_svc
from ..services.inventory import update_purchase as update_purchase_svc

router = APIRouter(prefix="/purchases", tags=["purchases"])


@router.get("/", response_model=list[schemas.PurchaseListOut])
def list_purchases(db: Session = Depends(get_db)):
    data = list_purchases_crud(db)
    return [schemas.PurchaseListOut(**row) for row in data]


@router.post("/", response_model=schemas.PurchaseOut, status_code=201)
def create_purchase(payload: schemas.PurchaseCreate, db: Session = Depends(get_db)):
    p = create_purchase_tx(
        db, payload.supplier_id, [i.model_dump() for i in payload.items]
    )
    return schemas.PurchaseOut.model_validate(p)

    # Add edit and cancel Purchases
@router.post("/", response_model=schemas.PurchaseOut, status_code=201)
def create_purchase(payload: schemas.PurchaseCreate, db: Session = Depends(get_db)):
    p = create_purchase_svc(db, payload.supplier_id, [i.model_dump() for i in payload.items])
    return schemas.PurchaseOut.model_validate(p)

@router.get("/{purchase_id}", response_model=schemas.PurchaseDetailOut)
def get_purchase(purchase_id: int, db: Session = Depends(get_db)):
    p = db.get(Purchase, purchase_id)
    if not p:
        raise HTTPException(status_code=404, detail="Purchase not found")
    items = db.exec(select(PurchaseItem, Product.name)
                    .join(Product, Product.id == PurchaseItem.product_id)
                    .where(PurchaseItem.purchase_id == purchase_id)).all()
    return schemas.PurchaseDetailOut(
        id=p.id,
        supplier_id=p.supplier_id,
        supplier_name=db.get(Supplier, p.supplier_id).name if p.supplier_id else "",
        total=p.total,
        created_at=p.created_at,
        items=[
            schemas.PurchaseItemOut(
                product_id=pi.product_id,
                product_name=prod_name,
                qty=pi.qty,
                unit_cost=pi.unit_cost,
                subtotal=pi.subtotal,
            )
            for (pi, prod_name) in items
        ],
    )

@router.patch("/{purchase_id}", response_model=schemas.PurchaseOut)
def update_purchase(purchase_id: int, payload: schemas.PurchaseUpdate, db: Session = Depends(get_db)):
    p = update_purchase_svc(
        db,
        purchase_id,
        payload.supplier_id,
        None if payload.items is None else [i.model_dump() for i in payload.items],
    )
    return schemas.PurchaseOut.model_validate(p)

@router.delete("/{purchase_id}", status_code=status.HTTP_204_NO_CONTENT)
def cancel_purchase(purchase_id: int, db: Session = Depends(get_db)):
    ok = cancel_purchase_svc(db, purchase_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Purchase not found")
    return None
