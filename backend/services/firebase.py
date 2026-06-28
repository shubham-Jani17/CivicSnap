from typing import List, Dict, Any, Optional
import time
from firebase_admin import auth, firestore
from google.cloud.firestore_v1.base_query import FieldFilter

from backend.config import get_firestore_client, logger

class FirebaseService:
    @staticmethod
    def verify_token(id_token: str) -> Optional[Dict[str, Any]]:
        """
        Verifies a client-side Firebase ID token.
        Returns the decoded token claims (such as uid, email, name) or None if invalid.
        """
        try:
            decoded_token = auth.verify_id_token(id_token)
            logger.info(f"Verified token for user: {decoded_token.get('uid')} ({decoded_token.get('email')})")
            return decoded_token
        except Exception as e:
            logger.error(f"Token verification failed: {e}")
            return None

    @staticmethod
    def get_user_profile(uid: str) -> Optional[Dict[str, Any]]:
        """Retrieves or creates a citizen user profile in Firestore."""
        db = get_firestore_client()
        if not db:
            return None
        
        try:
            doc_ref = db.collection("users").document(uid)
            doc = doc_ref.get()
            if doc.exists:
                return doc.to_dict()
            
            # Create a default profile if it doesn't exist yet
            # Fetch default user object metadata from Firebase Auth
            user_meta = auth.get_user(uid)
            default_profile = {
                "uid": uid,
                "email": user_meta.email,
                "name": user_meta.display_name or "Anonymous Citizen",
                "picture": user_meta.photo_url or f"https://api.dicebear.com/7.x/bottts/svg?seed={uid}",
                "soundEnabled": True,
                "actionPoints": 100,
                "createdAt": time.time()
            }
            doc_ref.set(default_profile)
            logger.info(f"Created default Firestore profile for new user UID: {uid}")
            return default_profile
        except Exception as e:
            logger.error(f"Error fetching user profile {uid}: {e}")
            return None

    @staticmethod
    def update_user_profile(uid: str, updates: Dict[str, Any]) -> bool:
        """Updates specific fields of a user's citizen profile."""
        db = get_firestore_client()
        if not db:
            return False
        try:
            doc_ref = db.collection("users").document(uid)
            doc_ref.update(updates)
            logger.info(f"Updated profile fields for UID: {uid}")
            return True
        except Exception as e:
            logger.error(f"Failed to update profile for {uid}: {e}")
            return False

    @staticmethod
    def create_report(uid: str, report_data: Dict[str, Any]) -> Optional[str]:
        """Creates a new civic issue report in Firestore."""
        db = get_firestore_client()
        if not db:
            return None
        try:
            report_data["reporterUid"] = uid
            report_data["createdAt"] = time.time()
            report_data["upvotes"] = []
            report_data["volunteers"] = []
            report_data["status"] = "REPORTED" # REPORTED, TRIAGED, WORK_IN_PROGRESS, RESOLVED
            
            # Auto generate document reference
            doc_ref = db.collection("issues").document()
            report_data["id"] = doc_ref.id
            
            # Save to Firestore
            doc_ref.set(report_data)
            logger.info(f"Created new civic report: {doc_ref.id} by reporter: {uid}")

            # Award 50 Action Points to reporter for active engagement
            FirebaseService.award_action_points(uid, 50)
            
            return doc_ref.id
        except Exception as e:
            logger.error(f"Error creating report: {e}")
            return None

    @staticmethod
    def get_all_issues() -> List[Dict[str, Any]]:
        """Retrieves all active issues from Firestore sorted by creation date."""
        db = get_firestore_client()
        if not db:
            return []
        try:
            docs = db.collection("issues").order_by("createdAt", direction=firestore.Query.DESCENDING).stream()
            return [doc.to_dict() for doc in docs]
        except Exception as e:
            logger.error(f"Error retrieving issues from Firestore: {e}")
            return []

    @staticmethod
    def update_issue(issue_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Updates specific fields of a reported issue."""
        db = get_firestore_client()
        if not db:
            return None
        try:
            doc_ref = db.collection("issues").document(issue_id)
            doc = doc_ref.get()
            if not doc.exists:
                return None
            doc_ref.update(updates)
            # return updated doc
            return doc_ref.get().to_dict()
        except Exception as e:
            logger.error(f"Failed to update issue {issue_id}: {e}")
            return None

    @staticmethod
    def delete_issue(issue_id: str) -> bool:
        """Deletes an issue from the database."""
        db = get_firestore_client()
        if not db:
            return False
        try:
            doc_ref = db.collection("issues").document(issue_id)
            doc_ref.delete()
            return True
        except Exception as e:
            logger.error(f"Failed to delete issue {issue_id}: {e}")
            return False

    @staticmethod
    def toggle_upvote_issue(issue_id: str, uid: str) -> Optional[Dict[str, Any]]:
        """Toggles a user's upvote on a reported issue and manages civic points."""
        db = get_firestore_client()
        if not db:
            return None
        try:
            doc_ref = db.collection("issues").document(issue_id)
            doc = doc_ref.get()
            if not doc.exists:
                logger.warning(f"Upvote request rejected: issue {issue_id} not found.")
                return None
            
            data = doc.to_dict()
            upvotes = data.get("upvotes", [])
            
            if uid in upvotes:
                upvotes.remove(uid)
                # Deduct points if user withdraws civic support
                FirebaseService.award_action_points(uid, -10)
            else:
                upvotes.append(uid)
                # Award points for endorsing civic action
                FirebaseService.award_action_points(uid, 15)

            doc_ref.update({"upvotes": upvotes})
            data["upvotes"] = upvotes
            return data
        except Exception as e:
            logger.error(f"Error toggling upvote for issue {issue_id}: {e}")
            return None

    @staticmethod
    def join_volunteer_event(issue_id: str, uid: str) -> Optional[Dict[str, Any]]:
        """Enrolls a user in a volunteer event for an issue."""
        db = get_firestore_client()
        if not db:
            return None
        try:
            doc_ref = db.collection("issues").document(issue_id)
            doc = doc_ref.get()
            if not doc.exists:
                return None
            
            data = doc.to_dict()
            volunteers = data.get("volunteers", [])
            
            if uid not in volunteers:
                volunteers.append(uid)
                doc_ref.update({"volunteers": volunteers})
                data["volunteers"] = volunteers
                # Highly reward active volunteering participation with 100 points
                FirebaseService.award_action_points(uid, 100)
            
            return data
        except Exception as e:
            logger.error(f"Error joining volunteer event for issue {issue_id}: {e}")
            return None

    @staticmethod
    def award_action_points(uid: str, points: int):
        """Awards (or deducts) action points on the user profile."""
        db = get_firestore_client()
        if not db:
            return
        try:
            user_ref = db.collection("users").document(uid)
            user_doc = user_ref.get()
            if user_doc.exists:
                current_points = user_doc.to_dict().get("actionPoints", 0)
                new_points = max(0, current_points + points)
                user_ref.update({"actionPoints": new_points})
                logger.info(f"Adjusted action points for {uid} by {points}. New total: {new_points}")
            else:
                # If the user profile doesn't exist yet, we auto-create it with default values + points award
                try:
                    user_meta = auth.get_user(uid)
                    email = user_meta.email
                    name = user_meta.display_name or "Anonymous Citizen"
                    picture = user_meta.photo_url or f"https://api.dicebear.com/7.x/bottts/svg?seed={uid}"
                except Exception:
                    email = "citizen@civicsnap.org"
                    name = "Anonymous Citizen"
                    picture = f"https://api.dicebear.com/7.x/bottts/svg?seed={uid}"
                
                new_points = max(0, 100 + points) # starts at 100 points
                user_ref.set({
                    "uid": uid,
                    "email": email,
                    "name": name,
                    "picture": picture,
                    "soundEnabled": True,
                    "actionPoints": new_points,
                    "createdAt": time.time()
                })
                logger.info(f"Created user doc and set initial points for {uid}: {new_points}")
        except Exception as e:
            logger.error(f"Failed to award action points to user {uid}: {e}")

    @staticmethod
    def get_leaderboard(limit: int = 10) -> List[Dict[str, Any]]:
        """Retrieves top civic defenders ranked by their action points."""
        db = get_firestore_client()
        if not db:
            return []
        try:
            docs = (
                db.collection("users")
                .order_by("actionPoints", direction=firestore.Query.DESCENDING)
                .limit(limit)
                .stream()
            )
            return [doc.to_dict() for doc in docs]
        except Exception as e:
            logger.error(f"Error fetching leaderboard: {e}")
            return []
