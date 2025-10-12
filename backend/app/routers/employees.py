from fastapi import APIRouter, Depends, HTTPException, status
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


@router.patch("/{employee_id}", response_model=schemas.EmployeeOut)
def update_employee(employee_id: int, payload: schemas.EmployeeUpdate, db: Session = Depends(get_db)):
    data = payload.model_dump(exclude_unset=True) if hasattr(payload, "model_dump") else payload.dict(exclude_unset=True)
    emp = crud.update_employee(db, employee_id, **data)
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    return schemas.EmployeeOut.model_validate(emp)


@router.delete("/{employee_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_employee(employee_id: int, db: Session = Depends(get_db)):
    try:
        ok = crud.delete_employee(db, employee_id)
    except ValueError as e:
        raise HTTPException(status_code=409, detail=str(e))
    if not ok:
        raise HTTPException(status_code=404, detail="Employee not found")
    return None