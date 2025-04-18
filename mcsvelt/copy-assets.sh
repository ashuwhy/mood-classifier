#!/bin/bash

# Create directories
mkdir -p dist/models
mkdir -p dist/workers

# Copy worker scripts to dist directory
cp public/workers/featureExtraction.js dist/workers/
cp public/workers/inference.js dist/workers/

# Copy models from the vanilla app to the dist directory
cp -r vanailla/moodclassifier/models/mood_happy-musicnn-msd-2 dist/models/
cp -r vanailla/moodclassifier/models/mood_sad-musicnn-msd-2 dist/models/
cp -r vanailla/moodclassifier/models/mood_relaxed-musicnn-msd-2 dist/models/
cp -r vanailla/moodclassifier/models/mood_aggressive-musicnn-msd-2 dist/models/
cp -r vanailla/moodclassifier/models/danceability-musicnn-msd-2 dist/models/

echo "Assets copied successfully to dist directory" 