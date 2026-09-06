"""Test the university and industry inbox endpoints end-to-end."""
import urllib.request, urllib.error, json

BASE = "http://127.0.0.1:8000"

def api(method, path, body=None, token=None):
    data = json.dumps(body).encode() if body else None
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(
        BASE + path, data=data, headers=headers, method=method
    )
    try:
        resp = urllib.request.urlopen(req)
        return resp.status, json.loads(resp.read())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read())

# 1. Login all accounts
print("=" * 60)
print("1. LOGIN ALL ACCOUNTS")
print("=" * 60)
tokens = {}
for email, role in [
    ("citizen@demo.com",  "citizen"),
    ("govt@demo.com",     "government"),
    ("uni@demo.com",      "university"),
    ("industry@demo.com", "industry"),
]:
    code, data = api("POST", "/auth/login", {"email": email, "password": "demo123"})
    if code == 200:
        tokens[role] = data["access_token"]
        print(f"  OK  {email} -> role={data['user']['role']} org_id={data['user']['org_id']}")
    else:
        print(f"  FAIL {email}: {code} {data}")

print()

# 2. Test university inbox
print("=" * 60)
print("2. UNIVERSITY INBOX (/api/problems/inbox/university)")
print("=" * 60)
code, data = api("GET", "/api/problems/inbox/university", token=tokens.get("university"))
print(f"  Status: {code}")
if code == 200:
    problems = data.get("problems", [])
    print(f"  Problems in inbox: {len(problems)}")
    for p in problems:
        print(f"    - [{p.get('match_status','?')}] {p.get('title','?')[:50]}")
    if not problems:
        print("  (No matched problems yet — submit and validate a problem first)")
else:
    print(f"  Error: {data.get('detail', data)}")

print()

# 3. Test industry inbox
print("=" * 60)
print("3. INDUSTRY INBOX (/api/problems/inbox/industry)")
print("=" * 60)
code, data = api("GET", "/api/problems/inbox/industry", token=tokens.get("industry"))
print(f"  Status: {code}")
if code == 200:
    problems = data.get("problems", [])
    print(f"  Problems in inbox: {len(problems)}")
    for p in problems:
        print(f"    - [{p.get('match_status','?')}] {p.get('title','?')[:50]}")
    if not problems:
        print("  (No matched problems yet — submit, validate, and generate matches first)")
else:
    print(f"  Error: {data.get('detail', data)}")

print()

# 4. Test public GET /api/problems (no token needed now)
print("=" * 60)
print("4. PUBLIC PROBLEM LIST (no auth)")
print("=" * 60)
code, data = api("GET", "/api/problems")
print(f"  Status: {code}")
if code == 200:
    print(f"  Problems returned: {len(data)}")
else:
    print(f"  Error: {data}")

print()
print("=" * 60)
print("DONE")
print("=" * 60)
