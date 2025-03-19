#!/bin/bash

source .env

echo $SUPABASE_PROJECT_REF

# Ensure the directory exists
mkdir -p src/types

# Correct the file path
npx supabase gen types typescript --project-id $SUPABASE_PROJECT_REF > src/types/database.ts