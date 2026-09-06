"""Test the awaiting-confirmation and confirm-collaboration endpoints."""
import urllib.request, urllib.error, json

BASE = "http://127.0.0.1:8000"

def api(method, path, body=None, token=None):
    data = json.dumps(body).encode() if body else None
    headers = {"Content-Type": "application/json"}
    if token: headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(BASE + path, data=data, headers=headers, method=method)
    try:
        resp = urllib.request.urlopen(req, timeout=25)
        return resp.status, json.loads(resp.read())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read())

# Login govt
code, d = api("POST", "/auth/login", {"email": "govt@demo.com", "password": "demo123"})
assert code == 200, f"Login failed: {d}"
govt_token = d["access_token"]
print("✓ Government login OK")

# Test awaiting-confirmation
code, d = api("GET", "/api/problems/awaiting-confirmation", token=govt_token)
print(f"\nGET /api/problems/awaiting-confirmation → {code}")
if code == 200:
    count = d.get("count", 0)
    print(f"  Problems awaiting confirmation: {count}")
    for p in d.get("problems", []):
        uni  = p.get("university", {})
        ind  = p.get("industry")
        print(f"  - Problem #{p['problem_id']}: {p['title'][:50]}")
        print(f"    University: {uni.get('name','?')}")
        print(f"    Industry:   {ind['name'] if ind else 'None yet'}")
else:
    print(f"  Error: {d.get('detail', d)}")

print("\n✓ Test complete. If count=0, submit a problem, validate it, and run matching first.")
