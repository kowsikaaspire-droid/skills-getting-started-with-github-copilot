from fastapi.testclient import TestClient
from copy import deepcopy
from urllib.parse import quote
import src.app as app_module

client = TestClient(app_module.app)

# Keep an original snapshot to restore between tests
ORIGINAL_ACTIVITIES = deepcopy(app_module.activities)

import pytest

@pytest.fixture(autouse=True)
def restore_activities():
    # Restore the global activities dict before each test to avoid cross-test contamination
    app_module.activities = deepcopy(ORIGINAL_ACTIVITIES)
    yield


def test_get_activities():
    r = client.get("/activities")
    assert r.status_code == 200
    data = r.json()
    assert "Chess Club" in data
    assert isinstance(data["Chess Club"]["participants"], list)


def test_signup_success():
    email = "newstudent@mergington.edu"
    activity = "Chess Club"
    path = f"/activities/{quote(activity)}/signup"
    r = client.post(path, params={"email": email})
    assert r.status_code == 200
    assert email in client.get("/activities").json()[activity]["participants"]


def test_signup_duplicate():
    email = "dupstudent@mergington.edu"
    activity = "Drama Club"
    path = f"/activities/{quote(activity)}/signup"
    r1 = client.post(path, params={"email": email})
    assert r1.status_code == 200
    r2 = client.post(path, params={"email": email})
    assert r2.status_code == 400


def test_signup_not_found():
    path = "/activities/Nonexistent/signup"
    r = client.post(path, params={"email": "a@b.com"})
    assert r.status_code == 404
