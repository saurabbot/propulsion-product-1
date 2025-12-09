import asyncio
import logging
import os
import subprocess
import sys
from pathlib import Path
from typing import Dict, Optional
import uuid
logger = logging.getLogger(__name__)

class AgentProcessManager:
    _processes: Dict[str, subprocess.Popen] = {}
    _base_path = Path(__file__).parent.parent.parent / "agent_orchest_and_deployment"

    @classmethod
    def start_agent(
        cls,
        agent_id: str,
        agent_name: str,
        agent_personality: str,
        agent_type: str,
    ) -> Dict[str, any]:
        """
        Start an agent process locally
        
        Args:
            agent_id: Unique identifier for the agent
            agent_name: Name of the agent
            agent_personality: Personality description
            agent_type: Type of agent (restaurant-receptionist, car-vendor)
        
        Returns:
            Dictionary with process information
        """
        if agent_id in cls._processes:
            logger.warning(f"Agent {agent_id} is already running")
            return {
                "status": "already_running",
                "agent_id": agent_id,
                "pid": cls._processes[agent_id].pid,
            }

        if agent_type == "restaurant-receptionist":
            script_path = cls._base_path / "template_restaurant_agent.py"
        elif agent_type == "car-vendor":
            script_path = cls._base_path / "template_car_vendor_agent.py"
        else:
            raise ValueError(f"Unknown agent type: {agent_type}")

        if not script_path.exists():
            raise FileNotFoundError(f"Agent script not found: {script_path}")

        env = os.environ.copy()
        env["AGENT_NAME"] = agent_name
        env["AGENT_PERSONALITY"] = agent_personality
        env["AGENT_ID"] = agent_id

        python_executable = sys.executable

        try:
            process = subprocess.Popen(
                [python_executable, str(script_path), "dev"],
                cwd=str(cls._base_path),
                env=env,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
            )

            cls._processes[agent_id] = process

            logger.info(
                f"Started agent {agent_id} (name: {agent_name}) with PID {process.pid}"
            )
            print(f"🚀 Started agent {agent_id} (name: {agent_name}) with PID {process.pid}")

            return {
                "status": "started",
                "agent_id": agent_id,
                "pid": process.pid,
                "agent_name": agent_name,
            }

        except Exception as e:
            error_msg = f"Failed to start agent {agent_id}: {e}"
            logger.error(error_msg, exc_info=True)
            print(f"❌ {error_msg}")
            raise

    @classmethod
    def stop_agent(cls, agent_id: str) -> Dict[str, any]:
        """
        Stop a running agent process
        
        Args:
            agent_id: Unique identifier for the agent
        
        Returns:
            Dictionary with stop status
        """
        if agent_id not in cls._processes:
            return {
                "status": "not_running",
                "agent_id": agent_id,
            }

        process = cls._processes[agent_id]

        try:
            process.terminate()
            process.wait(timeout=5)
            del cls._processes[agent_id]

            logger.info(f"Stopped agent {agent_id}")

            return {
                "status": "stopped",
                "agent_id": agent_id,
                "pid": process.pid,
            }

        except subprocess.TimeoutExpired:
            process.kill()
            del cls._processes[agent_id]

            logger.warning(f"Force killed agent {agent_id}")

            return {
                "status": "force_stopped",
                "agent_id": agent_id,
                "pid": process.pid,
            }

        except Exception as e:
            logger.error(f"Error stopping agent {agent_id}: {e}")
            raise

    @classmethod
    def get_agent_status(cls, agent_id: str) -> Dict[str, any]:
        """
        Get the status of an agent process
        
        Args:
            agent_id: Unique identifier for the agent
        
        Returns:
            Dictionary with agent status
        """
        if agent_id not in cls._processes:
            return {
                "status": "not_running",
                "agent_id": agent_id,
            }

        process = cls._processes[agent_id]
        return_code = process.poll()

        if return_code is None:
            return {
                "status": "running",
                "agent_id": agent_id,
                "pid": process.pid,
            }
        else:
            del cls._processes[agent_id]
            return {
                "status": "stopped",
                "agent_id": agent_id,
                "pid": process.pid,
                "return_code": return_code,
            }

    @classmethod
    def list_running_agents(cls) -> Dict[str, any]:
        """
        List all running agent processes
        
        Returns:
            Dictionary with all running agents
        """
        running = {}
        stopped = []

        for agent_id, process in list(cls._processes.items()):
            return_code = process.poll()
            if return_code is None:
                running[agent_id] = {
                    "pid": process.pid,
                    "status": "running",
                }
            else:
                stopped.append(agent_id)

        for agent_id in stopped:
            del cls._processes[agent_id]

        return {
            "running": running,
            "count": len(running),
        }

