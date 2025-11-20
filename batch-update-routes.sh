#!/bin/bash

# Script to update all API routes with logging
echo "Updating API routes with logging..."

# Define routes to update
routes=(
  "src/app/api/session/create/route.ts"
  "src/app/api/memory/route.ts"
  "src/app/api/memory/get/route.ts"
  "src/app/api/pre-trip/route.ts"
  "src/app/api/in-trip/route.ts"
  "src/app/api/conveyance/route.ts"
  "src/app/api/stay/route.ts"
  "src/app/api/travel-dates/route.ts"
  "src/app/api/utility/conveyance/route.ts"
  "src/app/api/utility/stay/route.ts"
)

echo "Found ${#routes[@]} routes to update"
for route in "${routes[@]}"; do
  if [ -f "$route" ]; then
    echo "✓ $route exists"
  else
    echo "✗ $route not found"
  fi
done

