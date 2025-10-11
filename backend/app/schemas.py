from datetime import date, datetime
from typing import List, Optional

from pydantic import BaseModel, Field

from .models import CreditType, PaymentMethod


class ProductCreate(BaseModel):
    name: str
    sku: str
    unit: str = "unit"
    price: float
    cost_price: float
    stock_qty: float = 0
    reorder_level: float = 5


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    unit: Optional[str] = None
    price: Optional[float] = None
    cost_price: Optional[float] = None
    stock_qty: Optional[float] = None
    reorder_level: Optional[float] = None


class ProductOut(BaseModel):
    id: int
    name: str
    sku: str
    unit: str
    price: float
    cost_price: float
    stock_qty: float
    reorder_level: float

    class Config:
        from_attributes = True


class SupplierCreate(BaseModel):
    name: str
    phone: Optional[str] = None


class SupplierOut(BaseModel):
    id: int
    name: str
    phone: Optional[str] = None

    class Config:
        from_attributes = True


class EmployeeCreate(BaseModel):
    name: str
    phone: Optional[str] = None


class EmployeeOut(BaseModel):
    id: int
    name: str
    phone: Optional[str] = None

    class Config:
        from_attributes = True


class PurchaseItemIn(BaseModel):
    product_id: int
    qty: float
    unit_cost: float


class PurchaseCreate(BaseModel):
    supplier_id: int
    items: List[PurchaseItemIn]


class PurchaseOut(BaseModel):
    id: int
    total: float

    class Config:
        from_attributes = True


class PurchaseListOut(BaseModel):
    id: int
    supplier_id: int
    supplier_name: str
    total: float
    created_at: datetime
    item_count: int


class SaleItemIn(BaseModel):
    product_id: int
    qty: float
    unit_price: float


class SaleCreate(BaseModel):
    employee_id: Optional[int] = None
    payment_method: PaymentMethod
    items: List[SaleItemIn]
    due_date: Optional[date] = None


class SaleOut(BaseModel):
    id: int
    total: float

    class Config:
        from_attributes = True


class CreditPaymentIn(BaseModel):
    amount: float = Field(gt=0)
    note: Optional[str] = None


class CreditTxnOut(BaseModel):
    id: int
    type: CreditType
    amount: float

    class Config:
        from_attributes = True


class CreditSummary(BaseModel):
    employee_id: int
    employee_name: str
    balance: float


class DashboardSummary(BaseModel):
    total_products: int
    low_stock_count: int
    total_stock_value: float
    outstanding_credit: float
