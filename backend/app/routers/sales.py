from fastapi import APIRouter, Depends
from sqlmodel import Session

from .. import schemas
from ..crud.sales import create_sale_tx
from ..deps import get_db

router = APIRouter(prefix="/sales", tags=["sales"])


@router.post("/", response_model=schemas.SaleOut, status_code=201)
def create_sale(payload: schemas.SaleCreate, db: Session = Depends(get_db)):
    sale = create_sale_tx(
        db,
        payload.employee_id,
        payload.payment_method,
        [i.model_dump() for i in payload.items],
        payload.due_date,
    )
    return schemas.SaleOut.model_validate(sale)
