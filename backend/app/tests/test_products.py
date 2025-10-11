from .conftest import client


def test_create_and_list_products(client):
    payload = {
        "name": "Salt 500g",
        "sku": "SALT-500G",
        "unit": "bag",
        "price": 12.5,
        "cost_price": 8.0,
        "stock_qty": 10,
        "reorder_level": 3,
    }
    r = client.post("/products/", json=payload)
    assert r.status_code == 201

    r2 = client.get("/products/")
    assert r2.status_code == 200
    assert any(x["sku"] == "SALT-500G" for x in r2.json())
