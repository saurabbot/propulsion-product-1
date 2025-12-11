'use client'

import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { TrendingUp, Users, DollarSign, Activity, ArrowUpRight, ArrowDownRight, Mic, Trash2 } from 'lucide-react'
import { agentsApi, type Agent } from '@/lib/api/agents'
import { ApiError } from '@/lib/api/client'

const getStats = (agents: Agent[]) => {
  const totalAgents = agents.length
  const restaurantAgents = agents.filter(a => a.agent_type === 'restaurant-receptionist').length
  const carVendorAgents = agents.filter(a => a.agent_type === 'car-vendor').length
  const activeAgents = agents.filter(a => a.status === 'active').length

  return [
    {
      title: 'Total Agents',
      value: totalAgents.toString(),
      change: '',
      trend: 'up' as const,
      icon: Users,
      delay: 0.1,
    },
    {
      title: 'Restaurant Agents',
      value: restaurantAgents.toString(),
      change: '',
      trend: 'up' as const,
      icon: TrendingUp,
      delay: 0.2,
    },
    {
      title: 'Car Vendor Agents',
      value: carVendorAgents.toString(),
      change: '',
      trend: 'up' as const,
      icon: Activity,
      delay: 0.3,
    },
    {
      title: 'Active Agents',
      value: activeAgents.toString(),
      change: '',
      trend: 'up' as const,
      icon: DollarSign,
      delay: 0.4,
    },
  ]
}


const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
  },
}

const cardHoverVariants = {
  rest: { scale: 1, y: 0 },
  hover: {
    scale: 1.02,
    y: -4,
  },
}

export default function Dashboard() {
  const router = useRouter()
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadAgents()
  }, [])

  const loadAgents = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await agentsApi.list()
      setAgents(data)
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.data?.detail || err.message)
      } else {
        setError('Failed to load agents')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this agent?')) return

    try {
      await agentsApi.delete(id)
      setAgents(agents.filter(agent => agent.id !== id))
    } catch (err) {
      if (err instanceof ApiError) {
        alert(err.data?.detail || err.message)
      } else {
        alert('Failed to delete agent')
      }
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="mb-8 flex items-center justify-between"
      >
        <div>
          <h1 className="text-4xl font-light tracking-tight mb-2">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, here&apos;s what&apos;s happening today.</p>
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.5, type: 'spring' }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button
            onClick={() => router.push('/create-agent')}
            className="flex items-center gap-2"
            size="lg"
          >
            <Mic className="h-4 w-4" />
            Create Voice Agent
          </Button>
        </motion.div>
      </motion.div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8"
      >
        {getStats(agents).map((stat) => {
          const Icon = stat.icon
          return (
            <motion.div
              key={stat.title}
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              transition={{
                duration: 0.5,
                ease: [0.22, 1, 0.36, 1] as const,
              }}
            >
              <motion.div
                variants={cardHoverVariants}
                transition={{
                  duration: 0.3,
                  ease: [0.22, 1, 0.36, 1] as const,
                }}
              >
                <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {stat.title}
                    </CardTitle>
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ delay: stat.delay, duration: 0.5, type: 'spring' }}
                    >
                      <Icon className="h-4 w-4 text-muted-foreground" />
                    </motion.div>
                  </CardHeader>
                  <CardContent>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: stat.delay + 0.2 }}
                      className="text-2xl font-light mb-1"
                    >
                      {stat.value}
                    </motion.div>
                    <motion.p
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: stat.delay + 0.3 }}
                      className="text-xs text-muted-foreground flex items-center gap-1"
                    >
                      {stat.trend === 'up' ? (
                        <ArrowUpRight className="h-3 w-3 text-green-500" />
                      ) : (
                        <ArrowDownRight className="h-3 w-3 text-red-500" />
                      )}
                      {stat.change && (
                        <>
                          <span className={stat.trend === 'up' ? 'text-green-500' : 'text-red-500'}>
                            {stat.change}
                          </span>
                          <span>from last month</span>
                        </>
                      )}
                    </motion.p>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          )
        })}
      </motion.div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid gap-6 md:grid-cols-2"
      >
        <motion.div
          variants={itemVariants}
          transition={{
            duration: 0.5,
            ease: [0.22, 1, 0.36, 1] as const,
          }}
        >
          <motion.div
            whileHover="hover"
            initial="rest"
            animate="rest"
            variants={cardHoverVariants}
            transition={{
              duration: 0.3,
              ease: [0.22, 1, 0.36, 1] as const,
            }}
          >
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-xl font-light">Overview</CardTitle>
                <CardDescription>Performance metrics for the last 30 days</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[65, 45, 80, 55].map((value, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + index * 0.1 }}
                      className="space-y-2"
                    >
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Week {index + 1}</span>
                        <span className="font-medium">{value}%</span>
                      </div>
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${value}%` }}
                          transition={{ delay: 0.7 + index * 0.1, duration: 0.8, ease: [0.16, 1, 0.3, 1] as const }}
                          className="h-full bg-primary rounded-full"
                        />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="md:col-span-2"
          transition={{
            duration: 0.5,
            ease: [0.22, 1, 0.36, 1] as const,
          }}
        >
          <motion.div
            whileHover="hover"
            initial="rest"
            animate="rest"
            variants={cardHoverVariants}
            transition={{
              duration: 0.3,
              ease: [0.22, 1, 0.36, 1] as const,
            }}
          >
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-xl font-light">Voice Agents</CardTitle>
                <CardDescription>Your created voice agents</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Activity className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : error ? (
                  <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                    <p className="text-sm text-destructive">{error}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={loadAgents}
                      className="mt-2"
                    >
                      Retry
                    </Button>
                  </div>
                ) : agents.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">No agents created yet</p>
                    <Button
                      onClick={() => router.push('/create-agent')}
                      variant="outline"
                    >
                      Create Your First Agent
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {agents.map((agent, index) => (
                      <motion.div
                        key={agent.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 + index * 0.1 }}
                        className="flex items-center justify-between p-4 rounded-lg border border-border/50 bg-background/50 hover:bg-accent/50 transition-colors cursor-pointer"
                        onClick={() => router.push(`/agents/${agent.id}`)}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-medium">{agent.name}</p>
                            <Badge variant="secondary" className="text-xs">
                              {agent.agent_type === 'restaurant-receptionist' ? 'Restaurant' : 'Car Vendor'}
                            </Badge>
                            {agent.deployment_status && (
                              <Badge
                                variant={agent.deployment_status === 'deployed' ? 'default' : 'outline'}
                                className="text-xs"
                              >
                                {agent.deployment_status === 'deployed' ? 'Deployed' : agent.deployment_status}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2 mb-1">
                            {agent.personality}
                          </p>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span>Created {formatDate(agent.created_at)}</span>
                            {agent.room_name && (
                              <span className="font-mono">Room: {agent.room_name}</span>
                            )}
                          </div>
                        </div>
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.6 + index * 0.1, type: 'spring' }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(agent.id)}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </motion.div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  )
}
