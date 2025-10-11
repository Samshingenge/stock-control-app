from fastapi import APIRouter, Depends
from sqlmodel import Session

from .. import schemas
from ..crud import suppliers as crud
from ..deps import get_db
from ..models import Supplier

router = APIRouter(prefix="/suppliers", tags=["suppliers"])


@router.get("/", response_model=list[schemas.SupplierOut])
def list_suppliers(db: Session = Depends(get_db)):
    return crud.list_suppliers(db)


@router.post("/", response_model=schemas.SupplierOut, status_code=201)
def create_supplier(payload: schemas.SupplierCreate, db: Session = Depends(get_db)):
    sup = Supplier(**payload.model_dump())
    return crud.create_supplier(db, sup)
