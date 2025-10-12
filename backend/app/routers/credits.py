# backend/app/routers/credits.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select, func

from ..deps import get_db
from ..schemas import CreditPaymentIn, CreditSummary
from ..models import CreditTransaction, CreditType
from ..crud import credits as crud  # <- import your credits CRUD helpers

router = APIRouter(prefix="/credits", tags=["credits"])


@router.get("/summary", response_model=list[CreditSummary])
def summary(db: Session = Depends(get_db)):
    data = crud.summary(db)
    # Clamp negative balances to 0.0 for display/business rule
    for d in data:
        try:
            d["balance"] = max(float(d.get("balance", 0.0)), 0.0)
        except Exception:
            d["balance"] = 0.0
    return [CreditSummary(**d) for d in data]


@router.get("/{employee_id}/balance", response_model=float)
def employee_balance(employee_id: int, db: Session = Depends(get_db)):
    # Same rule: never report negative (no outstanding)
    try:
        bal = float(crud.employee_balance(db, employee_id))
    except Exception:
        bal = 0.0
    return max(bal, 0.0)


# backend/app/routers/credits.py

@router.post("/{employee_id}/payments")
def add_payment(employee_id: int, payload: CreditPaymentIn, db: Session = Depends(get_db)):
    # Robust sum helper across SA versions and result shapes
    def sum_amount(emp_id: int, t_value: str) -> float:
        stmt = select(func.coalesce(func.sum(CreditTransaction.amount), 0.0)).where(
            CreditTransaction.employee_id == emp_id,
            # compare to the stored string value to avoid enum binding quirks
            CreditTransaction.type == t_value,
        )
        try:
            res = db.exec(stmt)
            row = res.first()
            # row may be a scalar, a Row, or a 1-tuple depending on SA/SQLModel
            if row is None:
                return 0.0
            if isinstance(row, tuple):
                return float(row[0] or 0.0)
            # Row or plain scalar
            try:
                # SQLAlchemy Row supports ._mapping / tuple-like access
                return float(row[0] if hasattr(row, "__getitem__") else (row or 0.0))
            except Exception:
                return float(row or 0.0)
        except Exception as e:
            # Last-resort guard: do not 500 on aggregation reads
            print(f"[credits.add_payment] sum_amount error: {e}")
            return 0.0

    total_charges = sum_amount(employee_id, CreditType.charge.value)
    total_payments = sum_amount(employee_id, CreditType.payment.value)
    outstanding = total_charges - total_payments

    if outstanding <= 0:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="No outstanding balance for this employee.",
        )
    if payload.amount > outstanding:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Payment exceeds outstanding balance. Remaining: {outstanding:.2f}",
        )

    txn = CreditTransaction(
        employee_id=employee_id,
        type=CreditType.payment,
        amount=payload.amount,
        note=payload.note,
    )
    db.add(txn)
    db.commit()
    db.refresh(txn)

    return {
        "id": txn.id,
        "applied": txn.amount,
        "remaining": round(outstanding - txn.amount, 2),
    }
