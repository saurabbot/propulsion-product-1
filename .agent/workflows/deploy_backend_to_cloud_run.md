---
description: Deploy FastAPI Backend to Google Cloud Run
---

# Deploy FastAPI Backend to Google Cloud Run

## Prerequisites
- Google Cloud SDK (`gcloud`) configured
- Billing enabled on your GCP project
- Docker installed locally (optional, Cloud Run can build for you)

## Step 1: Set Your Project
```bash
gcloud config set project propulsion-480819
```

## Step 2: Enable Required APIs
```bash
gcloud services enable \
  cloudbuild.googleapis.com \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  sqladmin.googleapis.com
```

## Step 3: Deploy Backend to Cloud Run
Navigate to the backend directory and deploy directly from source:
```bash
cd /Users/firefoxnambiar/codebag/propulsion_main/backend

gcloud run deploy propulsion-backend \
  --source=. \
  --region=asia-south1 \
  --allow-unauthenticated \
  --port=8000 \
  --memory=1Gi \
  --cpu=1 \
  --min-instances=0 \
  --max-instances=10 \
  --timeout=300
```

This command will:
- Automatically build your Docker image using Cloud Build
- Push it to Artifact Registry
- Deploy it to Cloud Run

## Step 4: Get the Backend URL
After deployment, get your backend URL:
```bash
gcloud run services describe propulsion-backend \
  --region=asia-south1 \
  --format='value(status.url)'
```

The URL will look like: `https://propulsion-backend-xxxxx-uc.a.run.app`

## Step 5: Test the Backend
Test that your backend is working:
```bash
# Get the URL
BACKEND_URL=$(gcloud run services describe propulsion-backend --region=asia-south1 --format='value(status.url)')

# Test the health endpoint
curl $BACKEND_URL/api/v1/health

# Test the root endpoint
curl $BACKEND_URL/
```

## Step 6: Update Frontend to Use Backend URL
Update your frontend to point to the deployed backend:

### For Local Development:
Create or update `.env.local`:
```bash
echo "NEXT_PUBLIC_API_URL=$BACKEND_URL" > /Users/firefoxnambiar/codebag/propulsion_main/.env.local
```

### For Deployed Frontend:
Update the Cloud Run service:
```bash
gcloud run services update propulsion-frontend \
  --region=asia-south1 \
  --set-env-vars="NEXT_PUBLIC_API_URL=$BACKEND_URL"
```

## Optional: Set Environment Variables
If your backend needs environment variables (database URLs, API keys, etc.):
```bash
gcloud run services update propulsion-backend \
  --region=asia-south1 \
  --set-env-vars="DATABASE_URL=your-database-url,LIVEKIT_API_KEY=your-key"
```

Or use secrets for sensitive data:
```bash
# Create a secret
echo -n "your-secret-value" | gcloud secrets create my-secret --data-file=-

# Grant Cloud Run access to the secret
gcloud secrets add-iam-policy-binding my-secret \
  --member="serviceAccount:PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

# Update service to use secret
gcloud run services update propulsion-backend \
  --region=asia-south1 \
  --set-secrets="MY_SECRET=my-secret:latest"
```

## Optional: Set Up Cloud SQL Database
If you need a PostgreSQL database:

### Create Cloud SQL Instance:
```bash
gcloud sql instances create propulsion-db \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region=asia-south1
```

### Create Database:
```bash
gcloud sql databases create propulsion --instance=propulsion-db
```

### Connect Cloud Run to Cloud SQL:
```bash
gcloud run services update propulsion-backend \
  --region=asia-south1 \
  --add-cloudsql-instances=propulsion-480819:asia-south1:propulsion-db \
  --set-env-vars="DATABASE_URL=postgresql://user:password@/propulsion?host=/cloudsql/propulsion-480819:asia-south1:propulsion-db"
```

## Monitoring and Logs
View logs:
```bash
gcloud run services logs read propulsion-backend --region=asia-south1 --limit=50
```

View metrics in Cloud Console:
```bash
gcloud run services describe propulsion-backend --region=asia-south1
```

## Continuous Deployment
For automatic deployments, you can:
1. Use Cloud Build triggers connected to your Git repository
2. Set up GitHub Actions with Workload Identity Federation
3. Use the `--source` flag which automatically rebuilds on push

## Troubleshooting

### Check deployment status:
```bash
gcloud run services describe propulsion-backend --region=asia-south1
```

### View recent logs:
```bash
gcloud run services logs read propulsion-backend --region=asia-south1 --limit=100
```

### Test locally with Docker:
```bash
cd /Users/firefoxnambiar/codebag/propulsion_main/backend
docker build -t propulsion-backend .
docker run -p 8000:8000 propulsion-backend
```

## Cost Optimization
- Cloud Run charges only for actual usage
- Set `--min-instances=0` to scale to zero when not in use
- Use `--max-instances` to cap costs
- Monitor usage in Cloud Console billing section
