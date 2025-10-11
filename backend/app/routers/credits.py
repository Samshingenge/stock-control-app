from fastapi import APIRouter, Depends
from sqlmodel import Session

from .. import schemas
from ..crud import credits as crud
from ..deps import get_db

router = APIRouter(prefix="/credits", tags=["credits"])


@router.get("/summary", response_model=list[schemas.CreditSummary])
def summary(db: Session = Depends(get_db)):
    data = crud.summary(db)
    return [schemas.CreditSummary(**d) for d in data]


@router.get("/{employee_id}/balance", response_model=float)
def employee_balance(employee_id: int, db: Session = Depends(get_db)):
    return crud.employee_balance(db, employee_id)


@router.post("/{employee_id}/payments", response_model=schemas.CreditTxnOut, status_code=201)
def add_payment(
    employee_id: int, payload: schemas.CreditPaymentIn, db: Session = Depends(get_db)
):
    txn = crud.add_payment(db, employee_id, payload.amount, payload.note)
    return schemas.CreditTxnOut.model_validate(txn)
