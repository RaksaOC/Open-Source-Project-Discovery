from fastapi.testclient import TestClient

from discovery.api.app import create_app

client = TestClient(create_app())


def test_health():
    res = client.get("/api/health")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"


def test_methods():
    assert client.get("/api/methods").json()["default"] == "bm25"


def test_search_is_501_until_built():
    assert client.get("/api/search", params={"q": "inventory nestjs"}).status_code == 501
