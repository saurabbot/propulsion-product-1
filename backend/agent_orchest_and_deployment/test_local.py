#!/usr/bin/env python3
"""
Local testing script for the restaurant agent.
This script helps test the agent with custom metadata without needing a full LiveKit setup.
"""

import asyncio
import json
import os
from dotenv import load_dotenv

load_dotenv(dotenv_path=".env.agent")

def create_test_metadata(
    agent_name: str = "Sophia",
    agent_personality: str = "You are a warm and friendly restaurant receptionist with excellent customer service skills.",
    phone_number: str = "",
    transfer_to: str = "",
) -> str:
    """Create test metadata JSON string"""
    metadata = {
        "agent_name": agent_name,
        "agent_personality": agent_personality,
        "phone_number": phone_number,
        "transfer_to": transfer_to,
    }
    return json.dumps(metadata)

if __name__ == "__main__":
    print("=" * 60)
    print("Restaurant Agent - Local Testing Helper")
    print("=" * 60)
    print()
    print("This script helps you test the agent with custom metadata.")
    print()
    
    agent_name = input("Enter agent name (default: Sophia): ").strip() or "Sophia"
    print()
    print("Enter agent personality (press Enter twice when done):")
    personality_lines = []
    while True:
        line = input()
        if not line and personality_lines:
            break
        if line:
            personality_lines.append(line)
    
    agent_personality = "\n".join(personality_lines) or "You are a warm and friendly restaurant receptionist with excellent customer service skills."
    
    phone_number = input("\nEnter phone number (optional, for SIP testing): ").strip()
    transfer_to = input("Enter transfer number (optional): ").strip()
    
    metadata = create_test_metadata(
        agent_name=agent_name,
        agent_personality=agent_personality,
        phone_number=phone_number,
        transfer_to=transfer_to,
    )
    
    print("\n" + "=" * 60)
    print("Generated Metadata:")
    print("=" * 60)
    print(json.dumps(json.loads(metadata), indent=2))
    print()
    print("=" * 60)
    print("To test with this metadata:")
    print("=" * 60)
    print("1. Set the metadata in your LiveKit job when deploying")
    print("2. Or modify template_restaurant_agent.py temporarily to use:")
    print()
    print(f'   metadata = {repr(metadata)}')
    print()
    print("Then run: python3 template_restaurant_agent.py console")
    print("=" * 60)


