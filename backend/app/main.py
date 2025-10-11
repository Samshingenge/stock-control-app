# app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Import router objects directly to avoid name clashes
from app.routers.health import router as health_router
from app.routers.products import router as products_router
from app.routers.employees import router as employees_router
from app.routers.suppliers import router as suppliers_router
from app.routers.purchases import router as purchases_router
from app.routers.sales import router as sales_router
from app.routers.dashboard import router as dashboard_router
from app.routers.credits import router as credits_router
from app.db import init_db

app = FastAPI()

# CORS (adjust origins if needed)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def _startup() -> None:
    try:
        init_db()
    except Exception as e:
        print(f"Warning: Database initialization skipped: {e}")


@app.get("/health")
def health():
    return {"status": "ok"}

# Include routers (each router already defines its own prefix)
app.include_router(health_router)
app.include_router(products_router)
app.include_router(employees_router)
app.include_router(suppliers_router)
app.include_router(purchases_router)
app.include_router(sales_router)
app.include_router(dashboard_router)
app.include_router(credits_router)

# Dev seed — idempotent, compact, and fast
@app.post("/dev/seed")
async def seed():
    with Session(engine) as db:
        # Wipe in FK-safe order
        db.exec(delete(CreditTransaction))
        db.exec(delete(SaleItem))
        db.exec(delete(Sale))
        db.exec(delete(Product))
        db.exec(delete(Employee))
        db.exec(delete(Supplier))
        db.commit()

        # Suppliers
        s1 = Supplier(name="ABC Wholesale", phone="+264-61-000-000")
        s2 = Supplier(name="Namibia Foods Ltd", phone="+264-61-111-111")
        s3 = Supplier(name="Namib Mills", phone="+264-61-222-333")
        db.add_all([s1, s2, s3])

        # Employees
        e1 = Employee(name="Petrus Shilongo", phone="+264-81-123-4567")
        e2 = Employee(name="Maria Andreas",  phone="+264-81-234-5678")
        e3 = Employee(name="John Smith",     phone="+264-81-345-6789")
        db.add_all([e1, e2, e3])

        # Products
        products_data = [
            {"name": "Rice 1kg",            "sku": "RICE-1KG",   "unit": "bag",    "price": 35.0, "cost_price": 25.0, "stock_qty": 100, "reorder_level": 20},
            {"name": "Sugar 1kg",           "sku": "SUGAR-1KG",  "unit": "bag",    "price": 25.0, "cost_price": 18.0, "stock_qty": 75,  "reorder_level": 15},
            {"name": "Cooking Oil 2L",      "sku": "OIL-2L",     "unit": "bottle", "price": 45.0, "cost_price": 35.0, "stock_qty": 60,  "reorder_level": 12},
            {"name": "Flour 2kg",           "sku": "FLOUR-2KG",  "unit": "bag",    "price": 40.0, "cost_price": 30.0, "stock_qty": 5,   "reorder_level": 10},  # low
            {"name": "Salt 500g",           "sku": "SALT-500G",  "unit": "packet", "price": 12.0, "cost_price": 8.0,  "stock_qty": 3,   "reorder_level": 8},   # low
            {"name": "Tea Bags 100pk",      "sku": "TEA-100",    "unit": "pack",   "price": 55.0, "cost_price": 42.0, "stock_qty": 2,   "reorder_level": 6},   # low
            {"name": "Coffee 500g",         "sku": "COFFEE-500", "unit": "jar",    "price": 85.0, "cost_price": 65.0, "stock_qty": 1,   "reorder_level": 5},   # very low
            {"name": "Baking Powder 100g",  "sku": "BAKE-100",   "unit": "box",    "price": 18.0, "cost_price": 12.0, "stock_qty": 0,   "reorder_level": 3},   # out
        ]
        prods = [Product(**p) for p in products_data]
        db.add_all(prods)
        db.commit()
        for p in prods: db.refresh(p)
        db.refresh(e1); db.refresh(e2); db.refresh(e3)

        # Credit sales history (doesn't mutate stock in seed to keep low-stock demo values)
        sale1 = Sale(employee_id=e1.id, payment_method=PaymentMethod.credit, total=150.0, created_at=datetime.utcnow() - timedelta(days=7))
        db.add(sale1); db.commit(); db.refresh(sale1)
        db.add_all([
            SaleItem(sale_id=sale1.id, product_id=prods[3].id, qty=3, unit_price=40.0, subtotal=120.0),  # Flour
            SaleItem(sale_id=sale1.id, product_id=prods[4].id, qty=5, unit_price=6.0,  subtotal=30.0),   # Salt
        ])
        db.add(CreditTransaction(employee_id=e1.id, type=CreditType.charge,  amount=150.0, sale_id=sale1.id, created_at=datetime.utcnow() - timedelta(days=7)))

        sale2 = Sale(employee_id=e2.id, payment_method=PaymentMethod.credit, total=85.0, created_at=datetime.utcnow() - timedelta(days=3))
        db.add(sale2); db.commit(); db.refresh(sale2)
        db.add(SaleItem(sale_id=sale2.id, product_id=prods[6].id, qty=1, unit_price=85.0, subtotal=85.0))  # Coffee
        db.add(CreditTransaction(employee_id=e2.id, type=CreditType.charge,  amount=85.0,  sale_id=sale2.id, created_at=datetime.utcnow() - timedelta(days=3)))

        db.add(CreditTransaction(employee_id=e1.id, type=CreditType.payment, amount=100.0, note="Partial payment - still owes N$50", created_at=datetime.utcnow() - timedelta(days=2)))

        db.commit()

        return {
            "status": "seeded",
            "products_created": len(prods),
            "employees_created": 3,
            "suppliers_created": 3,
            "sales_created": 2,
            "credit_transactions": 3,
            "outstanding_credit": 135.0,
        }
