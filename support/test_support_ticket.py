import requests

# Your Django base URL
BASE_URL = "http://127.0.0.1:8000"
LOGIN_URL = f"{BASE_URL}/registration/auth/login/"

# Replace with actual test user credentials
credentials = {
    'email': 'ngo2@test2.com',
    'password': 'test@ngo'
}

# Create a session to persist cookies (login session)
session = requests.Session()

# Send POST request to login
response = session.post(LOGIN_URL, data=credentials)

# Check if login is successful
if response.status_code == 200 and 'Set-Cookie' in response.headers:
    print("✅ Login successful!")
else:
    print(f"❌ Login failed ({response.status_code})")
    print(response.text)
