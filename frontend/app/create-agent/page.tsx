'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Sparkles, Loader2, CheckCircle2, Zap, Rocket, Star } from 'lucide-react'
import { agentsApi } from '@/lib/api/agents'
import { ApiError } from '@/lib/api/client'

const agentTypes = [
  { value: 'restaurant-receptionist', label: 'Restaurant Receptionist Agent' },
  { value: 'car-vendor', label: 'Car Vendor Agent' },
]

const getParticleVariants = (index: number) => {
  const angle = (index * 137.5) % 360
  const distance = 100 + (index % 3) * 30
  const x = Math.cos((angle * Math.PI) / 180) * distance
  const y = Math.sin((angle * Math.PI) / 180) * distance

  return {
    initial: { scale: 0, opacity: 0, x: 0, y: 0 },
    animate: {
      scale: [0, 1.5, 0],
      opacity: [0, 1, 0],
      x: [0, x, 0],
      y: [0, y, 0],
    },
    transition: {
      duration: 2 + (index % 3) * 0.5,
      repeat: Infinity,
      delay: (index % 10) * 0.1,
      ease: [0.42, 0, 0.58, 1] as const,
    },
  }
}

const iconVariants = {
  rotate: {
    rotate: [0, 360],
    scale: [1, 1.2, 1],
  },
  pulse: {
    scale: [1, 1.3, 1],
    opacity: [1, 0.7, 1],
  },
}

export default function CreateAgent() {
  const router = useRouter()
  const [agentType, setAgentType] = useState<string>('')
  const [description, setDescription] = useState<string>('')
  const [isCreating, setIsCreating] = useState(false)
  const [particles, setParticles] = useState<number[]>([])
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleCreate = async () => {
    if (!agentType || !description.trim()) return

    setError(null)
    setIsCreating(true)
    setParticles(Array.from({ length: 50 }, (_, i) => i))

    try {
      const descriptionLines = description.trim().split('\n').filter(line => line.trim())
      const name = descriptionLines[0]?.trim() || 'Unnamed Agent'
      const personality = descriptionLines.length > 1
        ? descriptionLines.slice(1).join('\n').trim()
        : description.trim()

      await agentsApi.create({
        agent_type: agentType,
        name: name,
        personality: personality,
      })

      setSuccess(true)
      setIsCreating(false)
      setParticles([])

      setTimeout(() => {
        router.push('/')
      }, 2000)
    } catch (err) {
      setIsCreating(false)
      setParticles([])

      if (err instanceof ApiError) {
        setError(err.data?.detail || err.message)
      } else {
        setError('Failed to create agent. Please try again.')
      }
    }
  }

  return (
    <div className="min-h-screen bg-background p-8 relative overflow-hidden">
      <AnimatePresence>
        {isCreating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center"
          >
            <div className="relative w-full h-full flex items-center justify-center">
              {particles.map((particle) => {
                const IconComponent = [Sparkles, Zap, Star, Rocket][particle % 4]
                const colors = ['text-primary', 'text-yellow-500', 'text-blue-500', 'text-purple-500']

                return (
                  <motion.div
                    key={particle}
                    variants={getParticleVariants(particle)}
                    initial="initial"
                    animate="animate"
                    transition={getParticleVariants(particle).transition}
                    className="absolute"
                    style={{
                      left: '50%',
                      top: '50%',
                    }}
                  >
                    <motion.div
                      animate={{
                        rotate: [0, 360],
                        scale: [1, 1.2, 1],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: [0, 0, 1, 1] as const,
                      }}
                    >
                      <IconComponent className={`h-6 w-6 ${colors[particle % 4]}`} />
                    </motion.div>
                  </motion.div>
                )
              })}

              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                className="relative z-10"
              >
                <Card className="w-96 border-border/50 bg-card/90 backdrop-blur-sm">
                  <CardContent className="pt-6 flex flex-col items-center justify-center space-y-4">
                    {success ? (
                      <>
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                        >
                          <CheckCircle2 className="h-16 w-16 text-green-500" />
                        </motion.div>
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2 }}
                          className="text-center"
                        >
                          <h3 className="text-2xl font-light mb-2">Agent Created!</h3>
                          <p className="text-muted-foreground">Redirecting to dashboard...</p>
                        </motion.div>
                      </>
                    ) : (
                      <>
                        <motion.div
                          animate={{
                            scale: [1, 1.3, 1],
                            opacity: [1, 0.7, 1],
                          }}
                          transition={{
                            duration: 1,
                            repeat: Infinity,
                            ease: [0.42, 0, 0.58, 1] as const,
                          }}
                        >
                          <Loader2 className="h-16 w-16 text-primary animate-spin" />
                        </motion.div>
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2 }}
                          className="text-center"
                        >
                          <h3 className="text-2xl font-light mb-2">Creating Agent</h3>
                          <p className="text-muted-foreground">Bringing your agent to life...</p>
                        </motion.div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="mb-8"
      >
        <Button
          variant="ghost"
          onClick={() => router.push('/')}
          className="mb-4"
        >
          ← Back to Dashboard
        </Button>
        <h1 className="text-4xl font-light tracking-tight mb-2">Create Voice Agent</h1>
        <p className="text-muted-foreground">Configure your new voice agent below.</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        className="max-w-2xl mx-auto"
      >
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-xl font-light">Agent Configuration</CardTitle>
            <CardDescription>Select the type of agent and provide details about its personality.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-2"
            >
              <Label htmlFor="agent-type">Agent Type</Label>
              <Select value={agentType} onValueChange={setAgentType}>
                <SelectTrigger id="agent-type" className="w-full">
                  <SelectValue placeholder="Select an agent type" />
                </SelectTrigger>
                <SelectContent>
                  {agentTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="space-y-2"
            >
              <Label htmlFor="description">Name & Personality</Label>
              <Textarea
                id="description"
                placeholder="First line: Agent name&#10;Following lines: Personality description, tone, and behavior..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[200px] resize-none"
              />
              <p className="text-xs text-muted-foreground">
                First line will be used as the agent name. Remaining lines describe the agent&apos;s personality, communication style, and behavior.
              </p>
            </motion.div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-lg bg-destructive/10 border border-destructive/20"
              >
                <p className="text-sm text-destructive">{error}</p>
              </motion.div>
            )}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                onClick={handleCreate}
                disabled={!agentType || !description.trim() || isCreating || success}
                className="w-full"
                size="lg"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Agent...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Create Agent
                  </>
                )}
              </Button>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

