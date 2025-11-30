import firebase_admin
from firebase_admin import credentials, firestore, auth
import os

def restore_admin():
    email = "papatolew2.0@gmail.com"
    print(f"🔧 Intentando reparar cuenta para: {email}")

    try:
        # Auth setup
        cred_path = 'serviceAccountKey.json'
        if os.path.exists(cred_path):
            cred = credentials.Certificate(cred_path)
            if not firebase_admin._apps:
                firebase_admin.initialize_app(cred)
        elif not firebase_admin._apps:
            firebase_admin.initialize_app()
            
        db = firestore.client()
        
        # 1. Buscar el UID del usuario en Authentication
        try:
            user = auth.get_user_by_email(email)
            uid = user.uid
            print(f"✅ Usuario encontrado en Auth. UID: {uid}")
        except auth.UserNotFoundError:
            print("❌ El usuario no existe en Authentication.")
            print("   Solución: Ve a la app y REGÍSTRATE primero.")
            return

        # 2. Verificar si ya tiene perfil en Firestore
        user_ref = db.collection('users').document(uid)
        doc = user_ref.get()
        
        if doc.exists:
            print("⚠️  El perfil ya existe en Firestore.")
            current_role = doc.to_dict().get('role')
            print(f"   Rol actual: {current_role}")
            if current_role == 'admin':
                print("   ¡Ya eres admin! No se necesita hacer nada.")
                return
        
        # 3. Crear/Sobrescribir el perfil de Admin
        print("🔨 Creando perfil de Admin en Firestore...")
        user_ref.set({
            'email': email,
            'role': 'admin',
            'createdAt': firestore.SERVER_TIMESTAMP
        }, merge=True)
        
        print("✨ ¡ÉXITO! Tu usuario ha sido restaurado como Admin.")
        print("   Ahora intenta Iniciar Sesión (Log In) en la app.")

    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == '__main__':
    restore_admin()
