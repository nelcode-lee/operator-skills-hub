"""
Messaging and Q&A system schemas.
"""
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum


class MessageType(str, Enum):
    DIRECT = "direct"
    COURSE_RELATED = "course_related"
    SYSTEM = "system"


class QAPostType(str, Enum):
    QUESTION = "question"
    ANSWER = "answer"
    ANNOUNCEMENT = "announcement"


class NotificationType(str, Enum):
    MESSAGE = "message"
    QA_REPLY = "qa_reply"
    COURSE_UPDATE = "course_update"
    SYSTEM = "system"


class VoteType(str, Enum):
    UP = "up"
    DOWN = "down"


# Message Schemas
class MessageBase(BaseModel):
    subject: str = Field(..., max_length=255)
    content: str = Field(..., min_length=1)
    message_type: MessageType = MessageType.DIRECT
    course_id: Optional[int] = None
    attachments: Optional[List[Dict[str, Any]]] = None


class MessageCreate(MessageBase):
    recipient_id: int
    parent_message_id: Optional[int] = None


class MessageUpdate(BaseModel):
    subject: Optional[str] = Field(None, max_length=255)
    content: Optional[str] = Field(None, min_length=1)
    is_read: Optional[bool] = None
    is_archived: Optional[bool] = None


class MessageResponse(MessageBase):
    id: int
    sender_id: int
    recipient_id: int
    parent_message_id: Optional[int] = None
    is_read: bool
    is_archived: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    # Nested user info
    sender_name: Optional[str] = None
    recipient_name: Optional[str] = None
    course_title: Optional[str] = None
    reply_count: int = 0
    
    class Config:
        from_attributes = True


# Q&A Post Schemas
class QAPostBase(BaseModel):
    title: str = Field(..., max_length=255)
    content: str = Field(..., min_length=1)
    post_type: QAPostType = QAPostType.QUESTION
    parent_post_id: Optional[int] = None
    tags: Optional[List[str]] = None
    attachments: Optional[List[Dict[str, Any]]] = None


class QAPostCreate(QAPostBase):
    course_id: int


class QAPostUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=255)
    content: Optional[str] = Field(None, min_length=1)
    is_pinned: Optional[bool] = None
    is_resolved: Optional[bool] = None
    is_archived: Optional[bool] = None
    tags: Optional[List[str]] = None


class QAPostResponse(QAPostBase):
    id: int
    course_id: int
    author_id: int
    is_pinned: bool
    is_resolved: bool
    is_archived: bool
    view_count: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    # Nested info
    author_name: Optional[str] = None
    course_title: Optional[str] = None
    reply_count: int = 0
    vote_score: int = 0
    user_vote: Optional[VoteType] = None
    
    class Config:
        from_attributes = True


# Vote Schemas
class QAVoteCreate(BaseModel):
    post_id: int
    vote_type: VoteType


class QAVoteResponse(BaseModel):
    id: int
    post_id: int
    user_id: int
    vote_type: VoteType
    created_at: datetime
    
    class Config:
        from_attributes = True


# Notification Schemas
class NotificationBase(BaseModel):
    title: str = Field(..., max_length=255)
    content: str = Field(..., min_length=1)
    notification_type: NotificationType
    related_entity_type: Optional[str] = None
    related_entity_id: Optional[int] = None
    course_id: Optional[int] = None


class NotificationCreate(NotificationBase):
    user_id: int


class NotificationUpdate(BaseModel):
    is_read: Optional[bool] = None
    is_archived: Optional[bool] = None


class NotificationResponse(NotificationBase):
    id: int
    user_id: int
    is_read: bool
    is_archived: bool
    created_at: datetime
    read_at: Optional[datetime] = None
    course_title: Optional[str] = None
    
    class Config:
        from_attributes = True


# Thread Schemas
class MessageThreadBase(BaseModel):
    subject: str = Field(..., max_length=255)
    course_id: Optional[int] = None
    participants: List[int]


class MessageThreadCreate(MessageThreadBase):
    pass


class MessageThreadResponse(MessageThreadBase):
    id: int
    last_message_at: datetime
    is_archived: bool
    created_at: datetime
    course_title: Optional[str] = None
    participant_count: int
    unread_count: int = 0
    
    class Config:
        from_attributes = True


# Dashboard/Summary Schemas
class MessagingSummary(BaseModel):
    unread_messages: int
    unread_notifications: int
    recent_messages: List[MessageResponse]
    recent_notifications: List[NotificationResponse]


class QASummary(BaseModel):
    total_questions: int
    unanswered_questions: int
    recent_posts: List[QAPostResponse]
    popular_tags: List[Dict[str, Any]]


# Search and Filter Schemas
class MessageSearch(BaseModel):
    query: Optional[str] = None
    course_id: Optional[int] = None
    message_type: Optional[MessageType] = None
    is_read: Optional[bool] = None
    is_archived: Optional[bool] = None
    sender_id: Optional[int] = None
    recipient_id: Optional[int] = None
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None


class QASearch(BaseModel):
    query: Optional[str] = None
    course_id: Optional[int] = None
    post_type: Optional[QAPostType] = None
    tags: Optional[List[str]] = None
    is_resolved: Optional[bool] = None
    is_pinned: Optional[bool] = None
    author_id: Optional[int] = None
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None


# Bulk Operations
class BulkMessageAction(BaseModel):
    message_ids: List[int]
    action: str  # mark_read, mark_unread, archive, delete


class BulkQAAction(BaseModel):
    post_ids: List[int]
    action: str  # pin, unpin, resolve, archive, delete







