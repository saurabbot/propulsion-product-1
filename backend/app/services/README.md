# Agent Runner Service

This service manages local agent processes. When an agent is created via the API, it automatically starts the agent locally.

## Features

- **Automatic Start**: Agents start automatically when created
- **Process Management**: Track and manage running agent processes
- **Start/Stop Control**: Start and stop agents via API endpoints
- **Status Monitoring**: Check the status of running agents

## API Endpoints

### Create Agent (Auto-starts)
```
POST /api/v1/agents
```
Creates an agent in the database and automatically starts it locally.

### Start Agent
```
POST /api/v1/agents/{agent_id}/start
```
Manually start a stopped agent.

### Stop Agent
```
POST /api/v1/agents/{agent_id}/stop
```
Stop a running agent.

### Get Agent Status
```
GET /api/v1/agents/{agent_id}/status
```
Get the runtime status of an agent process.

### List Running Agents
```
GET /api/v1/agents/running/list
```
List all currently running agent processes.

## How It Works

1. When an agent is created, the API calls `AgentProcessManager.start_agent()`
2. The service spawns a subprocess running the agent template script
3. Environment variables (`AGENT_NAME`, `AGENT_PERSONALITY`) are passed to the process
4. The process runs in console mode for local testing
5. Process information is stored and can be queried

## Process Management

The `AgentProcessManager` class maintains a dictionary of running processes:
- Processes are tracked by agent ID
- Automatic cleanup when processes stop
- Graceful termination with timeout
- Force kill if graceful termination fails

## Local Testing

Agents run in console mode locally, which means:
- Text-based interaction (no voice)
- No SIP calls
- Perfect for development and testing
- Uses environment variables for configuration


