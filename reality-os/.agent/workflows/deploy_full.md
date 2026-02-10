---
description: Full deployment of RealityOS (Frontend + Backend)
---

# RealityOS Full Deployment Workflow

This workflow deploys both the static frontend (S3/CloudFront) and the backend proxy (Lambda).

## 1. Pre-Deployment Check
Ensure your git working tree is clean and you are on the `main` branch.

```bash
git status
```

## 2. Deploy Backend (Lambda)
The backend handles API proxying (Gemini, FAL) and requires environment variables.

// turbo
```bash
./deploy_lambda.sh
```

## 3. Deploy Frontend (Static)
Builds the React application and syncs to S3.

// turbo
```bash
./deploy_static.sh
```

## 4. Invalidate CloudFront Cache
Ensures users see the latest version immediately.

// turbo
```bash
aws cloudfront create-invalidation --distribution-id E2CBD72Y2YFIQT --paths "/*"
```

## 5. Verify Deployment
Check when the latest deployment went live.

// turbo
```bash
./verify_deployment.sh
```
