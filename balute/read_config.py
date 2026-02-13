import json
try:
    with open('firebase_config.json', 'r', encoding='utf-16') as f:
        data = json.load(f)
        inner = json.loads(data['result']['fileContents'])
        for k, v in inner.items():
            print(f"{k}={v}")
except Exception as e:
    print(f"Error: {e}")
