"""
Messaging and Q&A API endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_, desc, asc, func
from typing import List, Optional
from datetime import datetime, timedelta
import asyncio
import json

from ..core.database import get_db
from ..core.auth import get_current_user
from ..models.user import User
from ..models.messaging import Message, QAPost, QAVote, Notification, MessageThread
from ..schemas.auth import UserResponse
from ..schemas.messaging import (
    MessageCreate, MessageUpdate, MessageResponse, MessageSearch,
    QAPostCreate, QAPostUpdate, QAPostResponse, QASearch,
    QAVoteCreate, QAVoteResponse,
    NotificationResponse, NotificationUpdate,
    MessageThreadCreate, MessageThreadResponse,
    MessagingSummary, QASummary,
    BulkMessageAction, BulkQAAction
)

router = APIRouter(tags=["Messaging & Q&A"])


# Global dictionary to store active SSE connections
active_connections: dict = {}

# Helper function to create notifications
def create_notification(
    db: Session,
    user_id: int,
    title: str,
    content: str,
    notification_type: str,
    related_entity_type: Optional[str] = None,
    related_entity_id: Optional[int] = None,
    course_id: Optional[int] = None,
    send_email: bool = True
) -> Notification:
    """Create a new notification and send real-time update."""
    notification = Notification(
        user_id=user_id,
        title=title,
        content=content,
        notification_type=notification_type,
        related_entity_type=related_entity_type,
        related_entity_id=related_entity_id,
        course_id=course_id
    )
    
    db.add(notification)
    db.commit()
    db.refresh(notification)
    
    # Send real-time notification if user is connected
    if user_id in active_connections:
        try:
            notification_data = {
                "id": notification.id,
                "title": notification.title,
                "content": notification.content,
                "notification_type": notification.notification_type,
                "is_read": notification.is_read,
                "created_at": notification.created_at.isoformat(),
                "course_id": notification.course_id
            }
            active_connections[user_id].put_nowait(notification_data)
        except:
            # Remove disconnected client
            active_connections.pop(user_id, None)
    
    # Send email notification if enabled and user preferences allow
    if send_email:
        try:
            from ..core.email import email_service
            from ..models.course import Course
            
            # Get user and check preferences
            user = db.query(User).filter(User.id == user_id).first()
            if user and user.email and user.email_notifications:
                # Check specific notification type preference
                preferences = user.notification_preferences or {}
                notification_key = notification_type.replace("_", "_")
                
                # Map notification types to preference keys
                type_mapping = {
                    "message": "messages",
                    "qa_reply": "qa_replies", 
                    "course_update": "course_updates",
                    "test_result": "test_results",
                    "system": "system"
                }
                
                pref_key = type_mapping.get(notification_type, "system")
                if not preferences.get(pref_key, True):  # Default to True if not set
                    return notification
                
                # Get course title if applicable
                course_title = None
                if course_id:
                    course = db.query(Course).filter(Course.id == course_id).first()
                    if course:
                        course_title = course.title
                
                # Create action URL based on notification type
                action_url = None
                if notification_type == "message":
                    action_url = f"http://localhost:3000/messaging"
                elif notification_type == "qa_reply":
                    action_url = f"http://localhost:3000/courses/{course_id}/qa" if course_id else "http://localhost:3000/qa"
                elif notification_type == "course_update":
                    action_url = f"http://localhost:3000/courses/{course_id}" if course_id else "http://localhost:3000/courses"
                
                # Send email notification
                email_service.send_notification_email(
                    to_email=user.email,
                    notification_type=notification_type,
                    title=title,
                    content=content,
                    course_title=course_title,
                    action_url=action_url
                )
        except Exception as e:
            print(f"Failed to send email notification: {str(e)}")
    
    return notification

# Helper function to get relevant recipients
def get_relevant_recipients(current_user: User, course_id: Optional[int], db: Session) -> List[User]:
    """Get list of users that the current user can send messages to."""
    recipients = []
    
    if current_user.role == "admin":
        # Admins can message anyone
        recipients = db.query(User).filter(User.id != current_user.id).all()
    elif current_user.role == "instructor":
        # Instructors can message students and other instructors
        recipients = db.query(User).filter(
            User.id != current_user.id,
            User.role.in_(["student", "instructor"])
        ).all()
    elif current_user.role == "student":
        # Students can only message instructors
        recipients = db.query(User).filter(
            User.id != current_user.id,
            User.role == "instructor"
        ).all()
    
    return recipients


# Real-time Notifications
@router.options("/notifications/stream")
async def options_notifications_stream():
    """Handle preflight requests for SSE endpoint."""
    return {"message": "OK"}

@router.get("/notifications/stream")
async def stream_notifications(
    token: str = Query(..., description="JWT token for authentication"),
    db: Session = Depends(get_db)
):
    """Stream real-time notifications using Server-Sent Events."""
    # Authenticate user using token
    from ..core.auth import verify_token
    try:
        email = verify_token(token)
        if not email:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        current_user = db.query(User).filter(User.email == email).first()
        if not current_user:
            raise HTTPException(status_code=401, detail="User not found")
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    async def event_generator():
        # Create a queue for this user
        queue = asyncio.Queue()
        active_connections[current_user.id] = queue
        
        try:
            # Send initial connection confirmation
            yield f"data: {json.dumps({'type': 'connected', 'message': 'Real-time notifications enabled'})}\n\n"
            
            # Keep connection alive and send notifications
            while True:
                try:
                    # Wait for notification with timeout
                    notification = await asyncio.wait_for(queue.get(), timeout=30.0)
                    yield f"data: {json.dumps(notification)}\n\n"
                except asyncio.TimeoutError:
                    # Send heartbeat to keep connection alive
                    yield f"data: {json.dumps({'type': 'heartbeat', 'timestamp': datetime.now().isoformat()})}\n\n"
        except asyncio.CancelledError:
            # Clean up when client disconnects
            active_connections.pop(current_user.id, None)
            raise
    
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Cache-Control, Authorization",
            "Access-Control-Allow-Methods": "GET, OPTIONS",
            "Access-Control-Expose-Headers": "Content-Type"
        }
    )

# Message Endpoints
@router.get("/recipients", response_model=List[UserResponse])
async def get_recipients(
    course_id: Optional[int] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get list of users that the current user can send messages to."""
    recipients = get_relevant_recipients(current_user, course_id, db)
    
    # Convert to UserResponse format
    return [
        UserResponse(
            id=user.id,
            email=user.email,
            role=user.role,
            is_active=user.is_active,
            created_at=user.created_at
        )
        for user in recipients
    ]


@router.post("/messages", response_model=MessageResponse)
async def create_message(
    message_data: MessageCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new message."""
    # Check if recipient exists
    recipient = db.query(User).filter(User.id == message_data.recipient_id).first()
    if not recipient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recipient not found"
        )
    
    # Check if user can send messages to this recipient
    if current_user.role == "student" and recipient.role == "student":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Students cannot send messages to other students"
        )
    
    # Create message
    message = Message(
        sender_id=current_user.id,
        recipient_id=message_data.recipient_id,
        subject=message_data.subject,
        content=message_data.content,
        message_type=message_data.message_type,
        course_id=message_data.course_id,
        parent_message_id=message_data.parent_message_id,
        attachments=message_data.attachments
    )
    
    db.add(message)
    db.commit()
    db.refresh(message)
    
    # Create notification for recipient
    create_notification(
        db=db,
        user_id=message_data.recipient_id,
        title=f"New message from {current_user.email}",
        content=f"Subject: {message_data.subject}",
        notification_type="message",
        related_entity_type="message",
        related_entity_id=message.id,
        course_id=message_data.course_id
    )
    
    # Load related data for response
    db.refresh(message)
    return _format_message_response(message, db)


@router.get("/messages", response_model=List[MessageResponse])
async def get_messages(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    search: Optional[str] = Query(None),
    course_id: Optional[int] = Query(None),
    is_read: Optional[bool] = Query(None),
    is_archived: Optional[bool] = Query(False),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get messages for current user."""
    query = db.query(Message).filter(
        or_(
            Message.sender_id == current_user.id,
            Message.recipient_id == current_user.id
        )
    )
    
    if search:
        query = query.filter(
            or_(
                Message.subject.ilike(f"%{search}%"),
                Message.content.ilike(f"%{search}%")
            )
        )
    
    if course_id:
        query = query.filter(Message.course_id == course_id)
    
    if is_read is not None:
        query = query.filter(Message.is_read == is_read)
    
    if is_archived is not None:
        query = query.filter(Message.is_archived == is_archived)
    
    messages = query.order_by(desc(Message.created_at)).offset(skip).limit(limit).all()
    
    return [_format_message_response(msg, db) for msg in messages]


@router.get("/messages/{message_id}", response_model=MessageResponse)
async def get_message(
    message_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific message."""
    message = db.query(Message).filter(Message.id == message_id).first()
    if not message:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Message not found"
        )
    
    # Check if user has access to this message
    if message.sender_id != current_user.id and message.recipient_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    # Mark as read if user is recipient
    if message.recipient_id == current_user.id and not message.is_read:
        message.is_read = True
        db.commit()
    
    return _format_message_response(message, db)


@router.put("/messages/{message_id}", response_model=MessageResponse)
async def update_message(
    message_id: int,
    message_data: MessageUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a message."""
    message = db.query(Message).filter(Message.id == message_id).first()
    if not message:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Message not found"
        )
    
    # Check if user can update this message
    if message.sender_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the sender can update a message"
        )
    
    # Update fields
    for field, value in message_data.dict(exclude_unset=True).items():
        setattr(message, field, value)
    
    db.commit()
    db.refresh(message)
    
    return _format_message_response(message, db)


@router.delete("/messages/{message_id}")
async def delete_message(
    message_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a message."""
    message = db.query(Message).filter(Message.id == message_id).first()
    if not message:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Message not found"
        )
    
    # Check if user can delete this message
    if message.sender_id != current_user.id and message.recipient_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    db.delete(message)
    db.commit()
    
    return {"message": "Message deleted successfully"}


# Q&A Post Endpoints
@router.post("/qa/posts", response_model=QAPostResponse)
async def create_qa_post(
    post_data: QAPostCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new Q&A post."""
    # Check if course exists and user has access
    from ..models.course import Course
    course = db.query(Course).filter(Course.id == post_data.course_id).first()
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )
    
    # Check if user is enrolled in course or is instructor/admin
    if current_user.role == "student":
        from ..models.learning import Enrollment
        enrollment = db.query(Enrollment).filter(
            Enrollment.user_id == current_user.id,
            Enrollment.course_id == post_data.course_id,
            Enrollment.status == "active"
        ).first()
        if not enrollment:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You must be enrolled in this course to post"
            )
    
    # Create post
    post = QAPost(
        course_id=post_data.course_id,
        author_id=current_user.id,
        title=post_data.title,
        content=post_data.content,
        post_type=post_data.post_type,
        parent_post_id=post_data.parent_post_id,
        tags=post_data.tags,
        attachments=post_data.attachments
    )
    
    db.add(post)
    db.commit()
    db.refresh(post)
    
    # Create notifications for course participants
    _create_qa_notifications(post, db)
    
    return _format_qa_post_response(post, current_user.id, db)


@router.get("/qa/posts", response_model=List[QAPostResponse])
async def get_qa_posts(
    course_id: Optional[int] = Query(None),
    post_type: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    tags: Optional[str] = Query(None),
    is_resolved: Optional[bool] = Query(None),
    is_pinned: Optional[bool] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get Q&A posts."""
    query = db.query(QAPost).filter(QAPost.parent_post_id.is_(None))  # Only top-level posts
    
    if course_id:
        query = query.filter(QAPost.course_id == course_id)
    
    if post_type:
        query = query.filter(QAPost.post_type == post_type)
    
    if search:
        query = query.filter(
            or_(
                QAPost.title.ilike(f"%{search}%"),
                QAPost.content.ilike(f"%{search}%")
            )
        )
    
    if tags:
        tag_list = [tag.strip() for tag in tags.split(",")]
        query = query.filter(QAPost.tags.contains(tag_list))
    
    if is_resolved is not None:
        query = query.filter(QAPost.is_resolved == is_resolved)
    
    if is_pinned is not None:
        query = query.filter(QAPost.is_pinned == is_pinned)
    
    posts = query.order_by(desc(QAPost.is_pinned), desc(QAPost.created_at)).offset(skip).limit(limit).all()
    
    return [_format_qa_post_response(post, current_user.id, db) for post in posts]


@router.get("/qa/posts/{post_id}", response_model=QAPostResponse)
async def get_qa_post(
    post_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific Q&A post with replies."""
    post = db.query(QAPost).filter(QAPost.id == post_id).first()
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )
    
    # Increment view count
    post.view_count += 1
    db.commit()
    
    return _format_qa_post_response(post, current_user.id, db)


@router.put("/qa/posts/{post_id}", response_model=QAPostResponse)
async def update_qa_post(
    post_id: int,
    post_data: QAPostUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a Q&A post."""
    post = db.query(QAPost).filter(QAPost.id == post_id).first()
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )
    
    # Check if user can update this post
    if post.author_id != current_user.id and current_user.role not in ["instructor", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    # Update fields
    for field, value in post_data.dict(exclude_unset=True).items():
        setattr(post, field, value)
    
    db.commit()
    db.refresh(post)
    
    return _format_qa_post_response(post, current_user.id, db)


@router.delete("/qa/posts/{post_id}")
async def delete_qa_post(
    post_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a Q&A post."""
    post = db.query(QAPost).filter(QAPost.id == post_id).first()
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )
    
    # Check if user can delete this post
    if post.author_id != current_user.id and current_user.role not in ["instructor", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    db.delete(post)
    db.commit()
    
    return {"message": "Post deleted successfully"}


# Vote Endpoints
@router.post("/qa/votes", response_model=QAVoteResponse)
async def create_vote(
    vote_data: QAVoteCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create or update a vote on a Q&A post."""
    # Check if post exists
    post = db.query(QAPost).filter(QAPost.id == vote_data.post_id).first()
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )
    
    # Check if user already voted
    existing_vote = db.query(QAVote).filter(
        QAVote.post_id == vote_data.post_id,
        QAVote.user_id == current_user.id
    ).first()
    
    if existing_vote:
        # Update existing vote
        existing_vote.vote_type = vote_data.vote_type
        db.commit()
        db.refresh(existing_vote)
        return existing_vote
    else:
        # Create new vote
        vote = QAVote(
            post_id=vote_data.post_id,
            user_id=current_user.id,
            vote_type=vote_data.vote_type
        )
        db.add(vote)
        db.commit()
        db.refresh(vote)
        return vote


@router.delete("/qa/votes/{post_id}")
async def delete_vote(
    post_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Remove a vote from a Q&A post."""
    vote = db.query(QAVote).filter(
        QAVote.post_id == post_id,
        QAVote.user_id == current_user.id
    ).first()
    
    if not vote:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vote not found"
        )
    
    db.delete(vote)
    db.commit()
    
    return {"message": "Vote removed successfully"}


# Notification Endpoints
@router.get("/notifications", response_model=List[NotificationResponse])
async def get_notifications(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    is_read: Optional[bool] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get notifications for current user."""
    query = db.query(Notification).filter(Notification.user_id == current_user.id)
    
    if is_read is not None:
        query = query.filter(Notification.is_read == is_read)
    
    notifications = query.order_by(desc(Notification.created_at)).offset(skip).limit(limit).all()
    
    return [_format_notification_response(notif, db) for notif in notifications]


@router.put("/notifications/{notification_id}", response_model=NotificationResponse)
async def update_notification(
    notification_id: int,
    notification_data: NotificationUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a notification."""
    notification = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current_user.id
    ).first()
    
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )
    
    # Update fields
    for field, value in notification_data.dict(exclude_unset=True).items():
        setattr(notification, field, value)
    
    if notification_data.is_read and not notification.is_read:
        notification.read_at = datetime.utcnow()
    
    db.commit()
    db.refresh(notification)
    
    return _format_notification_response(notification, db)


@router.delete("/notifications/{notification_id}")
async def delete_notification(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a notification."""
    notification = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current_user.id
    ).first()
    
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )
    
    db.delete(notification)
    db.commit()
    
    return {"message": "Notification deleted successfully"}


# Dashboard/Summary Endpoints
# Notification Preferences
@router.get("/notifications/preferences")
async def get_notification_preferences(
    current_user: User = Depends(get_current_user)
):
    """Get user's notification preferences."""
    return {
        "email_notifications": current_user.email_notifications,
        "realtime_notifications": current_user.realtime_notifications,
        "preferences": current_user.notification_preferences or {
            "messages": True,
            "qa_replies": True,
            "course_updates": True,
            "test_results": True,
            "system": False
        }
    }

@router.put("/notifications/preferences")
async def update_notification_preferences(
    preferences: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update user's notification preferences."""
    # Update email notifications
    if "email_notifications" in preferences:
        current_user.email_notifications = preferences["email_notifications"]
    
    # Update realtime notifications
    if "realtime_notifications" in preferences:
        current_user.realtime_notifications = preferences["realtime_notifications"]
    
    # Update specific preferences
    if "preferences" in preferences:
        current_user.notification_preferences = preferences["preferences"]
    
    db.commit()
    db.refresh(current_user)
    
    return {
        "message": "Notification preferences updated successfully",
        "email_notifications": current_user.email_notifications,
        "realtime_notifications": current_user.realtime_notifications,
        "preferences": current_user.notification_preferences
    }

@router.get("/dashboard/summary", response_model=MessagingSummary)
async def get_messaging_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get messaging summary for dashboard."""
    # Count unread messages
    unread_messages = db.query(Message).filter(
        Message.recipient_id == current_user.id,
        Message.is_read == False
    ).count()
    
    # Count unread notifications
    unread_notifications = db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False
    ).count()
    
    # Get recent messages
    recent_messages = db.query(Message).filter(
        or_(
            Message.sender_id == current_user.id,
            Message.recipient_id == current_user.id
        )
    ).order_by(desc(Message.created_at)).limit(5).all()
    
    # Get recent notifications
    recent_notifications = db.query(Notification).filter(
        Notification.user_id == current_user.id
    ).order_by(desc(Notification.created_at)).limit(5).all()
    
    return MessagingSummary(
        unread_messages=unread_messages,
        unread_notifications=unread_notifications,
        recent_messages=[_format_message_response(msg, db) for msg in recent_messages],
        recent_notifications=[_format_notification_response(notif, db) for notif in recent_notifications]
    )


@router.get("/qa/summary", response_model=QASummary)
async def get_qa_summary(
    course_id: Optional[int] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get Q&A summary for dashboard."""
    query = db.query(QAPost).filter(QAPost.parent_post_id.is_(None))
    
    if course_id:
        query = query.filter(QAPost.course_id == course_id)
    
    # Count total questions
    total_questions = query.filter(QAPost.post_type == "question").count()
    
    # Count unanswered questions
    unanswered_questions = query.filter(
        QAPost.post_type == "question",
        QAPost.is_resolved == False
    ).count()
    
    # Get recent posts
    recent_posts = query.order_by(desc(QAPost.created_at)).limit(10).all()
    
    # Get popular tags
    tag_counts = db.query(
        func.json_array_elements_text(QAPost.tags).label('tag'),
        func.count().label('count')
    ).filter(
        QAPost.tags.isnot(None),
        QAPost.tags != '[]'
    ).group_by('tag').order_by(desc('count')).limit(10).all()
    
    popular_tags = [{"tag": tag, "count": count} for tag, count in tag_counts]
    
    return QASummary(
        total_questions=total_questions,
        unanswered_questions=unanswered_questions,
        recent_posts=[_format_qa_post_response(post, current_user.id, db) for post in recent_posts],
        popular_tags=popular_tags
    )


# Helper functions
def _format_message_response(message: Message, db: Session) -> MessageResponse:
    """Format message for response with related data."""
    # Get sender and recipient names
    sender = db.query(User).filter(User.id == message.sender_id).first()
    recipient = db.query(User).filter(User.id == message.recipient_id).first()
    
    # Get course title if applicable
    course_title = None
    if message.course_id:
        from ..models.course import Course
        course = db.query(Course).filter(Course.id == message.course_id).first()
        course_title = course.title if course else None
    
    # Count replies
    reply_count = db.query(Message).filter(Message.parent_message_id == message.id).count()
    
    return MessageResponse(
        id=message.id,
        sender_id=message.sender_id,
        recipient_id=message.recipient_id,
        subject=message.subject,
        content=message.content,
        message_type=message.message_type,
        course_id=message.course_id,
        parent_message_id=message.parent_message_id,
        is_read=message.is_read,
        is_archived=message.is_archived,
        attachments=message.attachments,
        created_at=message.created_at,
        updated_at=message.updated_at,
        sender_name=f"{sender.email}" if sender else None,
        recipient_name=f"{recipient.email}" if recipient else None,
        course_title=course_title,
        reply_count=reply_count
    )


def _format_qa_post_response(post: QAPost, user_id: int, db: Session) -> QAPostResponse:
    """Format Q&A post for response with related data."""
    # Get author name
    author = db.query(User).filter(User.id == post.author_id).first()
    
    # Get course title
    from ..models.course import Course
    course = db.query(Course).filter(Course.id == post.course_id).first()
    
    # Count replies
    reply_count = db.query(QAPost).filter(QAPost.parent_post_id == post.id).count()
    
    # Calculate vote score
    upvotes = db.query(QAVote).filter(
        QAVote.post_id == post.id,
        QAVote.vote_type == "up"
    ).count()
    downvotes = db.query(QAVote).filter(
        QAVote.post_id == post.id,
        QAVote.vote_type == "down"
    ).count()
    vote_score = upvotes - downvotes
    
    # Get user's vote
    user_vote = db.query(QAVote).filter(
        QAVote.post_id == post.id,
        QAVote.user_id == user_id
    ).first()
    
    return QAPostResponse(
        id=post.id,
        course_id=post.course_id,
        author_id=post.author_id,
        title=post.title,
        content=post.content,
        post_type=post.post_type,
        parent_post_id=post.parent_post_id,
        is_pinned=post.is_pinned,
        is_resolved=post.is_resolved,
        is_archived=post.is_archived,
        tags=post.tags,
        attachments=post.attachments,
        view_count=post.view_count,
        created_at=post.created_at,
        updated_at=post.updated_at,
        author_name=f"{author.email}" if author else None,
        course_title=course.title if course else None,
        reply_count=reply_count,
        vote_score=vote_score,
        user_vote=user_vote.vote_type if user_vote else None
    )


def _format_notification_response(notification: Notification, db: Session) -> NotificationResponse:
    """Format notification for response with related data."""
    # Get course title if applicable
    course_title = None
    if notification.course_id:
        from ..models.course import Course
        course = db.query(Course).filter(Course.id == notification.course_id).first()
        course_title = course.title if course else None
    
    return NotificationResponse(
        id=notification.id,
        user_id=notification.user_id,
        title=notification.title,
        content=notification.content,
        notification_type=notification.notification_type,
        related_entity_type=notification.related_entity_type,
        related_entity_id=notification.related_entity_id,
        course_id=notification.course_id,
        is_read=notification.is_read,
        is_archived=notification.is_archived,
        created_at=notification.created_at,
        read_at=notification.read_at,
        course_title=course_title
    )


def _create_qa_notifications(post: QAPost, db: Session):
    """Create notifications for Q&A post participants."""
    from ..models.learning import Enrollment
    from ..models.course import Course
    
    # Get course participants
    enrollments = db.query(Enrollment).filter(
        Enrollment.course_id == post.course_id,
        Enrollment.status == "active"
    ).all()
    
    # Get course instructors
    course = db.query(Course).filter(Course.id == post.course_id).first()
    instructor_ids = [course.instructor_id] if course else []
    
    # Create notifications for all participants
    all_user_ids = set([e.user_id for e in enrollments] + instructor_ids)
    all_user_ids.discard(post.author_id)  # Don't notify the author
    
    for user_id in all_user_ids:
        create_notification(
            db=db,
            user_id=user_id,
            title=f"New {post.post_type} in course discussion",
            content=f"{post.title[:50]}..." if len(post.title) > 50 else post.title,
            notification_type="qa_reply",
            related_entity_type="qa_post",
            related_entity_id=post.id,
            course_id=post.course_id
        )
