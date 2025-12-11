# How to View Agent Logs

## For Dispatched Agents (LiveKit Cloud)

### 1. View Dispatch Logs via CLI

```bash
livekit-cli dispatch logs restaurant-receptionist-agent
```

Or for a specific dispatch ID:
```bash
livekit-cli dispatch logs --dispatch-id AD_EBbfz5XRrunq
```

### 2. View Room Logs

If you know the room name:
```bash
livekit-cli room logs room-Bc872WoBASaq
```

### 3. List Active Dispatches

```bash
livekit-cli dispatch list
```

### 4. Get Dispatch Details

```bash
livekit-cli dispatch get AD_EBbfz5XRrunq
```

## For Locally Running Agents

### 1. Check Process Output

The agent process runs as a subprocess. You can check its output by:

```bash
# Find the process
ps aux | grep template_restaurant_agent

# Check process details
ps -p 39357 -o pid,cmd,etime
```

### 2. View in Server Logs

Check your FastAPI server terminal - you should see:
- `🚀 Started agent {id} (name: {name}) with PID {pid}`
- Any errors from the agent process

### 3. Check Agent Status via API

```bash
curl http://localhost:8000/api/v1/agents/{agent_id}/status
```

### 4. List All Running Agents

```bash
curl http://localhost:8000/api/v1/agents/running/list
```

## LiveKit Dashboard

You can also view logs in the LiveKit dashboard:
1. Go to your LiveKit project dashboard
2. Navigate to "Rooms" or "Agents"
3. Find your room/agent and view logs there

## Real-time Monitoring

For real-time log streaming:

```bash
livekit-cli dispatch logs restaurant-receptionist-agent --follow
```

This will stream logs as they come in.

## Common Log Locations

- **Local agent logs**: Check the FastAPI server terminal output
- **Cloud agent logs**: Use `livekit-cli dispatch logs`
- **Room logs**: Use `livekit-cli room logs {room_name}`
- **Process logs**: Check subprocess output in the agent_runner service








