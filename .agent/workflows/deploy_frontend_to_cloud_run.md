---
description: Deploy Next.js Frontend to Google Cloud Run
---

# Deploy Next.js Frontend to Google Cloud Run

## Prerequisites
- Docker installed locally
- Google Cloud SDK (`gcloud`) configured
- Billing enabled on your GCP project

## Step 1: Set Your Project
```bash
gcloud config set project propulsion-480819
```

## Step 2: Enable Required APIs
```bash
gcloud services enable \
  cloudbuild.googleapis.com \
  run.googleapis.com \
  artifactregistry.googleapis.com
```

## Step 3: Create Artifact Registry Repository
```bash
gcloud artifacts repositories create propulsion-frontend \
  --repository-format=docker \
  --location=asia-south1 \
  --description="Docker repository for Propulsion frontend"
```

## Step 4: Configure Docker Authentication
```bash
gcloud auth configure-docker asia-south1-docker.pkg.dev
```

## Step 5: Build and Push Docker Image
Navigate to the frontend directory and build:
```bash
cd /Users/firefoxnambiar/codebag/propulsion_main

docker build -t asia-south1-docker.pkg.dev/propulsion-480819/propulsion-frontend/nextjs-app:latest .

docker push asia-south1-docker.pkg.dev/propulsion-480819/propulsion-frontend/nextjs-app:latest
```

## Step 6: Deploy to Cloud Run
```bash
gcloud run deploy propulsion-frontend \
  --image=asia-south1-docker.pkg.dev/propulsion-480819/propulsion-frontend/nextjs-app:latest \
  --platform=managed \
  --region=asia-south1 \
  --allow-unauthenticated \
  --port=3000 \
  --memory=512Mi \
  --cpu=1 \
  --min-instances=0 \
  --max-instances=10
```

## Step 7: Get the Deployed URL
After deployment, Cloud Run will provide a URL like:
```
https://propulsion-frontend-xxxxx-uc.a.run.app
```

## Step 7: Configure Backend API URL
**IMPORTANT**: Update the frontend to point to your deployed backend API.

First, you need to know your backend URL. If you haven't deployed the backend yet, you have a few options:

### Option A: Deploy Backend to Cloud Run (Recommended)
Deploy your FastAPI backend to Cloud Run and get its URL:
```bash
# Navigate to backend directory
cd /Users/firefoxnambiar/codebag/propulsion_main/backend

# Deploy backend to Cloud Run
gcloud run deploy propulsion-backend \
  --source=. \
  --region=asia-south1 \
  --allow-unauthenticated \
  --port=8000 \
  --memory=1Gi \
  --cpu=1

# Get the backend URL (it will look like: https://propulsion-backend-xxxxx-uc.a.run.app)
gcloud run services describe propulsion-backend --region=asia-south1 --format='value(status.url)'
```

### Option B: Use Existing Backend URL
If your backend is already deployed elsewhere, use that URL.

### Option C: Use ngrok for Local Backend (Development Only)
If testing with a local backend:
```bash
# In a separate terminal, start your backend
cd /Users/firefoxnambiar/codebag/propulsion_main/backend
uvicorn app.main:app --host 0.0.0.0 --port 8000

# In another terminal, expose it with ngrok
ngrok http 8000
# Copy the https URL provided by ngrok
```

Once you have your backend URL, update the frontend deployment:
```bash
gcloud run services update propulsion-frontend \
  --region=asia-south1 \
  --set-env-vars="NEXT_PUBLIC_API_URL=https://your-backend-url.com"
```

**Replace `https://your-backend-url.com` with your actual backend URL from Option A, B, or C above.**

## Step 8: Verify the Deployment
Test that your frontend can communicate with the backend:
```bash
# Get your frontend URL
gcloud run services describe propulsion-frontend --region=asia-south1 --format='value(status.url)'

# Visit the URL in your browser and check the browser console for any API errors
```

## Step 9: Get the Deployed URL

## Optional: Set Up Custom Domain
1. Go to Cloud Run console
2. Select your service
3. Click "Manage Custom Domains"
4. Follow the instructions to map your domain

## Continuous Deployment (Optional)
To set up automatic deployments from GitHub:
```bash
gcloud run deploy propulsion-frontend \
  --source=. \
  --region=asia-south1 \
  --allow-unauthenticated
```

This will automatically build and deploy whenever you push to your repository.
