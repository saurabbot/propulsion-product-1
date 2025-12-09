# How to Check if Agents are Running

## 1. Check the Create Agent Response

When you create an agent, the response includes `process_info`:

```bash
curl http://localhost:8000/api/v1/agents \
  -H "Content-Type: application/json" \
  -d '{
    "agent_type": "restaurant-receptionist",
    "name": "Sophia",
    "personality": "You are warm and friendly..."
  }'
```

Look for `process_info` in the response:
- `"status": "started"` - Agent started successfully
- `"status": "error"` - Agent failed to start (check `error` field)
- `"pid": 12345` - Process ID if started

## 2. List All Running Agents

```bash
curl http://localhost:8000/api/v1/agents/running/list
```

This shows all currently running agent processes.

## 3. Check Specific Agent Status

```bash
curl http://localhost:8000/api/v1/agents/{agent_id}/status
```

Replace `{agent_id}` with your agent's ID.

## 4. Check Server Logs

Look in your terminal where `uvicorn` is running. You should see:
- ✅ `Started agent {id} locally: {process_info}` - Success
- ❌ `Failed to start agent {id}` - Error (check the error message)

## 5. Check Process List

You can also check running Python processes:

```bash
ps aux | grep template_restaurant_agent
```

This shows all running agent processes.

## Common Issues

1. **Agent script not found**: Check that `template_restaurant_agent.py` exists in `agent_orchest_and_deployment/`
2. **Permission errors**: Make sure the script is executable
3. **Missing dependencies**: Check that all required packages are installed
4. **Environment variables**: Make sure `.env.agent` exists with required API keys


