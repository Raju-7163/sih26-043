import urllib.request, json

# Test 1: /auth/demo
req = urllib.request.Request('http://127.0.0.1:8000/auth/demo')
resp = urllib.request.urlopen(req)
data = json.loads(resp.read())
print("1. /auth/demo OK —", len(data['accounts']), "accounts")

# Test 2: login each demo account
for acc in data['accounts']:
    body = json.dumps({'email': acc['email'], 'password': 'demo123'}).encode()
    req2 = urllib.request.Request(
        'http://127.0.0.1:8000/auth/login',
        data=body,
        headers={'Content-Type': 'application/json'},
        method='POST'
    )
    resp2 = urllib.request.urlopen(req2)
    r = json.loads(resp2.read())
    print("2. Login OK:", acc['email'], "->", r['user']['role'])

print("\nAll tests passed. Login is working correctly.")
