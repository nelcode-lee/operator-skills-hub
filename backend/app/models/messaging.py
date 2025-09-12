"""
Messaging and Q&A system models.
"""
from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..core.database import Base


class Message(Base):
    """Direct message model for student-instructor communication."""
    
    __tablename__ = "messages"
    
    id = Column(Integer, primary_key=True, index=True)
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    recipient_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    subject = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    message_type = Column(String(50), default="direct")  # direct, course_related, system
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=True)
    is_read = Column(Boolean, default=False)
    is_archived = Column(Boolean, default=False)
    parent_message_id = Column(Integer, ForeignKey("messages.id"), nullable=True)  # For replies
    attachments = Column(JSON, nullable=True)  # List of file attachments
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    sender = relationship("User", foreign_keys=[sender_id])
    recipient = relationship("User", foreign_keys=[recipient_id])
    course = relationship("Course")
    parent_message = relationship("Message", remote_side=[id], back_populates="replies")
    replies = relationship("Message", back_populates="parent_message")


class QAPost(Base):
    """Q&A forum post model for course-specific discussions."""
    
    __tablename__ = "qa_posts"
    
    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    author_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    post_type = Column(String(50), default="question")  # question, answer, announcement
    parent_post_id = Column(Integer, ForeignKey("qa_posts.id"), nullable=True)  # For answers to questions
    is_pinned = Column(Boolean, default=False)
    is_resolved = Column(Boolean, default=False)
    is_archived = Column(Boolean, default=False)
    tags = Column(JSON, nullable=True)  # List of tags for categorization
    attachments = Column(JSON, nullable=True)  # List of file attachments
    view_count = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    course = relationship("Course")
    author = relationship("User")
    parent_post = relationship("QAPost", remote_side=[id], back_populates="replies")
    replies = relationship("QAPost", back_populates="parent_post")
    votes = relationship("QAVote", back_populates="post")


class QAVote(Base):
    """Vote model for Q&A posts (upvote/downvote)."""
    
    __tablename__ = "qa_votes"
    
    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("qa_posts.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    vote_type = Column(String(10), nullable=False)  # up, down
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    post = relationship("QAPost", back_populates="votes")
    user = relationship("User")


class Notification(Base):
    """Notification model for system alerts and updates."""
    
    __tablename__ = "notifications"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    notification_type = Column(String(50), nullable=False)  # message, qa_reply, course_update, system
    is_read = Column(Boolean, default=False)
    is_archived = Column(Boolean, default=False)
    related_entity_type = Column(String(50), nullable=True)  # message, qa_post, course
    related_entity_id = Column(Integer, nullable=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    read_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    user = relationship("User")
    course = relationship("Course")


class MessageThread(Base):
    """Message thread model for organizing related messages."""
    
    __tablename__ = "message_threads"
    
    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=True)
    subject = Column(String(255), nullable=False)
    participants = Column(JSON, nullable=False)  # List of user IDs
    last_message_at = Column(DateTime(timezone=True), server_default=func.now())
    is_archived = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    course = relationship("Course")
    # Note: messages relationship will be added later to avoid circular import issues
