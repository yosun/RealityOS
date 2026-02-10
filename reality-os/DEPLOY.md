# Deployment Guide (Static S3 + CloudFront)

## Overview
The application is deployed as a static site on AWS S3, served via CloudFront for HTTPS.
- **Frontend**: React (Vite) -> Static HTML/JS/CSS
- **Backend**: None (Services use client-side SDKs)
- **State**: Persisted to S3 via direct client calls from browser.

## Prerequisites
- AWS CLI configured
- `.agent/.credentials` with:
  - `VITE_FAL_KEY`
  - `VITE_AWS_ACCESS_KEY_ID`
  - `VITE_AWS_SECRET_ACCESS_KEY`
  - `VITE_S3_BUCKET_NAME`


2. **Lambda (Backend)**:
   - Function Name: `reality-os-proxy`
   - Runtime: Node.js 20.x
   - Env Vars: `GEMINI_KEY`, `FAL_KEY`, `S3_BUCKET_NAME`

## Deployment Steps

### Automated Workflows (Recommended)
You can use the agent workflows to deploy:
- **Full Deploy**: `agent run workflow deploy_full` (or similar) -> See `.agent/workflows/deploy_full.md`

### Manual Steps

1. **Deploy Backend (Lambda)**:
   ```bash
   ./deploy_lambda.sh
   ```
   *Updates the Lambda function code and configuration.*

2. **Deploy Frontend (Static)**:
   ```bash
   ./deploy_static.sh
   ```
   *Builds React app and syncs to S3.*

3. **Invalidate Cache**:
   ```bash
   aws cloudfront create-invalidation --distribution-id E2CBD72Y2YFIQT --paths "/*"
   ```

4. **Verify Deployment**:
   ```bash
   ./verify_deployment.sh
   ```
   *Checks S3 upload time and CloudFront invalidation status.*

## URLs
- **CloudFront (HTTPS)**: [https://d3o8kr3f57bjz6.cloudfront.net](https://d3o8kr3f57bjz6.cloudfront.net)
- **S3 (HTTP)**: [http://realityos.s3-website-us-east-1.amazonaws.com](http://realityos.s3-website-us-east-1.amazonaws.com)
