"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Play,
  Square,
  RefreshCw,
  Trash2,
  Activity,
  Clock,
  User,
  Rocket,
  ExternalLink,
} from "lucide-react";
import {
  agentsApi,
  type Agent,
  type DeploymentUpdate,
  type DispatchRequest,
} from "@/lib/api/agents";
import { ApiError } from "@/lib/api/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AgentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const agentId = params.id as string;

  const [agent, setAgent] = useState<Agent | null>(null);
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showDeploymentForm, setShowDeploymentForm] = useState(false);
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [dispatchData, setDispatchData] = useState({
    phone_number: "",
    transfer_to: "",
  });
  const [dispatchLoading, setDispatchLoading] = useState(false);
  const [dispatchSuccess, setDispatchSuccess] = useState(false);
  const [deploymentData, setDeploymentData] = useState({
    dispatch_id: "",
    room_name: "",
    deployment_status: "deployed",
  });

  const loadAgent = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await agentsApi.get(agentId);
      setAgent(data);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.data?.detail || err.message);
      } else {
        setError("Failed to load agent");
      }
    } finally {
      setLoading(false);
    }
  }, [agentId]);

  const loadStatus = useCallback(async () => {
    try {
      const data = await agentsApi.getStatus(agentId);
      setStatus(data);
    } catch (err) {
      console.error("Failed to load status:", err);
    }
  }, [agentId]);

  useEffect(() => {
    loadAgent();
    loadStatus();
    const interval = setInterval(loadStatus, 5000);
    return () => clearInterval(interval);
  }, [agentId, loadAgent, loadStatus]);

  const handleStart = async () => {
    try {
      setActionLoading("start");
      await agentsApi.start(agentId);
      await loadStatus();
      await loadAgent();
    } catch (err) {
      if (err instanceof ApiError) {
        alert(err.data?.detail || err.message);
      } else {
        alert("Failed to start agent");
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleStop = async () => {
    try {
      setActionLoading("stop");
      await agentsApi.stop(agentId);
      await loadStatus();
      await loadAgent();
    } catch (err) {
      if (err instanceof ApiError) {
        alert(err.data?.detail || err.message);
      } else {
        alert("Failed to stop agent");
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async () => {
    if (
      !confirm(
        "Are you sure you want to delete this agent? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      setActionLoading("delete");
      await agentsApi.delete(agentId);
      router.push("/");
    } catch (err) {
      if (err instanceof ApiError) {
        alert(err.data?.detail || err.message);
      } else {
        alert("Failed to delete agent");
      }
      setActionLoading(null);
    }
  };

  const handleUpdateDeployment = async () => {
    if (!deploymentData.dispatch_id || !deploymentData.room_name) {
      alert("Please fill in dispatch ID and room name");
      return;
    }

    try {
      setActionLoading("deployment");
      const deployment: DeploymentUpdate = {
        dispatch_id: deploymentData.dispatch_id,
        room_name: deploymentData.room_name,
        deployment_status: deploymentData.deployment_status,
        deployment_metadata: agent?.deployment_metadata || {},
      };
      const updated = await agentsApi.updateDeployment(agentId, deployment);
      setAgent(updated);
      setShowDeploymentForm(false);
      setDeploymentData({
        dispatch_id: "",
        room_name: "",
        deployment_status: "deployed",
      });
    } catch (err) {
      if (err instanceof ApiError) {
        alert(err.data?.detail || err.message);
      } else {
        alert("Failed to update deployment");
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleDispatch = async () => {
    if (!dispatchData.phone_number) {
      alert("Please enter a phone number");
      return;
    }

    try {
      setDispatchLoading(true);
      setDispatchSuccess(false);
      const dispatch: DispatchRequest = {
        phone_number: dispatchData.phone_number,
        transfer_to: dispatchData.transfer_to || undefined,
      };
      const result = await agentsApi.dispatch(agentId, dispatch);
      setAgent(result.agent);
      setDispatchSuccess(true);
      setTimeout(() => {
        setShowDispatchModal(false);
        setDispatchSuccess(false);
        setDispatchData({ phone_number: "", transfer_to: "" });
      }, 2000);
    } catch (err) {
      if (err instanceof ApiError) {
        alert(err.data?.detail || err.message);
      } else {
        alert("Failed to dispatch agent");
      }
    } finally {
      setDispatchLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
      case "running":
        return "bg-green-500";
      case "stopped":
      case "not_running":
        return "bg-gray-500";
      case "error":
        return "bg-red-500";
      default:
        return "bg-blue-500";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-8 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <Activity className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading agent...</p>
        </motion.div>
      </div>
    );
  }

  if (error || !agent) {
    return (
      <div className="min-h-screen bg-background p-8">
        <Button
          variant="ghost"
          onClick={() => router.push("/")}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
        <Card className="max-w-2xl mx-auto">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-destructive mb-4">
                {error || "Agent not found"}
              </p>
              <Button onClick={() => router.push("/")}>Go to Dashboard</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isRunning = status?.status === "running";
  const processInfo = agent.process_info || {};

  return (
    <div className="min-h-screen bg-background p-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-8"
      >
        <Button
          variant="ghost"
          onClick={() => router.push("/")}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-light tracking-tight mb-2">
              {agent.name}
            </h1>
            <p className="text-muted-foreground">Agent Details & Management</p>
          </div>
          <div className="flex items-center gap-2">
            <div
              className={`h-3 w-3 rounded-full ${getStatusColor(
                status?.status || agent.status
              )}`}
            />
            <span className="text-sm font-medium capitalize">
              {status?.status || agent.status}
            </span>
          </div>
        </div>
      </motion.div>

      <div className="grid gap-6 md:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-xl font-light">
                Agent Information
              </CardTitle>
              <CardDescription>Basic agent configuration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground">
                  Agent Type
                </label>
                <div className="mt-1">
                  <Badge variant="secondary">
                    {agent.agent_type === "restaurant-receptionist"
                      ? "Restaurant Receptionist"
                      : "Car Vendor"}
                  </Badge>
                </div>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Name</label>
                <p className="mt-1 font-medium">{agent.name}</p>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">
                  Personality
                </label>
                <p className="mt-1 text-sm">{agent.personality}</p>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Created</label>
                <p className="mt-1 text-sm flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  {formatDate(agent.created_at)}
                </p>
              </div>
              {processInfo.pid && (
                <div>
                  <label className="text-sm text-muted-foreground">
                    Process ID
                  </label>
                  <p className="mt-1 text-sm font-mono">{processInfo.pid}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-xl font-light">Actions</CardTitle>
              <CardDescription>Manage your agent</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                {!isRunning ? (
                  <Button
                    onClick={handleStart}
                    disabled={actionLoading !== null}
                    className="flex-1"
                    variant="default"
                  >
                    {actionLoading === "start" ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Starting...
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Start Agent
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    onClick={handleStop}
                    disabled={actionLoading !== null}
                    className="flex-1"
                    variant="destructive"
                  >
                    {actionLoading === "stop" ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Stopping...
                      </>
                    ) : (
                      <>
                        <Square className="h-4 w-4 mr-2" />
                        Stop Agent
                      </>
                    )}
                  </Button>
                )}
                <Button
                  onClick={loadStatus}
                  disabled={actionLoading !== null}
                  variant="outline"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>

              <div className="pt-4 border-t">
                <Button
                  onClick={handleDelete}
                  disabled={actionLoading !== null}
                  variant="destructive"
                  className="w-full"
                >
                  {actionLoading === "delete" ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Agent
                    </>
                  )}
                </Button>
              </div>

              {status && (
                <div className="pt-4 border-t space-y-2">
                  <label className="text-sm text-muted-foreground">
                    Runtime Status
                  </label>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Status</span>
                      <Badge variant={isRunning ? "default" : "secondary"}>
                        {status.status}
                      </Badge>
                    </div>
                    {status.pid && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          Process ID
                        </span>
                        <span className="text-sm font-mono">{status.pid}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-6 grid gap-6 md:grid-cols-2"
      >
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-xl font-light">Agent ID</CardTitle>
            <CardDescription>
              Use this ID for API calls and dispatch commands
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-3 rounded-lg bg-muted/50 font-mono text-sm break-all">
              {agent.id}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-light">Deployment</CardTitle>
                <CardDescription>
                  LiveKit deployment information
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => setShowDispatchModal(true)}
                  >
                    <Rocket className="h-4 w-4 mr-2" />
                    Dispatch to LiveKit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDeploymentForm(!showDeploymentForm)}
                  >
                    Add Deployment
                  </Button>
                </>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {showDeploymentForm && !agent.dispatch_id ? (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="dispatch_id">Dispatch ID</Label>
                  <Input
                    id="dispatch_id"
                    value={deploymentData.dispatch_id}
                    onChange={(e) =>
                      setDeploymentData({
                        ...deploymentData,
                        dispatch_id: e.target.value,
                      })
                    }
                    placeholder="AD_xxxxx"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="room_name">Room Name</Label>
                  <Input
                    id="room_name"
                    value={deploymentData.room_name}
                    onChange={(e) =>
                      setDeploymentData({
                        ...deploymentData,
                        room_name: e.target.value,
                      })
                    }
                    placeholder="room-xxxxx"
                    className="mt-1"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleUpdateDeployment}
                    disabled={actionLoading !== null}
                    className="flex-1"
                  >
                    {actionLoading === "deployment" ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Deployment"
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowDeploymentForm(false);
                      setDeploymentData({
                        dispatch_id: "",
                        room_name: "",
                        deployment_status: "deployed",
                      });
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : agent.dispatch_id ? (
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-muted-foreground">
                    Deployment Status
                  </label>
                  <div className="mt-1">
                    <Badge
                      variant={
                        agent.deployment_status === "deployed"
                          ? "default"
                          : "secondary"
                      }
                    >
                      {agent.deployment_status || "Not Deployed"}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">
                    Dispatch ID
                  </label>
                  <p className="mt-1 text-sm font-mono">{agent.dispatch_id}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">
                    Room Name
                  </label>
                  <p className="mt-1 text-sm font-mono">{agent.room_name}</p>
                </div>
                {agent.deployed_at && (
                  <div>
                    <label className="text-sm text-muted-foreground">
                      Deployed At
                    </label>
                    <p className="mt-1 text-sm flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      {formatDate(agent.deployed_at)}
                    </p>
                  </div>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowDeploymentForm(true);
                    setDeploymentData({
                      dispatch_id: agent.dispatch_id || "",
                      room_name: agent.room_name || "",
                      deployment_status: agent.deployment_status || "deployed",
                    });
                  }}
                  className="w-full"
                >
                  Update Deployment
                </Button>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground mb-4">
                  No deployment information
                </p>
                <p className="text-xs text-muted-foreground">
                  After dispatching to LiveKit, add the deployment details here
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Dispatch Modal */}
      {showDispatchModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => !dispatchLoading && setShowDispatchModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 12 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 12 }}
            transition={{ type: "spring", damping: 24, stiffness: 260 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md bg-card/95 border border-border/60 rounded-xl shadow-2xl overflow-hidden"
          >
            {dispatchSuccess && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1.3, opacity: [0, 0.8, 0] }}
                transition={{ duration: 1.2 }}
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: [0, 1, 1.1] }}
                  transition={{ type: "spring", stiffness: 180, damping: 14 }}
                  className="w-20 h-20 rounded-full bg-green-500/15 flex items-center justify-center"
                >
                  <Rocket className="h-10 w-10 text-green-500" />
                </motion.div>
              </motion.div>
            )}

            <div className="relative p-6 space-y-6">
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="text-center"
              >
                <motion.div
                  animate={{ rotate: dispatchLoading ? 360 : 0 }}
                  transition={{
                    duration: 2.2,
                    repeat: dispatchLoading ? Infinity : 0,
                    ease: "linear",
                  }}
                  className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mb-3"
                >
                  <Rocket className="h-7 w-7 text-primary" />
                </motion.div>
                <h2 className="text-xl font-light mb-1">Dispatch to LiveKit</h2>
                <p className="text-sm text-muted-foreground">
                  Send this agent to make a live call
                </p>
              </motion.div>

              {!dispatchSuccess && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.12 }}
                  className="space-y-4"
                >
                  <div>
                    <Label htmlFor="phone_number" className="text-sm font-medium">
                      Phone Number <span className="text-destructive">*</span>
                    </Label>
                    <motion.div whileFocus={{ scale: 1.01 }}>
                      <Input
                        id="phone_number"
                        type="tel"
                        value={dispatchData.phone_number}
                        onChange={(e) =>
                          setDispatchData({
                            ...dispatchData,
                            phone_number: e.target.value,
                          })
                        }
                        placeholder="+1234567890"
                        className="mt-2"
                        disabled={dispatchLoading}
                      />
                    </motion.div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Number must be E.164 formatted
                    </p>
                  </div>

                    <div>
                    <Label htmlFor="transfer_to" className="text-sm font-medium">
                      Transfer To (Optional)
                    </Label>
                    <motion.div whileFocus={{ scale: 1.01 }}>
                      <Input
                        id="transfer_to"
                        type="tel"
                        value={dispatchData.transfer_to}
                        onChange={(e) =>
                          setDispatchData({
                            ...dispatchData,
                            transfer_to: e.target.value,
                          })
                        }
                        placeholder="+1234567890"
                        className="mt-2"
                        disabled={dispatchLoading}
                      />
                    </motion.div>
                  </div>

                  {dispatchLoading && (
                    <div className="relative h-28 overflow-hidden rounded-lg bg-muted/50 border border-border/60">
                      {[...Array(16)].map((_, i) => (
                        <motion.div
                          key={i}
                          className="absolute w-1.5 h-1.5 rounded-full bg-primary/50"
                          initial={{
                            x: Math.random() * 100 + "%",
                            y: Math.random() * 100 + "%",
                            opacity: 0,
                          }}
                          animate={{
                            y: ["-40%", "140%"],
                            opacity: [0, 1, 0],
                            scale: [0.7, 1.2, 0.7],
                          }}
                          transition={{
                            duration: 1.6,
                            repeat: Infinity,
                            delay: i * 0.08,
                            ease: "easeInOut",
                          }}
                        />
                      ))}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <motion.div
                            animate={{ scale: [1, 1.08, 1] }}
                            transition={{ duration: 1.4, repeat: Infinity }}
                          >
                            <Activity className="h-7 w-7 text-primary mx-auto mb-2 animate-spin" />
                          </motion.div>
                          <p className="text-sm font-medium">Dispatching agent</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Creating LiveKit dispatch
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {dispatchSuccess && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="p-4 rounded-lg bg-primary/5 border border-primary/20 text-center"
                    >
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", delay: 0.15 }}
                        className="inline-flex items-center justify-center w-11 h-11 rounded-full bg-primary/15 mb-2"
                      >
                        <Rocket className="h-6 w-6 text-primary" />
                      </motion.div>
                      <p className="text-sm font-medium text-primary">
                        Dispatch Successful
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Agent is now deployed to LiveKit
                      </p>
                    </motion.div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <Button
                      onClick={handleDispatch}
                      disabled={dispatchLoading || !dispatchData.phone_number}
                      className="flex-1"
                    >
                      {dispatchLoading ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Dispatching...
                        </>
                      ) : (
                        <>
                          <Rocket className="h-4 w-4 mr-2" />
                          Dispatch Agent
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowDispatchModal(false);
                        setDispatchData({ phone_number: "", transfer_to: "" });
                        setDispatchSuccess(false);
                      }}
                      disabled={dispatchLoading}
                    >
                      Cancel
                    </Button>
                  </div>
                </motion.div>
              )}

              {dispatchSuccess && (
                <motion.div
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="text-center space-y-3"
                >
                  <motion.div
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 0.7, repeat: 2 }}
                  >
                    <div className="text-3xl mb-1">🎉</div>
                  </motion.div>
                  <p className="text-lg font-medium">Agent Dispatched</p>
                  {agent?.dispatch_id && (
                    <div className="p-3 rounded-lg bg-muted/50 space-y-2 border border-border/60">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          Dispatch ID
                        </span>
                        <span className="font-mono">{agent.dispatch_id}</span>
                      </div>
                      {agent.room_name && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Room</span>
                          <span className="font-mono">{agent.room_name}</span>
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
