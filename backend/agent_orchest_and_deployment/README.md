# Restaurant Receptionist Agent Template

This template creates a configurable restaurant receptionist agent for LiveKit that can be deployed with custom name and personality.

## Template Features

- **Configurable Agent Name**: Set the agent's name during deployment
- **Custom Personality**: Define the agent's personality, tone, and behavior
- **Restaurant-Specific Tools**: Built-in functions for reservations, menu inquiries, and availability checks
- **Call Transfer**: Ability to transfer calls to human agents
- **Voice Interface**: Full voice-based interaction using LiveKit agents

## Deployment Metadata

When deploying the agent, pass the following metadata in JSON format:

```json
{
  "agent_name": "Sophia",
  "agent_personality": "You are a warm and friendly restaurant receptionist with a cheerful personality. You speak in a professional yet approachable manner. You're knowledgeable about the restaurant's menu and always eager to help customers.",
  "phone_number": "+1234567890",
  "transfer_to": "+1234567891"
}
```

### Required Fields

- `agent_name`: The name of the agent (e.g., "Sophia", "Alex")
- `agent_personality`: Detailed description of the agent's personality, communication style, and behavior
- `phone_number`: Phone number to dial for outbound calls

### Optional Fields

- `transfer_to`: Phone number to transfer calls to when requested

## Agent Capabilities

The agent includes the following function tools:

1. **check_reservation_availability**: Check table availability for a specific date and party size
2. **make_reservation**: Create a reservation with date, time, party size, and special requests
3. **get_menu_information**: Provide information about the menu, specials, and dishes
4. **transfer_call**: Transfer the call to a human agent
5. **end_call**: End the call gracefully
6. **detected_answering_machine**: Handle voicemail detection

## Usage Example

```python
from app.services.agent_deployment import deploy_restaurant_agent

result = await deploy_restaurant_agent(
    agent_id="agent-123",
    agent_name="Sophia",
    agent_personality="Friendly and professional restaurant receptionist...",
    phone_number="+1234567890",
    transfer_to="+1234567891",
    livekit_api_key="your-api-key",
    livekit_api_secret="your-api-secret",
    livekit_url="https://your-livekit-server.com",
)
```

## Environment Variables

Set the following environment variables:

- `SIP_OUTBOUND_TRUNK_ID` or `SIP_TRUNK_ID`: SIP trunk ID for outbound calls
- `AGENT_NAME`: Name identifier for the agent worker
- `LIVEKIT_URL`: LiveKit server URL
- `LIVEKIT_API_KEY`: LiveKit API key
- `LIVEKIT_API_SECRET`: LiveKit API secret

## Running the Agent

```bash
python template_restaurant_agent.py
```

The agent will:
1. Connect to the LiveKit room
2. Parse metadata to get agent name and personality
3. Initialize the agent with custom instructions
4. Start the agent session
5. Dial the specified phone number
6. Handle the conversation using the configured personality


