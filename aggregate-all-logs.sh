#!/bin/bash

# LocalCart Unified Logging Aggregator
# Continuously aggregates logs from all services into a single file
# Runs in background and monitors all service logs

LOG_DIR="logs"
UNIFIED_LOG="$LOG_DIR/system-all.log"
LATEST_OFFSET_FILE="$LOG_DIR/.offsets"
AGGREGATION_PID_FILE="/tmp/localcart-aggregator.pid"

mkdir -p "$LOG_DIR"

# Colors for console output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Initialize offsets file
init_offsets() {
    > "$LATEST_OFFSET_FILE"
    echo "backend_lines=0" >> "$LATEST_OFFSET_FILE"
    echo "postgres_lines=0" >> "$LATEST_OFFSET_FILE"
    echo "redis_lines=0" >> "$LATEST_OFFSET_FILE"
}

# Load offsets
load_offsets() {
    if [ -f "$LATEST_OFFSET_FILE" ]; then
        source "$LATEST_OFFSET_FILE"
    else
        init_offsets
        source "$LATEST_OFFSET_FILE"
    fi
}

# Update offsets
save_offsets() {
    cat > "$LATEST_OFFSET_FILE" << EOF
backend_lines=${backend_lines}
postgres_lines=${postgres_lines}
redis_lines=${redis_lines}
EOF
}

# Main aggregation function
aggregate_logs() {
    load_offsets
    
    # Get backend logs
    if [ -f "$LOG_DIR/application-startup.log" ]; then
        current_lines=$(wc -l < "$LOG_DIR/application-startup.log")
        if [ "$current_lines" -gt "$backend_lines" ]; then
            new_lines=$((current_lines - backend_lines))
            tail -"$new_lines" "$LOG_DIR/application-startup.log" | while read -r line; do
                echo "[$(date '+%Y-%m-%d %H:%M:%S')] [BACKEND] $line" >> "$UNIFIED_LOG"
            done
            backend_lines=$current_lines
        fi
    fi
    
    # Get PostgreSQL logs
    if docker ps 2>/dev/null | grep -q "localcart-postgres"; then
        current_lines=$(docker logs localcart-postgres 2>/dev/null | wc -l)
        if [ "$current_lines" -gt "$postgres_lines" ]; then
            new_lines=$((current_lines - postgres_lines))
            docker logs localcart-postgres 2>/dev/null | tail -"$new_lines" | while read -r line; do
                echo "[$(date '+%Y-%m-%d %H:%M:%S')] [DATABASE] $line" >> "$UNIFIED_LOG"
            done
            postgres_lines=$current_lines
        fi
    fi
    
    # Get Redis logs
    if docker ps 2>/dev/null | grep -q "localcart-redis"; then
        current_lines=$(docker logs localcart-redis 2>/dev/null | wc -l)
        if [ "$current_lines" -gt "$redis_lines" ]; then
            new_lines=$((current_lines - redis_lines))
            docker logs localcart-redis 2>/dev/null | tail -"$new_lines" | while read -r line; do
                echo "[$(date '+%Y-%m-%d %H:%M:%S')] [CACHE] $line" >> "$UNIFIED_LOG"
            done
            redis_lines=$current_lines
        fi
    fi
    
    save_offsets
}

# Continuous aggregation loop
continuous_aggregate() {
    # Initialize
    > "$UNIFIED_LOG"
    init_offsets
    
    echo "$(date '+%Y-%m-%d %H:%M:%S') [AGGREGATOR] Starting unified log aggregator" >> "$UNIFIED_LOG"
    
    # Main loop - aggregate every 2 seconds
    while true; do
        aggregate_logs
        sleep 2
    done
}

# Start aggregator in background
start_aggregator() {
    if [ -f "$AGGREGATION_PID_FILE" ]; then
        old_pid=$(cat "$AGGREGATION_PID_FILE")
        if kill -0 "$old_pid" 2>/dev/null; then
            echo -e "${YELLOW}Aggregator already running (PID: $old_pid)${NC}"
            return
        fi
    fi
    
    continuous_aggregate &
    local pid=$!
    echo "$pid" > "$AGGREGATION_PID_FILE"
    
    echo -e "${GREEN}✓ Aggregator started (PID: $pid)${NC}"
    echo -e "${GREEN}✓ Unified log: $UNIFIED_LOG${NC}"
}

# Stop aggregator
stop_aggregator() {
    if [ -f "$AGGREGATION_PID_FILE" ]; then
        pid=$(cat "$AGGREGATION_PID_FILE")
        if kill -0 "$pid" 2>/dev/null; then
            kill "$pid"
            rm "$AGGREGATION_PID_FILE"
            echo -e "${GREEN}✓ Aggregator stopped${NC}"
        else
            rm "$AGGREGATION_PID_FILE"
            echo -e "${YELLOW}Aggregator not running${NC}"
        fi
    else
        echo -e "${YELLOW}Aggregator not running${NC}"
    fi
}

# Check status
check_status() {
    if [ -f "$AGGREGATION_PID_FILE" ]; then
        pid=$(cat "$AGGREGATION_PID_FILE")
        if kill -0 "$pid" 2>/dev/null; then
            echo -e "${GREEN}✓ Aggregator running (PID: $pid)${NC}"
            echo "Unified log file: $UNIFIED_LOG"
            if [ -f "$UNIFIED_LOG" ]; then
                echo "Log size: $(du -h "$UNIFIED_LOG" | cut -f1)"
                echo "Log lines: $(wc -l < "$UNIFIED_LOG")"
                echo ""
                echo "Recent entries:"
                tail -5 "$UNIFIED_LOG"
            fi
        else
            echo -e "${RED}✗ Aggregator not running${NC}"
        fi
    else
        echo -e "${RED}✗ Aggregator not running${NC}"
    fi
}

# View unified log
view_log() {
    if [ ! -f "$UNIFIED_LOG" ]; then
        echo -e "${RED}No unified log found. Make sure aggregator is running.${NC}"
        exit 1
    fi
    
    if [ -n "$1" ]; then
        tail -"$1" "$UNIFIED_LOG"
    else
        cat "$UNIFIED_LOG"
    fi
}

# Follow log in real-time
follow_log() {
    if [ ! -f "$UNIFIED_LOG" ]; then
        echo -e "${RED}No unified log found. Make sure aggregator is running.${NC}"
        exit 1
    fi
    
    tail -f "$UNIFIED_LOG"
}

# Search in log
search_log() {
    if [ -z "$1" ]; then
        echo "Usage: $0 search <keyword>"
        exit 1
    fi
    
    if [ ! -f "$UNIFIED_LOG" ]; then
        echo -e "${RED}No unified log found${NC}"
        exit 1
    fi
    
    grep -n "$1" "$UNIFIED_LOG" | head -20
}

# Show help
show_help() {
    cat << EOF
${BLUE}LocalCart Unified Log Aggregator${NC}

${YELLOW}Usage:${NC}
    $0 {start|stop|status|view|tail|search}

${YELLOW}Commands:${NC}
    start           Start the log aggregator in background
    stop            Stop the aggregator
    status          Check aggregator status
    view [lines]    View unified log (optionally show last N lines)
    tail            Follow unified log in real-time
    search <text>   Search in unified log
    help            Show this help message

${YELLOW}Examples:${NC}
    $0 start                # Start aggregating logs
    $0 status               # Check if it's running
    $0 view 50              # Show last 50 lines
    $0 tail                 # Follow in real-time
    $0 search ERROR         # Find all errors

${YELLOW}Log Location:${NC}
    $UNIFIED_LOG

${YELLOW}Feature:${NC}
    • Aggregates logs from PostgreSQL, Redis, and Backend
    • Continuously monitors all services
    • Single unified log file for easy viewing
    • Auto-timestamped entries
    • Indexed by service (BACKEND, DATABASE, CACHE)

EOF
}

# Main execution
case "$1" in
    "start")
        start_aggregator
        ;;
    "stop")
        stop_aggregator
        ;;
    "status")
        check_status
        ;;
    "view")
        view_log "$2"
        ;;
    "tail")
        follow_log
        ;;
    "search")
        search_log "$2"
        ;;
    "help"|"-h"|"--help")
        show_help
        ;;
    *)
        show_help
        exit 1
        ;;
esac
