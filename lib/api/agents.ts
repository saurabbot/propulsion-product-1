import { api } from './client'

export interface Agent {
  id: string
  agent_type: string
  name: string
  personality: string
  created_at: string
  status: string
  process_info?: {
    status?: string
    agent_id?: string
    pid?: number
    agent_name?: string
    error?: string
  }
  dispatch_id?: string | null
  room_name?: string | null
  deployment_status?: string | null
  deployed_at?: string | null
  deployment_metadata?: Record<string, any> | null
}

export interface DeploymentUpdate {
  dispatch_id: string
  room_name: string
  deployment_status?: string
  deployment_metadata?: Record<string, any>
}

export interface DispatchRequest {
  phone_number: string
  transfer_to?: string
}

export interface DispatchResponse {
  message: string
  dispatch_id: string
  room_name: string
  output: string
  agent: Agent
}

export interface CreateAgentRequest {
  agent_type: string
  name: string
  personality: string
}

export const agentsApi = {
  create: async (data: CreateAgentRequest): Promise<Agent> => {
    return api.post<Agent>('/api/v1/agents', data)
  },

  list: async (): Promise<Agent[]> => {
    return api.get<Agent[]>('/api/v1/agents')
  },

  get: async (id: string): Promise<Agent> => {
    return api.get<Agent>(`/api/v1/agents/${id}`)
  },

  delete: async (id: string): Promise<{ message: string }> => {
    return api.delete<{ message: string }>(`/api/v1/agents/${id}`)
  },

  updateDeployment: async (id: string, deployment: DeploymentUpdate): Promise<Agent> => {
    return api.post<Agent>(`/api/v1/agents/${id}/deployment`, deployment)
  },

  dispatch: async (id: string, dispatch: DispatchRequest): Promise<DispatchResponse> => {
    return api.post<DispatchResponse>(`/api/v1/agents/${id}/dispatch`, dispatch)
  },
}

