#!/bin/bash
set -e

echo "=== Building frontend ==="
cd frontend
npm run build
cd ..

echo "=== Deploying infrastructure ==="
cd terraform
terraform apply -auto-approve

# Grab outputs
BUCKET=$(terraform output -raw frontend_bucket)
CF_ID=$(terraform output -raw frontend_url | sed 's|https://||')

echo "=== Uploading to S3 ==="
aws s3 sync ../frontend/dist "s3://$BUCKET" --delete

echo "=== Invalidating CloudFront cache ==="
CF_DIST_ID=$(aws cloudfront list-distributions --query "DistributionList.Items[?DomainName=='$CF_ID'].Id" --output text)
aws cloudfront create-invalidation --distribution-id "$CF_DIST_ID" --paths "/*"

echo ""
echo "=== Deployed! ==="
terraform output frontend_url