import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore
import os

def check_admin():
    print("🔍 Verificando colección adminEmails...")

    try:
        # Auth setup (same as export_data.py)
        cred_path = 'serviceAccountKey.json'
        if os.path.exists(cred_path):
            cred = credentials.Certificate(cred_path)
            if not firebase_admin._apps:
                firebase_admin.initialize_app(cred)
        elif not firebase_admin._apps:
            firebase_admin.initialize_app()
            
        db = firestore.client()
        
        docs = db.collection('adminEmails').stream()
        found = False
        for doc in docs:
            print(f"✅ Encontrado Admin: ID={doc.id} Data={doc.to_dict()}")
            found = True
            
        if not found:
            print("❌ NO se encontraron documentos en 'adminEmails'.")
            print("   Esto explica por qué no puedes registrarte.")
            print("   Necesitas crear un documento ahí con tu email.")

    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == '__main__':
    if 'FIRESTORE_EMULATOR_HOST' not in os.environ:
         print("ℹ️  Conectando a PRODUCCIÓN (o default)...")
    else:
         print("ℹ️  Conectando a EMULADOR...")
    check_admin()
