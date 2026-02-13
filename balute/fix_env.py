content = """REACT_APP_FIREBASE_API_KEY=AIzaSyBGbT5XbIkjfR_UYdydy-kpEqTtuytfkBg
REACT_APP_FIREBASE_AUTH_DOMAIN=balute-37f93.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=balute-37f93
REACT_APP_FIREBASE_STORAGE_BUCKET=balute-37f93.firebasestorage.app
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=348351498106
REACT_APP_FIREBASE_APP_ID=1:348351498106:web:8bfbc8466267e4d146b8c3
"""
try:
    with open('.env', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Successfully wrote .env in UTF-8")
except Exception as e:
    print(f"Error: {e}")
