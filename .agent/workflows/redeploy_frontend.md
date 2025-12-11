# Quick Guide: Redeploy Frontend to Cloud Run

## Quick Redeploy Steps

### 1. Navigate to Frontend Directory
```bash
cd /Users/firefoxnambiar/codebag/propulsion_main/frontend
```

### 2. Build Docker Image
```bash
docker build -t asia-south1-docker.pkg.dev/propulsion-480819/propulsion-frontend/nextjs-app:latest .
```

### 3. Push to Artifact Registry
```bash
docker push asia-south1-docker.pkg.dev/propulsion-480819/propulsion-frontend/nextjs-app:latest
```

### 4. Deploy to Cloud Run
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

### 5. (Optional) Update Environment Variables
If you need to update the backend API URL:
```bash
gcloud run services update propulsion-frontend \
  --region=asia-south1 \
  --set-env-vars="NEXT_PUBLIC_API_URL=https://your-backend-url.com"
```

### 6. Get the Deployed URL
```bash
gcloud run services describe propulsion-frontend --region=asia-south1 --format='value(status.url)'
```

## One-Line Redeploy (All Steps Combined)
```bash
cd /Users/firefoxnambiar/codebag/propulsion_main/frontend && \
docker build -t asia-south1-docker.pkg.dev/propulsion-480819/propulsion-frontend/nextjs-app:latest . && \
docker push asia-south1-docker.pkg.dev/propulsion-480819/propulsion-frontend/nextjs-app:latest && \
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

## Notes
- Make sure you're authenticated: `gcloud auth configure-docker asia-south1-docker.pkg.dev`
- The build process may take a few minutes
- Cloud Run will automatically create a new revision with zero downtime

