from datetime import date, datetime
from enum import Enum
from typing import List, Optional

from sqlmodel import Field, Relationship, SQLModel


class PaymentMethod(str, Enum):
    cash = "cash"
    credit = "credit"


class Product(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    sku: str = Field(index=True, unique=True)
    unit: str = "unit"
    price: float
    cost_price: float
    stock_qty: float = 0
    reorder_level: float = 5

    purchase_items: List["PurchaseItem"] = Relationship(back_populates="product")
    sale_items: List["SaleItem"] = Relationship(back_populates="product")


class Supplier(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    phone: Optional[str] = None
    purchases: List["Purchase"] = Relationship(back_populates="supplier")


class Employee(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    phone: Optional[str] = None
    sales: List["Sale"] = Relationship(back_populates="employee")
    credit_txns: List["CreditTransaction"] = Relationship(back_populates="employee")


class Purchase(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    supplier_id: int = Field(foreign_key="supplier.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    total: float = 0

    supplier: Optional[Supplier] = Relationship(back_populates="purchases")
    items: List["PurchaseItem"] = Relationship(back_populates="purchase")


class PurchaseItem(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    purchase_id: int = Field(foreign_key="purchase.id")
    product_id: int = Field(foreign_key="product.id")
    qty: float
    unit_cost: float
    subtotal: float

    purchase: Optional[Purchase] = Relationship(back_populates="items")
    product: Optional[Product] = Relationship(back_populates="purchase_items")


class Sale(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    employee_id: Optional[int] = Field(default=None, foreign_key="employee.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    total: float = 0
    payment_method: PaymentMethod
    due_date: Optional[date] = None

    employee: Optional[Employee] = Relationship(back_populates="sales")
    items: List["SaleItem"] = Relationship(back_populates="sale")


class SaleItem(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    sale_id: int = Field(foreign_key="sale.id")
    product_id: int = Field(foreign_key="product.id")
    qty: float
    unit_price: float
    subtotal: float

    sale: Optional[Sale] = Relationship(back_populates="items")
    product: Optional[Product] = Relationship(back_populates="sale_items")


class CreditType(str, Enum):
    charge = "charge"
    payment = "payment"


class CreditTransaction(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    employee_id: int = Field(foreign_key="employee.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    type: CreditType
    amount: float
    sale_id: Optional[int] = Field(default=None, foreign_key="sale.id")
    note: Optional[str] = None

    employee: Optional[Employee] = Relationship(back_populates="credit_txns")
