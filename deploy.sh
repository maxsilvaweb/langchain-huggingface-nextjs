#!/bin/bash
set -euo pipefail

# Deploy script for GCP Cloud Run
# Prerequisites:
#   1. gcloud CLI installed and authenticated (gcloud auth login)
#   2. Terraform installed
#   3. terraform.tfvars filled in (copy from terraform.tfvars.example)

PROJECT_ID=$(grep 'project_id' terraform/terraform.tfvars | head -1 | cut -d'"' -f2)
REGION=$(grep 'region' terraform/terraform.tfvars | head -1 | cut -d'"' -f2)
REGISTRY="${REGION}-docker.pkg.dev/${PROJECT_ID}/rag-chat"

echo "=== Building and pushing container images ==="

# Configure Docker for Artifact Registry
gcloud auth configure-docker "${REGION}-docker.pkg.dev" --quiet

# Build and push Next.js frontend
echo "--- Building web (Next.js) ---"
docker build -t "${REGISTRY}/web:latest" .
docker push "${REGISTRY}/web:latest"

# Build and push Python API
echo "--- Building api (Python) ---"
docker build -t "${REGISTRY}/api:latest" ./python-service
docker push "${REGISTRY}/api:latest"

echo "=== Applying Terraform ==="
cd terraform
terraform init
terraform apply -auto-approve

echo "=== Deployment complete ==="
terraform output
