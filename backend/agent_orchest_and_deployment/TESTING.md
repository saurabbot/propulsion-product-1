# Local Testing Guide for Restaurant Agent

## Prerequisites

1. **Python Environment**: Make sure you have Python 3.10+ installed
2. **LiveKit Server**: You need a LiveKit server (cloud or local)
3. **API Keys**: 
   - OpenAI API key (for GPT-4o)
   - Deepgram API key (for speech-to-text)
   - Cartesia API key (for text-to-speech)
   - LiveKit API key and secret

## Setup

### 1. Install Dependencies

```bash
cd backend
source venv/bin/activate
pip install -r requirements.txt
```

### 2. Create Environment File

Copy the example environment file and fill in your credentials:

```bash
cd agent_orchest_and_deployment
cp .env.agent.example .env.agent
```

Edit `.env.agent` with your actual API keys and LiveKit credentials.

### 3. Run in Console Mode (Text-based Testing)

Console mode allows you to test the agent without making actual phone calls:

```bash
cd backend/agent_orchest_and_deployment
python3 template_restaurant_agent.py console
```

In console mode:
- The agent will start and wait for input
- You can type messages to interact with the agent
- The agent will respond with text (no voice)
- No SIP calls will be made

### 4. Test with Custom Metadata

You can test with custom agent name and personality by setting environment variables or modifying the code temporarily:

```python
# In entrypoint function, you can hardcode test values:
agent_name = "Sophia"
agent_personality = "You are a warm and friendly restaurant receptionist with excellent customer service skills."
```

Or use environment variables:

```bash
export AGENT_NAME="Sophia"
export AGENT_PERSONALITY="You are a warm and friendly restaurant receptionist..."
python3 template_restaurant_agent.py console
```

## Testing Scenarios

### Console Mode Testing

1. **Start the agent**:
   ```bash
   python3 template_restaurant_agent.py console
   ```

2. **Interact with the agent**:
   - Type messages as if you're a customer
   - Test reservation requests
   - Test menu inquiries
   - Test call transfer requests

3. **Example conversation**:
   ```
   You: Hello, I'd like to make a reservation
   Agent: [Will respond with availability checking]
   
   You: Do you have availability tomorrow at 7pm?
   Agent: [Will check and respond]
   
   You: I'd like to speak to a human
   Agent: [Will confirm transfer request]
   ```

### Testing with LiveKit Room (Voice Testing)

1. **Start the agent**:
   ```bash
   python3 template_restaurant_agent.py dev
   ```

2. **Connect to the room** using LiveKit's web interface or SDK

3. **Test voice interactions**:
   - Speak to the agent
   - Test voice commands
   - Test function tools via voice

## Debugging

### Enable Debug Logging

Add this at the top of the file:

```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

### Common Issues

1. **Metadata parsing error**: 
   - In console mode, metadata is empty - this is expected
   - The agent will use default values

2. **Missing API keys**:
   - Make sure all required API keys are in `.env.agent`
   - Check that the file is named correctly

3. **LiveKit connection issues**:
   - Verify LIVEKIT_URL, API_KEY, and API_SECRET
   - Check network connectivity

## Testing Function Tools

The agent has several function tools you can test:

1. **check_reservation_availability**: Ask about table availability
2. **make_reservation**: Make a reservation
3. **get_menu_information**: Ask about the menu
4. **transfer_call**: Request to speak with a human
5. **end_call**: End the conversation

## Next Steps

Once console mode works:
1. Test with actual LiveKit room
2. Test with SIP calls (requires SIP trunk setup)
3. Deploy to production environment








