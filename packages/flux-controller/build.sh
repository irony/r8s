#!/bin/sh
set -e

# Build the r8s-controller Docker image
# Usage: ./build.sh [tag]

TAG=${1:-latest}
REGISTRY=${REGISTRY:-ghcr.io/r8s-io}

echo "Building r8s-controller:${TAG}..."

# Build
docker build -t ${REGISTRY}/flux-controller:${TAG} -f Dockerfile ..

# Push (optional)
if [ "$2" = "--push" ]; then
  echo "Pushing to ${REGISTRY}..."
  docker push ${REGISTRY}/flux-controller:${TAG}
fi

echo "Done!"
