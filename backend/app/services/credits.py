from typing import List

from sqlmodel import Session, select

from ..models import CreditTransaction, CreditType, Employee, Sale, SaleItem, Product
from ..utils import ensure


def record_credit_charge(db: Session, sale: Sale) -> None:
    ensure(sale.employee_id is not None, "Credit sale requires employee")
    txn = CreditTransaction(
        employee_id=sale.employee_id,
        type=CreditType.charge,
        amount=sale.total,
        sale_id=sale.id,
    )
    db.add(txn)
    db.commit()


def record_credit_payment(
    db: Session, employee_id: int, amount: float, note: str | None = None
) -> CreditTransaction:
    ensure(amount > 0, "Payment must be positive")
    employee = db.get(Employee, employee_id)
    ensure(employee is not None, "Employee not found")
    txn = CreditTransaction(
        employee_id=employee_id,
        type=CreditType.payment,
        amount=amount,
        note=note,
    )
    db.add(txn)
    db.commit()
    db.refresh(txn)
    return txn


def balance_for_employee(db: Session, employee_id: int) -> float:
    stmt = select(CreditTransaction).where(CreditTransaction.employee_id == employee_id)
    bal = 0.0
    for t in db.exec(stmt):
        bal += t.amount if t.type == CreditType.charge else -t.amount
    return round(bal, 2)


def outstanding_credit_sum(db: Session) -> float:
    stmt = select(CreditTransaction)
    per_emp: dict[int, float] = {}
    for t in db.exec(stmt):
        sgn = 1 if t.type == CreditType.charge else -1
        per_emp[t.employee_id] = round(
            per_emp.get(t.employee_id, 0) + sgn * t.amount, 2
        )
    total = sum(v for v in per_emp.values() if v > 0)
    return round(total, 2)


def credit_summary(db: Session) -> List[dict]:
    employees = db.exec(select(Employee)).all()
    out = []
    for e in employees:
        bal = balance_for_employee(db, e.id)  # type: ignore[arg-type]
        if bal != 0:
            # Get products purchased on credit by this employee
            products = []

            # First, let's get all credit charges for this employee
            credit_charges = db.exec(
                select(CreditTransaction).where(
                    CreditTransaction.employee_id == e.id,
                    CreditTransaction.type == CreditType.charge
                )
            ).all()

            for charge in credit_charges:
                if charge.sale_id:
                    # Join SaleItem with Product and Sale to get product details and purchase date
                    stmt = select(SaleItem, Product, Sale).where(
                        SaleItem.sale_id == charge.sale_id,
                        SaleItem.product_id == Product.id,
                        SaleItem.sale_id == Sale.id
                    )
                    results = db.exec(stmt).all()
                    for item, product, sale in results:
                        products.append({
                            "id": product.id,
                            "name": product.name,
                            "qty": item.qty,
                            "unit_price": item.unit_price,
                            "subtotal": item.subtotal,
                            "purchase_date": sale.created_at.isoformat()
                        })
                else:
                    # If no sale_id, this might be a manual credit charge
                    # Let's try to find sales for this employee that might not be linked
                    employee_sales = db.exec(
                        select(Sale).where(Sale.employee_id == e.id)
                    ).all()

                    for sale in employee_sales:
                        if sale.total > 0:  # This might be a credit sale
                            sale_items = db.exec(
                                select(SaleItem, Product, Sale).where(
                                    SaleItem.sale_id == sale.id,
                                    SaleItem.product_id == Product.id,
                                    SaleItem.sale_id == Sale.id
                                )
                            ).all()
                            for item, product, sale_info in sale_items:
                                products.append({
                                    "id": product.id,
                                    "name": product.name,
                                    "qty": item.qty,
                                    "unit_price": item.unit_price,
                                    "subtotal": item.subtotal,
                                    "purchase_date": sale_info.created_at.isoformat()
                                })

            out.append({
                "employee_id": e.id,
                "employee_name": e.name,
                "balance": bal,
                "products": products
            })
    out.sort(key=lambda x: -x["balance"])
    return out


def payment_history(db: Session) -> List[dict]:
    employees = db.exec(select(Employee)).all()
    out = []
    for e in employees:
        # Get all credit payments for this employee
        payments = db.exec(
            select(CreditTransaction).where(
                CreditTransaction.employee_id == e.id,
                CreditTransaction.type == CreditType.payment
            )
        ).all()

        if payments:
            total_paid = sum(p.amount for p in payments)
            # Get products purchased on credit by this employee (same as credit_summary)
            products = []

            credit_charges = db.exec(
                select(CreditTransaction).where(
                    CreditTransaction.employee_id == e.id,
                    CreditTransaction.type == CreditType.charge
                )
            ).all()

            for charge in credit_charges:
                if charge.sale_id:
                    stmt = select(SaleItem, Product, Sale).where(
                        SaleItem.sale_id == charge.sale_id,
                        SaleItem.product_id == Product.id,
                        SaleItem.sale_id == Sale.id
                    )
                    results = db.exec(stmt).all()
                    for item, product, sale in results:
                        products.append({
                            "id": product.id,
                            "name": product.name,
                            "qty": item.qty,
                            "unit_price": item.unit_price,
                            "subtotal": item.subtotal,
                            "purchase_date": sale.created_at.isoformat()
                        })

            out.append({
                "employee_id": e.id,
                "employee_name": e.name,
                "total_paid": total_paid,
                "products": products
            })
    out.sort(key=lambda x: -x["total_paid"])
    return out
