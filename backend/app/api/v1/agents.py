from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import uuid
import logging
import subprocess
import json
import re
import os

from app.core.database import get_db
from app.models.agent import Agent
from app.services.agent_runner import AgentProcessManager
import requests

logger = logging.getLogger(__name__)

router = APIRouter()

class AgentCreate(BaseModel):
    agent_type: str
    name: str
    personality: str

class AgentResponse(BaseModel):
    id: str
    agent_type: str
    name: str
    personality: str
    created_at: datetime
    status: str
    process_info: Optional[dict] = None
    dispatch_id: Optional[str] = None
    room_name: Optional[str] = None
    deployment_status: Optional[str] = None
    deployed_at: Optional[datetime] = None
    deployment_metadata: Optional[dict] = None

    class Config:
        from_attributes = True

class DeploymentUpdate(BaseModel):
    dispatch_id: str
    room_name: str
    deployment_status: str = "deployed"
    deployment_metadata: Optional[dict] = None

class DispatchRequest(BaseModel):
    phone_number: str
    transfer_to: Optional[str] = None

@router.post("/agents", response_model=AgentResponse)
async def create_agent(
    agent: AgentCreate,
    db: AsyncSession = Depends(get_db),
):
    if agent.agent_type not in ["restaurant-receptionist", "car-vendor"]:
        raise HTTPException(
            status_code=400,
            detail="Invalid agent type. Must be 'restaurant-receptionist' or 'car-vendor'"
        )
    
    new_agent = Agent(
        agent_type=agent.agent_type,
        name=agent.name,
        personality=agent.personality,
        status="active"
    )
    
    db.add(new_agent)
    await db.commit()
    await db.refresh(new_agent)
    
    agent_id = str(new_agent.id)
    process_info = None
    
    try:
        process_info = AgentProcessManager.start_agent(
            agent_id=agent_id,
            agent_name=agent.name,
            agent_personality=agent.personality,
            agent_type=agent.agent_type,
        )
        logger.info(f"✅ Started agent {agent_id} locally: {process_info}")
        print(f"✅ Started agent {agent_id} locally: {process_info}")
    except FileNotFoundError as e:
        error_msg = f"Agent script not found: {str(e)}"
        logger.error(f"❌ {error_msg}")
        print(f"❌ {error_msg}")
        new_agent.status = "error"
        await db.commit()
        process_info = {
            "status": "error",
            "error": error_msg,
        }
    except Exception as e:
        error_msg = f"Failed to start agent: {str(e)}"
        logger.error(f"❌ Failed to start agent {agent_id} locally: {e}", exc_info=True)
        print(f"❌ {error_msg}")
        new_agent.status = "error"
        await db.commit()
        process_info = {
            "status": "error",
            "error": error_msg,
        }
    
    return AgentResponse(
        id=agent_id,
        agent_type=new_agent.agent_type,
        name=new_agent.name,
        personality=new_agent.personality,
        created_at=new_agent.created_at,
        status=new_agent.status,
        process_info=process_info,
        dispatch_id=new_agent.dispatch_id,
        room_name=new_agent.room_name,
        deployment_status=new_agent.deployment_status,
        deployed_at=new_agent.deployed_at,
        deployment_metadata=new_agent.deployment_metadata,
    )

@router.get("/agents", response_model=list[AgentResponse])
async def list_agents(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Agent).order_by(Agent.created_at.desc()))
    agents = result.scalars().all()
    return [
        AgentResponse(
            id=str(agent.id),
            agent_type=agent.agent_type,
            name=agent.name,
            personality=agent.personality,
            created_at=agent.created_at,
            status=agent.status,
            dispatch_id=agent.dispatch_id,
            room_name=agent.room_name,
            deployment_status=agent.deployment_status,
            deployed_at=agent.deployed_at,
            deployment_metadata=agent.deployment_metadata,
        )
        for agent in agents
    ]

@router.get("/agents/{agent_id}", response_model=AgentResponse)
async def get_agent(agent_id: str, db: AsyncSession = Depends(get_db)):
    try:
        agent_uuid = uuid.UUID(agent_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid agent ID format")
    
    result = await db.execute(select(Agent).where(Agent.id == agent_uuid))
    agent = result.scalar_one_or_none()
    
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    return AgentResponse(
        id=str(agent.id),
        agent_type=agent.agent_type,
        name=agent.name,
        personality=agent.personality,
        created_at=agent.created_at,
        status=agent.status,
        dispatch_id=agent.dispatch_id,
        room_name=agent.room_name,
        deployment_status=agent.deployment_status,
        deployed_at=agent.deployed_at,
        deployment_metadata=agent.deployment_metadata,
    )

@router.delete("/agents/{agent_id}")
async def delete_agent(agent_id: str, db: AsyncSession = Depends(get_db)):
    try:
        agent_uuid = uuid.UUID(agent_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid agent ID format")
    
    result = await db.execute(select(Agent).where(Agent.id == agent_uuid))
    agent = result.scalar_one_or_none()
    
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    try:
        stop_result = AgentProcessManager.stop_agent(agent_id)
        logger.info(f"Stopped agent {agent_id}: {stop_result}")
    except Exception as e:
        logger.warning(f"Error stopping agent {agent_id}: {e}")
    
    await db.execute(delete(Agent).where(Agent.id == agent_uuid))
    await db.commit()
    
    return {"message": "Agent deleted successfully"}

@router.post("/agents/{agent_id}/start")
async def start_agent(agent_id: str, db: AsyncSession = Depends(get_db)):
    """Start a stopped agent"""
    try:
        agent_uuid = uuid.UUID(agent_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid agent ID format")
    
    result = await db.execute(select(Agent).where(Agent.id == agent_uuid))
    agent = result.scalar_one_or_none()
    
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    try:
        process_info = AgentProcessManager.start_agent(
            agent_id=agent_id,
            agent_name=agent.name,
            agent_personality=agent.personality,
            agent_type=agent.agent_type,
        )
        agent.status = "active"
        await db.commit()
        
        return {
            "message": "Agent started successfully",
            "process_info": process_info,
        }
    except Exception as e:
        logger.error(f"Failed to start agent {agent_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to start agent: {str(e)}")

@router.post("/agents/{agent_id}/stop")
async def stop_agent(agent_id: str, db: AsyncSession = Depends(get_db)):
    """Stop a running agent"""
    try:
        agent_uuid = uuid.UUID(agent_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid agent ID format")
    
    result = await db.execute(select(Agent).where(Agent.id == agent_uuid))
    agent = result.scalar_one_or_none()
    
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    try:
        stop_result = AgentProcessManager.stop_agent(agent_id)
        agent.status = "stopped"
        await db.commit()
        
        return {
            "message": "Agent stopped successfully",
            "stop_result": stop_result,
        }
    except Exception as e:
        logger.error(f"Failed to stop agent {agent_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to stop agent: {str(e)}")

@router.get("/agents/{agent_id}/status")
async def get_agent_status(agent_id: str):
    """Get the runtime status of an agent process"""
    try:
        uuid.UUID(agent_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid agent ID format")
    
    status = AgentProcessManager.get_agent_status(agent_id)
    return status

@router.get("/agents/running/list")
async def list_running_agents():
    """List all currently running agent processes"""
    return AgentProcessManager.list_running_agents()

@router.post("/agents/{agent_id}/deployment")
async def update_deployment(
    agent_id: str,
    deployment: DeploymentUpdate,
    db: AsyncSession = Depends(get_db),
):
    """
    Update deployment details for an agent after dispatching to LiveKit
    
    Args:
        agent_id: Agent ID from database
        deployment: Deployment information (dispatch_id, room_name, etc.)
    """
    try:
        agent_uuid = uuid.UUID(agent_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid agent ID format")
    
    result = await db.execute(select(Agent).where(Agent.id == agent_uuid))
    agent = result.scalar_one_or_none()
    
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    from datetime import datetime
    
    agent.dispatch_id = deployment.dispatch_id
    agent.room_name = deployment.room_name
    agent.deployment_status = deployment.deployment_status
    agent.deployed_at = datetime.utcnow()
    agent.deployment_metadata = deployment.deployment_metadata
    
    await db.commit()
    await db.refresh(agent)
    
    logger.info(f"Updated deployment for agent {agent_id}: dispatch_id={deployment.dispatch_id}, room={deployment.room_name}")
    
    return AgentResponse(
        id=str(agent.id),
        agent_type=agent.agent_type,
        name=agent.name,
        personality=agent.personality,
        created_at=agent.created_at,
        status=agent.status,
        dispatch_id=agent.dispatch_id,
        room_name=agent.room_name,
        deployment_status=agent.deployment_status,
        deployed_at=agent.deployed_at,
        deployment_metadata=agent.deployment_metadata,
    )

@router.post("/agents/{agent_id}/dispatch")
async def dispatch_agent(
    agent_id: str,
    dispatch: DispatchRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Dispatch an agent to LiveKit with phone number and transfer details
    
    Args:
        agent_id: Agent ID from database
        dispatch: Dispatch information (phone_number, transfer_to)
    """
    try:
        agent_uuid = uuid.UUID(agent_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid agent ID format")
    
    result = await db.execute(select(Agent).where(Agent.id == agent_uuid))
    agent = result.scalar_one_or_none()
    
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    # Determine agent name for LiveKit
    agent_name = "restaurant_receptionist"  # Default LiveKit agent name
    
    # Build metadata with agent info and dispatch details
    metadata = {
        "phone_number": dispatch.phone_number,
        "transfer_to": dispatch.transfer_to or "",
        "agent_id": agent_id,
        "agent_name": agent.name,
        "agent_personality": agent.personality,
    }
    
    try:
        # Get LiveKit credentials from environment
        livekit_url = os.getenv("LIVEKIT_URL")
        livekit_api_key = os.getenv("LIVEKIT_API_KEY")
        livekit_api_secret = os.getenv("LIVEKIT_API_SECRET")
        
        if not all([livekit_url, livekit_api_key, livekit_api_secret]):
            raise HTTPException(
                status_code=500,
                detail="LiveKit credentials not configured. Please set LIVEKIT_URL, LIVEKIT_API_KEY, and LIVEKIT_API_SECRET environment variables."
            )
        
        # Generate room name
        room_name = f"room-{uuid.uuid4().hex[:12]}"
        
        # Use LiveKit Python SDK if available, otherwise fall back to HTTP API
        try:
            from livekit import api as livekit_api
            
            # Set environment variables for LiveKit API (it reads from env vars)
            original_env = {}
            env_vars = {
                "LIVEKIT_URL": livekit_url,
                "LIVEKIT_API_KEY": livekit_api_key,
                "LIVEKIT_API_SECRET": livekit_api_secret,
            }
            
            # Temporarily set environment variables
            for key, value in env_vars.items():
                original_env[key] = os.environ.get(key)
                os.environ[key] = value
            
            try:
                # Initialize LiveKit API client (reads from env vars)
                lkapi = livekit_api.LiveKitAPI()
                
                # Create dispatch using LiveKit API (async)
                logger.info(f"Dispatching agent {agent_id} to room {room_name} with agent {agent_name}")
                
                dispatch_resp = await lkapi.agent_dispatch.create_dispatch(
                    livekit_api.CreateAgentDispatchRequest(
                        agent_name=agent_name,
                        room=room_name,
                        metadata=json.dumps(metadata),
                    )
                )
                
                await lkapi.aclose()
                
                # Log response structure for debugging
                logger.info(f"LiveKit API response type: {type(dispatch_resp)}")
                logger.info(f"LiveKit API response attributes: {dir(dispatch_resp)}")
                logger.info(f"LiveKit API response: {dispatch_resp}")
                
                # Extract dispatch_id and room from response
                # Try different possible attribute names
                dispatch_id = None
                if hasattr(dispatch_resp, 'dispatch_id'):
                    dispatch_id = dispatch_resp.dispatch_id
                elif hasattr(dispatch_resp, 'id'):
                    dispatch_id = dispatch_resp.id
                elif hasattr(dispatch_resp, 'dispatchId'):
                    dispatch_id = dispatch_resp.dispatchId
                elif isinstance(dispatch_resp, dict):
                    dispatch_id = dispatch_resp.get('dispatch_id') or dispatch_resp.get('id') or dispatch_resp.get('dispatchId')
                
                response_room = None
                if hasattr(dispatch_resp, 'room'):
                    response_room = dispatch_resp.room
                elif isinstance(dispatch_resp, dict):
                    response_room = dispatch_resp.get('room')
                
                room_name = response_room or room_name
                
                if not dispatch_id:
                    logger.error(f"Dispatch ID not found in response. Response object: {dispatch_resp}, Type: {type(dispatch_resp)}")
                    raise HTTPException(
                        status_code=500,
                        detail=f"Failed to get dispatch ID from LiveKit API response. Response: {str(dispatch_resp)}"
                    )
                
                logger.info(f"Successfully created dispatch: {dispatch_id} for room: {room_name}")
                
            finally:
                # Restore original environment variables
                for key, original_value in original_env.items():
                    if original_value is None:
                        os.environ.pop(key, None)
                    else:
                        os.environ[key] = original_value
            
        except ImportError as e:
            logger.warning(f"LiveKit SDK not available, using HTTP fallback: {e}")
            # Fallback to HTTP API if Python SDK not available
            api_base_url = livekit_url.rstrip('/')
            dispatch_url = f"{api_base_url}/twirp/livekit.DispatchService/CreateDispatch"
            
            dispatch_payload = {
                "agent_name": agent_name,
                "room": room_name,
                "metadata": json.dumps(metadata),
            }
            
            logger.info(f"Dispatching agent {agent_id} to room {room_name} with agent {agent_name}")
            
            # Create JWT token for LiveKit API authentication
            import jwt
            import time
            
            now = int(time.time())
            exp = now + 3600
            
            token_payload = {
                "iss": livekit_api_key,
                "exp": exp,
            }
            
            access_token = jwt.encode(token_payload, livekit_api_secret, algorithm="HS256")
            
            try:
                logger.info(f"Calling LiveKit API: {dispatch_url}")
                response = requests.post(
                    dispatch_url,
                    json=dispatch_payload,
                    headers={
                        "Authorization": f"Bearer {access_token}",
                        "Content-Type": "application/json",
                    },
                    timeout=30,
                )
                
                logger.info(f"LiveKit API response status: {response.status_code}")
                logger.info(f"LiveKit API response headers: {dict(response.headers)}")
                
                if response.status_code != 200:
                    error_msg = response.text or f"HTTP {response.status_code}"
                    logger.error(f"LiveKit API error (status {response.status_code}): {error_msg}")
                    raise HTTPException(
                        status_code=500,
                        detail=f"LiveKit API error: {error_msg}"
                    )
                
                if not response.text or not response.text.strip():
                    logger.error("LiveKit API returned empty response")
                    raise HTTPException(
                        status_code=500,
                        detail="LiveKit API returned empty response"
                    )
                
                try:
                    dispatch_data = response.json()
                except json.JSONDecodeError as e:
                    logger.error(f"Failed to parse LiveKit API response as JSON: {response.text[:500]}")
                    raise HTTPException(
                        status_code=500,
                        detail=f"LiveKit API returned invalid JSON: {str(e)}"
                    )
                
                logger.info(f"LiveKit API response data: {dispatch_data}")
                
                dispatch_id = dispatch_data.get("dispatch_id") or dispatch_data.get("id")
                room_name = dispatch_data.get("room") or room_name
                
                if not dispatch_id:
                    logger.error(f"Dispatch ID not found in response: {dispatch_data}")
                    raise HTTPException(
                        status_code=500,
                        detail="Failed to get dispatch ID from LiveKit API response"
                    )
                
                logger.info(f"Successfully created dispatch: {dispatch_id} for room: {room_name}")
            except HTTPException:
                raise
            except requests.RequestException as e:
                logger.error(f"HTTP request error: {e}", exc_info=True)
                raise HTTPException(
                    status_code=500,
                    detail=f"Failed to connect to LiveKit API: {str(e)}"
                )
            except json.JSONDecodeError as e:
                logger.error(f"JSON decode error: {e}", exc_info=True)
                raise HTTPException(
                    status_code=500,
                    detail=f"Failed to parse LiveKit API response: {str(e)}"
                )
        
        # Update agent with deployment details
        from datetime import datetime
        
        agent.dispatch_id = dispatch_id
        agent.room_name = room_name
        agent.deployment_status = "deployed"
        agent.deployed_at = datetime.utcnow()
        agent.deployment_metadata = {
            "phone_number": dispatch.phone_number,
            "transfer_to": dispatch.transfer_to,
            "dispatch_id": dispatch_id,
            "room_name": room_name,
        }
        
        await db.commit()
        await db.refresh(agent)
        
        logger.info(f"Successfully dispatched agent {agent_id}: dispatch_id={dispatch_id}, room={room_name}")
        
        return {
            "message": "Agent dispatched successfully",
            "dispatch_id": dispatch_id,
            "room_name": room_name,
            "agent": AgentResponse(
                id=str(agent.id),
                agent_type=agent.agent_type,
                name=agent.name,
                personality=agent.personality,
                created_at=agent.created_at,
                status=agent.status,
                dispatch_id=agent.dispatch_id,
                room_name=agent.room_name,
                deployment_status=agent.deployment_status,
                deployed_at=agent.deployed_at,
                deployment_metadata=agent.deployment_metadata,
            )
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error dispatching agent {agent_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to dispatch agent: {str(e)}")

