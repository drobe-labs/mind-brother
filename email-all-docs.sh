#!/bin/bash
# Email All Documentation to dennis.j.roberson@gmail.com
# Each file sent separately by topic

EMAIL="dennis.j.roberson@gmail.com"
PROJECT_DIR="/Users/dennisroberson/Desktop/Mind Brother"

cd "$PROJECT_DIR"

echo "📧 Emailing all Mind Brother documentation to $EMAIL..."
echo ""

# Core System Documentation
echo "📋 Sending Core System Documentation (8 files)..."
cat README_FINAL_SYSTEM.md | mail -s "Mind Brother - System Overview" $EMAIL
cat QUICK_START.md | mail -s "Mind Brother - Quick Start Guide" $EMAIL
cat API_INTEGRATION_GUIDE.md | mail -s "Mind Brother - API Integration Guide" $EMAIL
cat ARCHITECTURE_DIAGRAM.md | mail -s "Mind Brother - Architecture Diagram" $EMAIL
cat INTEGRATION_GUIDE.md | mail -s "Mind Brother - Integration Guide" $EMAIL
cat CLAUDE_SETUP_GUIDE.md | mail -s "Mind Brother - Claude Setup Guide" $EMAIL
cat PATTERN_PRIORITY_ORDER.md | mail -s "Mind Brother - Pattern Priority Order" $EMAIL
cat MAINTENANCE_GUIDE.md | mail -s "Mind Brother - Maintenance Guide" $EMAIL
sleep 2

# Optimization Guides
echo "🎯 Sending Optimization Guides (8 files)..."
cat CLAUDE_OPTIMIZATIONS_GUIDE.md | mail -s "Mind Brother - Claude Optimizations" $EMAIL
cat PROMPT_CACHING_OPTIMIZATION.md | mail -s "Mind Brother - Prompt Caching (90% Cost Reduction)" $EMAIL
cat BATCH_ANALYTICS_GUIDE.md | mail -s "Mind Brother - Batch Analytics (10x Throughput)" $EMAIL
cat SMART_RESOURCE_MATCHING_GUIDE.md | mail -s "Mind Brother - Smart Resource Matching (50x Faster)" $EMAIL
cat PERFORMANCE_OPTIMIZATION_GUIDE.md | mail -s "Mind Brother - Performance Optimization" $EMAIL
cat RATE_LIMITING_GUIDE.md | mail -s "Mind Brother - Rate Limiting & Caching" $EMAIL
cat CONTEXT_SUMMARIZATION_GUIDE.md | mail -s "Mind Brother - Context Summarization" $EMAIL
cat GRACEFUL_DEGRADATION_GUIDE.md | mail -s "Mind Brother - Graceful Degradation" $EMAIL
sleep 2

# Customization Guides
echo "🎨 Sending Customization Guides (4 files)..."
cat CONFIDENCE_TUNING_GUIDE.md | mail -s "Mind Brother - Confidence Tuning" $EMAIL
cat TONE_CUSTOMIZATION_GUIDE.md | mail -s "Mind Brother - Tone Customization" $EMAIL
cat CONTEXT_WINDOW_GUIDE.md | mail -s "Mind Brother - Context Window Management" $EMAIL
cat CONTEXT_BEST_PRACTICES.md | mail -s "Mind Brother - Context Best Practices" $EMAIL
sleep 2

# Monitoring & Analytics
echo "📊 Sending Monitoring & Analytics Guides (5 files)..."
cat METRICS_TRACKING_GUIDE.md | mail -s "Mind Brother - Metrics Tracking" $EMAIL
cat DASHBOARD_GUIDE.md | mail -s "Mind Brother - Dashboard Guide" $EMAIL
cat FEEDBACK_COLLECTION_GUIDE.md | mail -s "Mind Brother - Feedback Collection" $EMAIL
cat MODEL_EVALUATION_GUIDE.md | mail -s "Mind Brother - Model Evaluation" $EMAIL
cat EVALUATION_GUIDE.md | mail -s "Mind Brother - Evaluation Framework" $EMAIL
sleep 2

# Safety & Crisis Management
echo "🚨 Sending Safety & Crisis Management Guides (4 files)..."
cat CRISIS_ESCALATION_GUIDE.md | mail -s "Mind Brother - Crisis Escalation Protocol" $EMAIL
cat HUMAN_HANDOFF_GUIDE.md | mail -s "Mind Brother - Human Handoff System" $EMAIL
cat SAFETY_FIRST_GUIDE.md | mail -s "Mind Brother - Safety-First Architecture" $EMAIL
cat SECURITY_PRIVACY_GUIDE.md | mail -s "Mind Brother - Security & Privacy" $EMAIL
sleep 2

# Technical Implementation
echo "🔧 Sending Technical Implementation Guides (2 files)..."
cat VALIDATION_GUIDE.md | mail -s "Mind Brother - Response Validation" $EMAIL

echo ""
echo "✅ All documentation emailed to $EMAIL"
echo ""
echo "📦 Total: 31 emails sent"
echo ""
echo "⏰ Note: Emails may take a few minutes to arrive."
echo "📧 Check your inbox and spam folder."












