from firebase_admin import firestore
from firebase_config import initialize_firebase

initialize_firebase()

def migrate_users():
    db = firestore.client()
    users_ref = db.collection('users')
    
    users = users_ref.stream()
    for user in users:
        user_data = user.to_dict()
        
        # Add missing fields with default values
        updates = {}
        if 'last_login' not in user_data:
            updates['last_login'] = None
        if 'is_online' not in user_data:
            updates['is_online'] = False
        if 'sequential_id' not in user_data:
            # Generate sequential ID based on creation time
            updates['sequential_id'] = user_data.get('sequential_id', 0)
        
        if updates:
            users_ref.document(user.id).update(updates)
            print(f"Updated user: {user.id}")
    
    print("Migration completed!")

if __name__ == "__main__":
    migrate_users()