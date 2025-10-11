from .conftest import client


def test_credit_charge_and_payment(client):
    client.post("/dev/seed")
    sale = {
        "employee_id": 1,
        "payment_method": "credit",
        "items": [
            {"product_id": 1, "qty": 2, "unit_price": 25.0},
        ],
    }
    r = client.post("/sales/", json=sale)
    assert r.status_code == 201

    bal = client.get("/credits/1/balance")
    assert bal.status_code == 200 and bal.json() == 50.0

    pay = client.post("/credits/1/payments", json={"amount": 20.0})
    assert pay.status_code == 201

    bal2 = client.get("/credits/1/balance")
    assert bal2.json() == 30.0
