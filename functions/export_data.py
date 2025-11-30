import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore
import json
import os
import datetime

# Helper to serialize dates
def json_serial(obj):
    """JSON serializer for objects not serializable by default json code"""
    if isinstance(obj, (datetime.datetime, datetime.date)):
        return obj.isoformat()
    return str(obj)

def export_data():
    print("Iniciando exportación de datos...")

    # Initialize Firebase Admin
    try:
        # 1. Try to use serviceAccountKey.json if it exists (Easiest for users without gcloud)
        cred_path = 'serviceAccountKey.json'
        if os.path.exists(cred_path):
            print(f"🔑 Usando credenciales locales: {cred_path}")
            cred = credentials.Certificate(cred_path)
            if not firebase_admin._apps:
                firebase_admin.initialize_app(cred)
        # 2. Fallback to default credentials (gcloud auth / Emulator)
        elif not firebase_admin._apps:
            print("☁️  Intentando usar credenciales por defecto (Google Cloud / Emulador)...")
            firebase_admin.initialize_app()
            
    except Exception as e:
        print(f"❌ Error inicializando Firebase: {e}")
        print("TIP: Descarga tu 'Service Account Key' de la consola de Firebase y guárdala como 'serviceAccountKey.json' en esta carpeta.")
        return

    db = firestore.client()
    
    export_data = {
        "generated_at": datetime.datetime.now().isoformat(),
        "users": {},
        "viewers": [],
        "adminEmails": []
    }

    # 1. Export Admin Emails
    print("Exportando Admin Emails...")
    admin_docs = db.collection('adminEmails').stream()
    for doc in admin_docs:
        export_data["adminEmails"].append({"id": doc.id, **doc.to_dict()})

    # 2. Export Viewers
    print("Exportando Viewers...")
    viewer_docs = db.collection('viewers').stream()
    for doc in viewer_docs:
        export_data["viewers"].append({"id": doc.id, **doc.to_dict()})

    # 3. Export Users and their subcollections
    print("Exportando Usuarios y sus transacciones...")
    user_docs = db.collection('users').stream()
    for user_doc in user_docs:
        user_id = user_doc.id
        user_data = user_doc.to_dict()
        
        # Fetch Categories
        categories = []
        cat_docs = db.collection('users').document(user_id).collection('categories').stream()
        for cat in cat_docs:
            categories.append({"id": cat.id, **cat.to_dict()})
            
        # Fetch Transactions
        transactions = []
        trans_docs = db.collection('users').document(user_id).collection('transactions').stream()
        for trans in trans_docs:
            transactions.append({"id": trans.id, **trans.to_dict()})
            
        export_data["users"][user_id] = {
            "profile": user_data,
            "categories": categories,
            "transactions": transactions
        }

    # Save to JSON
    filename = 'balute_export.json'
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(export_data, f, ensure_ascii=False, indent=2, default=json_serial)

    print(f"✅ Exportación completada exitosamente en: {os.path.abspath(filename)}")

if __name__ == '__main__':
    # Check if emulator is running
    if 'FIRESTORE_EMULATOR_HOST' not in os.environ:
        print("⚠️  ADVERTENCIA: No se detectó la variable de entorno FIRESTORE_EMULATOR_HOST.")
        print("Si estás intentando exportar del EMULADOR, asegúrate de setearla (ej: localhost:8080).")
        print("Si estás intentando exportar de PRODUCCIÓN, asegúrate de tener tus credenciales configuradas (GOOGLE_APPLICATION_CREDENTIALS).")
        print("---")
    
    export_data()
