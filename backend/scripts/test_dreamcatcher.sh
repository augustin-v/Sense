#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Testing AI Dreamcatcher API ===${NC}"

# 1. Test One-Click Dream Creation
echo -e "${GREEN}Testing complete dream creation...${NC}"
COMPLETE_RESPONSE=$(curl -s -X POST http://127.0.0.1:8080/api/dreams/create-complete \
  -H "Content-Type: application/json" \
  -d '{
    "theme": "AI and Metis L2 blockchain evolution",
    "reasoning_steps": ["Historical context", "Current capabilities", "Future potential", "Integration possibilities"]
  }')

DREAM_ID=$(echo $COMPLETE_RESPONSE | grep -o '"dream_id":"[^"]*' | sed 's/"dream_id":"//')
SVG_URL=$(echo $COMPLETE_RESPONSE | grep -o '"svg_url":"[^"]*' | sed 's/"svg_url":"//')

echo "Created dream with ID: $DREAM_ID"
echo "SVG URL: $SVG_URL"

# 2. Download SVG visualization
echo -e "${GREEN}Downloading SVG visualization...${NC}"
curl -s -X GET "http://127.0.0.1:8080$SVG_URL" > complete_dream.svg
echo "SVG saved to complete_dream.svg"

# 3. Test individual API endpoints
echo -e "${GREEN}Testing individual dream creation...${NC}"
DREAM_RESPONSE=$(curl -s -X POST http://127.0.0.1:8080/api/dreams \
  -H "Content-Type: application/json" \
  -d '{"theme": "Custom AI dream testing"}')

CUSTOM_DREAM_ID=$(echo $DREAM_RESPONSE | grep -o '"id":"[^"]*' | sed 's/"id":"//')
echo "Created custom dream with ID: $CUSTOM_DREAM_ID"

# 4. Add a step
echo -e "${GREEN}Adding reasoning step...${NC}"
STEP_RESPONSE=$(curl -s -X POST http://127.0.0.1:8080/api/dreams/$CUSTOM_DREAM_ID/steps \
  -H "Content-Type: application/json" \
  -d '{"description": "Test step", "prompt": "Test prompt"}')

STEP_ID=$(echo $STEP_RESPONSE | grep -o '"step_id":[0-9]*' | sed 's/"step_id"://')
echo "Added step with ID: $STEP_ID"

# 5. Process the step
echo -e "${GREEN}Processing step...${NC}"
curl -s -X POST http://127.0.0.1:8080/api/dreams/$CUSTOM_DREAM_ID/steps/$STEP_ID/process \
  -H "Content-Type: application/json" \
  -d '{"description": "Analysis", "prompt": "Analyze the potential of Metis L2 blockchain"}' > /dev/null

# 6. Anchor to blockchain
echo -e "${GREEN}Anchoring to blockchain...${NC}"
ANCHOR_RESPONSE=$(curl -s -X POST http://127.0.0.1:8080/api/dreams/$CUSTOM_DREAM_ID/steps/$STEP_ID/anchor)
TX_HASH=$(echo $ANCHOR_RESPONSE | grep -o '"tx_hash":"[^"]*' | sed 's/"tx_hash":"//')
echo "Anchored with transaction: $TX_HASH"

# 7. Generate SVG
echo -e "${GREEN}Generating SVG...${NC}"
curl -s -X GET http://127.0.0.1:8080/api/dreams/$CUSTOM_DREAM_ID/svg > custom_dream.svg
echo "SVG saved to custom_dream.svg"

# 8. Test continuous dreaming
echo -e "${GREEN}Testing continuous dreaming...${NC}"
CONTINUOUS_RESPONSE=$(curl -s -X POST http://127.0.0.1:8080/api/dreams/continuous/start \
  -H "Content-Type: application/json" \
  -d '{"theme": "Continuous evolution of AI and Metis"}')

CONTINUOUS_DREAM_ID=$(echo $CONTINUOUS_RESPONSE | grep -o '"initial_dream_id":"[^"]*' | sed 's/"initial_dream_id":"//')
echo "Started continuous dreaming with initial ID: $CONTINUOUS_DREAM_ID"

# Wait briefly to let the background process start
sleep 2

# 9. Check continuous dream status
echo -e "${GREEN}Checking continuous dream...${NC}"
curl -s -X GET http://127.0.0.1:8080/api/dreams/$CONTINUOUS_DREAM_ID > /dev/null

# 10. Stop continuous dreaming
echo -e "${GREEN}Stopping continuous dreaming...${NC}"
STOP_RESPONSE=$(curl -s -X GET "http://127.0.0.1:8080/api/dreams/continuous/stop?id=$CONTINUOUS_DREAM_ID")
echo "Stopped continuous dreaming: $(echo $STOP_RESPONSE | grep -o '"status":"[^"]*' | sed 's/"status":"//')"

echo -e "${BLUE}=== Testing completed ===${NC}"
echo "Check complete_dream.svg and custom_dream.svg to view the AI visualizations"

