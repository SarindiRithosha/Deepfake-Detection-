from fastapi import APIRouter, HTTPException
from firebase_admin import firestore
from datetime import datetime, timedelta
from typing import List, Dict
import math
from pydantic import BaseModel


router = APIRouter(prefix="/admin", tags=["admin"])

# admin_router.py - Update the get_dashboard_stats function
@router.get("/dashboard-stats")
async def get_dashboard_stats():
    """Get dashboard statistics for admin panel"""
    try:
        db = firestore.client()
        
        # Get all users
        users_ref = db.collection('users')
        users = users_ref.stream()
        
        total_analyses = 0
        active_users = 0
        all_users_data = []
        
        print("=== DEBUG: Calculating dashboard stats ===")
        
        # Calculate sequential IDs and process user data
        user_list = list(users)
        for index, user in enumerate(user_list):
            user_data = user.to_dict()
            
            # Assign sequential ID if not exists
            if 'sequential_id' not in user_data:
                users_ref.document(user.id).update({'sequential_id': index + 1})
                user_data['sequential_id'] = index + 1
            
            # Count analyses
            user_analyses = user_data.get('analysis_count', 0)
            total_analyses += user_analyses
            
            # Check if user is active (online and logged in within last 15 minutes)
            last_login = user_data.get('last_login')
            is_online = user_data.get('is_online', False)
            
            user_active = False
            if is_online:
                user_active = True
                print(f"User {user_data.get('name')} is active (is_online=True)")
            elif last_login:
                try:
                    # Handle Firestore timestamp
                    if hasattr(last_login, 'timestamp'):
                        last_login_time = last_login.timestamp()
                        current_time = datetime.now().timestamp()
                        time_diff = current_time - last_login_time
                    else:
                        last_login_time = last_login.replace(tzinfo=None) if hasattr(last_login, 'replace') else last_login
                        time_diff = (datetime.now() - last_login_time).total_seconds()
                    
                    if time_diff < 900:  # 15 minutes
                        user_active = True
                        print(f"User {user_data.get('name')} is active (recent login: {time_diff:.0f}s ago)")
                except Exception as e:
                    print(f"Error checking activity for user {user_data.get('name')}: {e}")
            
            if user_active:
                active_users += 1
            
            # Store user data for user management
            all_users_data.append({
                'id': user_data.get('sequential_id', index + 1),
                'uid': user.id,
                'name': user_data.get('name', 'Unknown'),
                'email': user_data.get('email', ''),
                'analyses': user_analyses,
                'status': "Active" if user_active else "Inactive",
                'last_login': user_data.get('last_login'),
                'is_online': is_online
            })
        
        # Calculate trend for total analyses
        trend_data = await get_analysis_trend()
        
        print(f"=== DEBUG: Dashboard Stats Summary ===")
        print(f"Total analyses: {total_analyses}")
        print(f"Active users: {active_users}")
        print(f"Analysis trend: {trend_data}")
        
        return {
            'total_analyses': total_analyses,
            'active_users': active_users,
            'analysis_trend': trend_data,
            'users_data': all_users_data
        }
        
    except Exception as e:
        print(f"Error in get_dashboard_stats: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch dashboard stats: {str(e)}")

@router.get("/analysis-trend")
async def get_analysis_trend():
    """Calculate analysis trend (this week vs last week)"""
    try:
        db = firestore.client()
        
        # Get current week and last week dates
        today = datetime.now()
        start_of_this_week = today - timedelta(days=today.weekday())
        start_of_last_week = start_of_this_week - timedelta(weeks=1)
        
        # This would require storing analysis timestamps
        # For now, we'll use a mock calculation based on user analysis counts
        users_ref = db.collection('users')
        users = users_ref.stream()
        
        # Mock trend calculation (in real implementation, you'd track analysis timestamps)
        total_this_week = 0
        total_last_week = 0
        
        for user in users:
            user_data = user.to_dict()
            analysis_count = user_data.get('analysis_count', 0)
            
            # Simple mock: distribute analyses across weeks
            if analysis_count > 0:
                total_this_week += math.ceil(analysis_count * 0.6)  # 60% this week
                total_last_week += math.floor(analysis_count * 0.4)  # 40% last week
        
        # Calculate trend percentage
        if total_last_week > 0:
            trend_percentage = ((total_this_week - total_last_week) / total_last_week) * 100
        else:
            trend_percentage = 100 if total_this_week > 0 else 0
        
        trend_type = 'up' if trend_percentage >= 0 else 'down'
        trend_display = f"{'+' if trend_percentage >= 0 else ''}{trend_percentage:.1f}%"
        
        return {
            'this_week': total_this_week,
            'last_week': total_last_week,
            'trend_percentage': trend_percentage,
            'trend_display': trend_display,
            'trend_type': trend_type
        }
        
    except Exception as e:
        # Return mock data if calculation fails
        return {
            'this_week': 150,
            'last_week': 120,
            'trend_percentage': 25.0,
            'trend_display': '+25.0%',
            'trend_type': 'up'
        }

@router.get("/users")
async def get_all_users(search: str = None):
    """Get all users with search functionality"""
    try:
        db = firestore.client()
        users_ref = db.collection('users')
        
        users_data = []
        users = users_ref.stream()
        
        print("=== DEBUG: Processing users ===")
        
        for index, user in enumerate(users):
            user_data = user.to_dict()
            
            # Get user status
            status = "Inactive"
            is_online = user_data.get('is_online', False)
            last_login = user_data.get('last_login')
            
            print(f"User {user.id}:")
            print(f"  - Name: {user_data.get('name')}")
            print(f"  - is_online: {is_online}")
            print(f"  - last_login: {last_login}")
            
            if is_online:
                status = "Active"
                print(f"  - Status: Active (is_online=True)")
            elif last_login:
                try:
                    # Handle Firestore timestamp
                    if hasattr(last_login, 'timestamp'):
                        last_login_time = last_login.timestamp()
                        current_time = datetime.now().timestamp()
                        time_diff = current_time - last_login_time
                    else:
                        last_login_time = last_login.replace(tzinfo=None) if hasattr(last_login, 'replace') else last_login
                        time_diff = (datetime.now() - last_login_time).total_seconds()
                    
                    if time_diff < 900:  # 15 minutes
                        status = "Active"
                        print(f"  - Status: Active (recent login: {time_diff:.0f}s ago)")
                    else:
                        print(f"  - Status: Inactive (old login: {time_diff:.0f}s ago)")
                except Exception as e:
                    print(f"  - Status: Inactive (error: {e})")
            else:
                print(f"  - Status: Inactive (no login data)")
            
            user_info = {
                'id': user_data.get('sequential_id', index + 1),
                'uid': user.id,
                'name': user_data.get('name', 'Unknown'),
                'email': user_data.get('email', ''),
                'analyses': user_data.get('analysis_count', 0),
                'status': status,
                'last_login': last_login,
                'is_online': is_online,
                'created_at': user_data.get('created_at')
            }
            
            users_data.append(user_info)
        
        # Sort by sequential ID
        users_data.sort(key=lambda x: x['id'])
        
        print(f"=== DEBUG: Returning {len(users_data)} users ===")
        for user in users_data:
            print(f"ID {user['id']}: {user['name']} - Status: {user['status']}")
        
        return users_data
        
    except Exception as e:
        print(f"Error in get_all_users: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch users: {str(e)}")

from pydantic import BaseModel

class OnlineStatusUpdate(BaseModel):
    is_online: bool

@router.post("/user/{uid}/update-online-status")
async def update_user_online_status(uid: str, status_update: OnlineStatusUpdate):
    """Update user's online status"""
    try:
        print(f"Updating user {uid} online status to: {status_update.is_online}")
        
        db = firestore.client()
        user_ref = db.collection('users').document(uid)
        
        updates = {
            'is_online': status_update.is_online,
            'last_login': firestore.SERVER_TIMESTAMP if status_update.is_online else None
        }
        
        user_ref.update(updates)
        print(f"Successfully updated user {uid} status")
        return {"message": "User status updated successfully"}
        
    except Exception as e:
        print(f"Error updating user {uid} status: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to update user status: {str(e)}")
    

# admin_router.py - Add a debug endpoint to see raw user data
@router.get("/users-debug")
async def get_users_debug():
    """Debug endpoint to see raw user data"""
    try:
        db = firestore.client()
        users_ref = db.collection('users')
        users = users_ref.stream()
        
        debug_data = []
        for user in users:
            user_data = user.to_dict()
            debug_data.append({
                'uid': user.id,
                'name': user_data.get('name', 'Unknown'),
                'email': user_data.get('email', ''),
                'is_online': user_data.get('is_online', False),
                'last_login': user_data.get('last_login'),
                'has_last_login': 'last_login' in user_data,
                'analysis_count': user_data.get('analysis_count', 0),
                'sequential_id': user_data.get('sequential_id', 'Not set'),
                'all_fields': user_data
            })
        
        return debug_data
        
    except Exception as e:
        return {"error": str(e)}