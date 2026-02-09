#!/bin/bash

# N8N Quick Start Script for LocalCart
# This script starts n8n and provides helpful getting started information

echo "==========================================="
echo "  LocalCart n8n Automation Quick Start"
echo "==========================================="
echo ""

# Check if docker-compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ docker-compose is not installed. Please install it first."
    exit 1
fi

# Start n8n service
echo "🚀 Starting n8n service..."
docker-compose up -d n8n

# Wait for n8n to be ready
echo "⏳ Waiting for n8n to start (this may take 30 seconds)..."
sleep 10

# Check if n8n is running
if docker ps | grep -q localcart-n8n; then
    echo "✅ n8n is running!"
    echo ""
    echo "==========================================="
    echo "  n8n Access Information"
    echo "==========================================="
    echo ""
    echo "🌐 Web Interface: http://localhost:5678"
    echo "👤 Username: admin"
    echo "🔑 Password: changeme123"
    echo ""
    echo "==========================================="
    echo "  Quick Setup Guide"
    echo "==========================================="
    echo ""
    echo "1. Open http://localhost:5678 in your browser"
    echo "2. Login with the credentials above"
    echo "3. Create your first workflow:"
    echo "   - Click 'Add workflow'"
    echo "   - Add a 'Webhook' node"
    echo "   - Set webhook path to: order-created"
    echo "   - Add an 'Email' or 'Slack' node"
    echo "   - Activate the workflow"
    echo ""
    echo "4. Test the integration:"
    echo "   - Create an order in LocalCart"
    echo "   - Check n8n executions tab"
    echo ""
    echo "==========================================="
    echo "  Available Webhook Endpoints"
    echo "==========================================="
    echo ""
    echo "📦 Order Events:"
    echo "   - /webhook/order-created"
    echo "   - /webhook/order-status-changed"
    echo ""
    echo "👔 Vendor Events:"
    echo "   - /webhook/vendor-application"
    echo "   - /webhook/vendor-approved"
    echo ""
    echo "📊 Automation Events:"
    echo "   - /webhook/low-stock-alert"
    echo "   - /webhook/abandoned-cart"
    echo "   - /webhook/review-request"
    echo ""
    echo "==========================================="
    echo "  Documentation"
    echo "==========================================="
    echo ""
    echo "📖 Full guide: N8N_AUTOMATION_GUIDE.md"
    echo "🔧 Configuration: .env.example"
    echo ""
    echo "==========================================="
    echo ""
    echo "Happy automating! 🎉"
    echo ""
else
    echo "❌ Failed to start n8n. Check logs with:"
    echo "   docker logs localcart-n8n"
fi
