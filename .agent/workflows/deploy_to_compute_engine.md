---
description: Deploy LiveKit Agent to Google Compute Engine
---

1. Authenticate with Google Cloud
   Run the following command to login. This will generate a URL for you to visit in your browser if it cannot open one automatically.
   ```bash
   gcloud auth login --no-launch-browser
   ```

2. List Projects
   View your available projects to find the Project ID:
   ```bash
   gcloud projects list
   ```

3. Set your Google Cloud Project
   Replace `[PROJECT_ID]` with your actual GCP project ID from the list above:
   ```bash
   gcloud config set project [PROJECT_ID]
   ```

4. Create the Compute Engine Instance
   We will create an `n2-standard-4` instance (4 vCPU, 16GB RAM) which is recommended for production workload.
   ```bash
   gcloud compute instances create livekit-agent-host \
       --machine-type=n2-standard-4 \
       --image-family=ubuntu-2204-lts \
       --image-project=ubuntu-os-cloud \
       --tags=http-server,https-server \
       --zone=us-central1-a
   ```

5. Prepare the Deployment Files
   Copy the agent code, requirements, and environment variables to the VM.
   ```bash
   gcloud compute scp \
       /Users/firefoxnambiar/codebag/propulsion_main/backend/agent_orchest_and_deployment/template_restaurant_agent.py \
       /Users/firefoxnambiar/codebag/propulsion_main/backend/requirements.txt \
       /Users/firefoxnambiar/codebag/propulsion_main/backend/agent_orchest_and_deployment/.env.agent \
       livekit-agent-host:~/ --zone=us-central1-a
   ```

6. Setup the VM Environment
   Install Python and dependencies on the remote VM.
   ```bash
   gcloud compute ssh livekit-agent-host --zone=us-central1-a --command "
       sudo apt-get update && \
       sudo apt-get install -y python3-pip python3-venv && \
       python3 -m venv venv && \
       source venv/bin/activate && \
       pip install -r requirements.txt
   "
   ```

7. Start the Agent
   Run the agent in production mode.
   ```bash
   gcloud compute ssh livekit-agent-host --zone=us-central1-a --command "
       source venv/bin/activate && \
       python3 template_restaurant_agent.py start
   "
   ```
