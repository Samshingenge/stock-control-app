from fastapi import APIRouter, Depends
from sqlmodel import Session

from .. import schemas
from ..crud import employees as crud
from ..deps import get_db
from ..models import Employee

router = APIRouter(prefix="/employees", tags=["employees"])


@router.get("/", response_model=list[schemas.EmployeeOut])
def list_employees(db: Session = Depends(get_db)):
    return crud.list_employees(db)


@router.post("/", response_model=schemas.EmployeeOut, status_code=201)
def create_employee(payload: schemas.EmployeeCreate, db: Session = Depends(get_db)):
    emp = Employee(**payload.model_dump())
    return crud.create_employee(db, emp)
