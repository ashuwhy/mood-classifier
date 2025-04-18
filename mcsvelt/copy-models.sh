#!/bin/bash

# Create the models directory in public if it doesn't exist
mkdir -p public/models

# Copy all model directories
cp -r vanailla/moodclassifier/models/* public/models/

echo "Models copied to public/models/ for development" 