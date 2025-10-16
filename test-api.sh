#!/bin/bash

# UCLA Recreation API Test Script
# Tests both John Wooden Center and BruinFit facilities

BASE_URL="http://localhost:3001/api/occupancy"

echo "🏋️ UCLA Recreation API Test"
echo "=========================="
echo ""

# Test John Wooden Center
echo "📍 Testing John Wooden Center (JWC)..."
JWC_RESPONSE=$(curl -s -X GET "${BASE_URL}?facility=jwc")
JWC_NAME=$(echo "$JWC_RESPONSE" | jq -r '.data[0].name')
JWC_ZONES=$(echo "$JWC_RESPONSE" | jq '.data[0].zones | length')
JWC_TOTAL=$(echo "$JWC_RESPONSE" | jq '[.data[0].zones[].currentOccupancy] | add')

if [ "$JWC_NAME" = "John Wooden Center" ]; then
    echo "✅ JWC: $JWC_NAME - $JWC_ZONES zones - $JWC_TOTAL total people"
else
    echo "❌ JWC: Failed - Expected 'John Wooden Center', got '$JWC_NAME'"
fi

echo ""

# Test BruinFit
echo "📍 Testing BruinFit (BFIT)..."
BFIT_RESPONSE=$(curl -s -X GET "${BASE_URL}?facility=bfit")
BFIT_NAME=$(echo "$BFIT_RESPONSE" | jq -r '.data[0].name')
BFIT_ZONES=$(echo "$BFIT_RESPONSE" | jq '.data[0].zones | length')
BFIT_TOTAL=$(echo "$BFIT_RESPONSE" | jq '[.data[0].zones[].currentOccupancy] | add')

if [ "$BFIT_NAME" = "Bruin Fitness Center" ]; then
    echo "✅ BFIT: $BFIT_NAME - $BFIT_ZONES zones - $BFIT_TOTAL total people"
else
    echo "❌ BFIT: Failed - Expected 'Bruin Fitness Center', got '$BFIT_NAME'"
fi

echo ""

# Test default (should return JWC)
echo "📍 Testing Default (should return JWC)..."
DEFAULT_RESPONSE=$(curl -s -X GET "$BASE_URL")
DEFAULT_NAME=$(echo "$DEFAULT_RESPONSE" | jq -r '.data[0].name')

if [ "$DEFAULT_NAME" = "John Wooden Center" ]; then
    echo "✅ Default: Returns $DEFAULT_NAME (correct)"
else
    echo "❌ Default: Failed - Expected 'John Wooden Center', got '$DEFAULT_NAME'"
fi

echo ""
echo "🎯 API Test Complete!"
echo ""
echo "📊 Summary:"
echo "  • John Wooden Center: $JWC_ZONES zones, $JWC_TOTAL people"
echo "  • BruinFit: $BFIT_ZONES zones, $BFIT_TOTAL people"
echo ""
echo "🔗 API Endpoints:"
echo "  • JWC: $BASE_URL?facility=jwc"
echo "  • BruinFit: $BASE_URL?facility=bfit"
echo "  • Default: $BASE_URL"
