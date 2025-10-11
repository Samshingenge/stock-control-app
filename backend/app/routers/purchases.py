from fastapi import APIRouter, Depends
from sqlmodel import Session

from .. import schemas
from ..crud.purchases import create_purchase_tx, list_purchases as list_purchases_crud
from ..deps import get_db

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
