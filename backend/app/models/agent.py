from sqlalchemy import Column, String, DateTime, func, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.types import Text
import uuid
from app.core.database import Base

class Agent(Base):
    __tablename__ = "agents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    agent_type = Column(String, nullable=False)
    name = Column(String, nullable=False)
    personality = Column(String, nullable=False)
    status = Column(String, default="active", nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    dispatch_id = Column(String, nullable=True)
    room_name = Column(String, nullable=True)
    deployment_status = Column(String, default="not_deployed", nullable=False)
    deployed_at = Column(DateTime(timezone=True), nullable=True)
    deployment_metadata = Column(JSON, nullable=True)

