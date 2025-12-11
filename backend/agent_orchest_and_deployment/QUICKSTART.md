# Quick Start - Local Testing

## Step 1: Setup Environment

```bash
cd backend/agent_orchest_and_deployment

# Create .env.agent file (copy from example)
cp .env.agent.example .env.agent

# Edit .env.agent with your API keys
# Required:
# - LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET
# - OPENAI_API_KEY
# - DEEPGRAM_API_KEY  
# - CARTESIA_API_KEY
```

## Step 2: Run in Console Mode

```bash
# From backend/agent_orchest_and_deployment directory
python3 template_restaurant_agent.py console
```

This will:
- Start the agent in text-based console mode
- Use default agent name and personality (since no metadata in console mode)
- Allow you to type messages and interact with the agent
- Skip SIP calls (no phone dialing)

## Step 3: Test Custom Name & Personality

### Option A: Use Environment Variables

```bash
export AGENT_NAME="Sophia"
export AGENT_PERSONALITY="You are a warm and cheerful restaurant receptionist who loves helping customers."
python3 template_restaurant_agent.py console
```

### Option B: Modify Code Temporarily

Edit `template_restaurant_agent.py` in the `entrypoint` function:

```python
# Around line 171-172, change:
agent_name = "Sophia"  # Your custom name
agent_personality = "You are a warm and friendly restaurant receptionist..."  # Your custom personality
```

Then run:
```bash
python3 template_restaurant_agent.py console
```

### Option C: Use Test Script

```bash
python3 test_local.py
# Follow prompts to generate metadata
# Then use the generated metadata in your deployment
```

## Step 4: Test Interactions

Once the agent is running, you can test:

1. **Reservations**: "I'd like to make a reservation"
2. **Availability**: "Do you have tables available tomorrow?"
3. **Menu**: "What's on your menu today?"
4. **Transfer**: "Can I speak to a human?"
5. **End call**: "Thank you, goodbye"

## Troubleshooting

**Error: "failed to decode job metadata"**
- This is normal in console mode - metadata is empty
- Agent will use default values

**Error: Missing API keys**
- Check `.env.agent` file exists and has all required keys
- Verify file is named exactly `.env.agent` (not `.env`)

**Agent not responding**
- Check console for error messages
- Verify API keys are valid
- Check network connectivity

## Next: Deploy with Metadata

When deploying to LiveKit, pass metadata as JSON:

```json
{
  "agent_name": "Sophia",
  "agent_personality": "You are a warm and friendly restaurant receptionist...",
  "phone_number": "+1234567890",
  "transfer_to": "+1234567891"
}
```








