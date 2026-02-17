#!/bin/bash

# LocalCart Unified Logging System
# Consolidates logs from all services into a single file
# PostgreSQL + Redis + Spring Boot Backend

LOG_DIR="logs"
CONSOLIDATED_LOG="$LOG_DIR/system-unified.log"
ARCHIVE_DIR="$LOG_DIR/archives"

# Create directories
mkdir -p "$LOG_DIR" "$ARCHIVE_DIR"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Timestamp function
timestamp() {
    date '+[%Y-%m-%d %H:%M:%S]'
}

# Write to unified log
log_to_unified() {
    local service=$1
    local message=$2
    local level=$3
    
    echo "$(timestamp) [$service] [$level] $message" >> "$CONSOLIDATED_LOG"
}

# Main logging function
unified_log() {
    local service=$1
    local level=$2
    
    echo "$(timestamp) [$service] [$level] Collecting logs..."
    
    case "$service" in
        "POSTGRES")
            # Get PostgreSQL logs from Docker
            if docker ps | grep -q localcart-postgres; then
                echo "$(timestamp) [POSTGRES] [INFO] PostgreSQL container is running" >> "$CONSOLIDATED_LOG"
                docker logs localcart-postgres 2>&1 | tail -50 | while read line; do
                    echo "$(timestamp) [POSTGRES] [INFO] $line" >> "$CONSOLIDATED_LOG"
                done
            else
                echo "$(timestamp) [POSTGRES] [WARN] PostgreSQL container is not running" >> "$CONSOLIDATED_LOG"
            fi
            ;;
        "REDIS")
            # Get Redis logs from Docker
            if docker ps | grep -q localcart-redis; then
                echo "$(timestamp) [REDIS] [INFO] Redis container is running" >> "$CONSOLIDATED_LOG"
                docker logs localcart-redis 2>&1 | tail -50 | while read line; do
                    echo "$(timestamp) [REDIS] [INFO] $line" >> "$CONSOLIDATED_LOG"
                done
            else
                echo "$(timestamp) [REDIS] [WARN] Redis container is not running" >> "$CONSOLIDATED_LOG"
            fi
            ;;
        "BACKEND")
            # Get Spring Boot application logs
            if [ -f "$LOG_DIR/application-startup.log" ]; then
                echo "$(timestamp) [BACKEND] [INFO] Reading Spring Boot logs" >> "$CONSOLIDATED_LOG"
                cat "$LOG_DIR/application-startup.log" | while read line; do
                    echo "$(timestamp) [BACKEND] [INFO] $line" >> "$CONSOLIDATED_LOG"
                done
            else
                echo "$(timestamp) [BACKEND] [WARN] Spring Boot log file not found" >> "$CONSOLIDATED_LOG"
            fi
            ;;
        "SYSTEM")
            # Get system information
            echo "$(timestamp) [SYSTEM] [INFO] ============ SYSTEM STATUS ============" >> "$CONSOLIDATED_LOG"
            echo "$(timestamp) [SYSTEM] [INFO] Timestamp: $(date)" >> "$CONSOLIDATED_LOG"
            echo "$(timestamp) [SYSTEM] [INFO] Docker Services Status:" >> "$CONSOLIDATED_LOG"
            docker-compose ps 2>&1 | while read line; do
                echo "$(timestamp) [SYSTEM] [INFO] $line" >> "$CONSOLIDATED_LOG"
            done
            echo "$(timestamp) [SYSTEM] [INFO] Java Process:" >> "$CONSOLIDATED_LOG"
            ps aux | grep "[s]pring-boot" | while read line; do
                echo "$(timestamp) [SYSTEM] [INFO] $line" >> "$CONSOLIDATED_LOG"
            done
            echo "$(timestamp) [SYSTEM] [INFO] Disk Usage:" >> "$CONSOLIDATED_LOG"
            df -h | while read line; do
                echo "$(timestamp) [SYSTEM] [INFO] $line" >> "$CONSOLIDATED_LOG"
            done
            ;;
    esac
}

# Main execution
case "$1" in
    "init")
        # Initialize consolidated log
        > "$CONSOLIDATED_LOG"
        echo "Initializing unified logging system..."
        log_to_unified "SYSTEM" "Unified logging system initialized" "INFO"
        ;;
    "collect")
        # Collect all logs
        if [ ! -f "$CONSOLIDATED_LOG" ]; then
            > "$CONSOLIDATED_LOG"
        fi
        
        echo -e "${BLUE}Collecting logs from all services...${NC}"
        
        unified_log "SYSTEM" "INFO"
        unified_log "POSTGRES" "INFO"
        unified_log "REDIS" "INFO"
        unified_log "BACKEND" "INFO"
        
        echo -e "${GREEN}✓ Logs collected to: $CONSOLIDATED_LOG${NC}"
        ;;
    "view")
        # View consolidated log
        if [ ! -f "$CONSOLIDATED_LOG" ]; then
            echo -e "${RED}No consolidated log file found. Run with 'collect' first.${NC}"
            exit 1
        fi
        
        if [ -n "$2" ]; then
            # View specific lines
            tail -n "$2" "$CONSOLIDATED_LOG"
        else
            # View all
            cat "$CONSOLIDATED_LOG"
        fi
        ;;
    "tail")
        # Follow logs in real-time
        if [ ! -f "$CONSOLIDATED_LOG" ]; then
            > "$CONSOLIDATED_LOG"
        fi
        tail -f "$CONSOLIDATED_LOG"
        ;;
    "search")
        # Search in logs
        if [ -z "$2" ]; then
            echo "Usage: $0 search <keyword>"
            exit 1
        fi
        grep -n "$2" "$CONSOLIDATED_LOG" || echo "No matches found"
        ;;
    "errors")
        # Show only errors
        echo -e "${RED}=== ERRORS IN LOGS ===${NC}"
        grep -i "\[ERROR\]\|\[WARN\]\|exception\|failed" "$CONSOLIDATED_LOG" || echo "No errors found"
        ;;
    "archive")
        # Archive old log
        if [ -f "$CONSOLIDATED_LOG" ]; then
            archive_file="$ARCHIVE_DIR/system-unified-$(date +%Y%m%d-%H%M%S).log.gz"
            gzip -c "$CONSOLIDATED_LOG" > "$archive_file"
            > "$CONSOLIDATED_LOG"
            echo -e "${GREEN}Log archived to: $archive_file${NC}"
        fi
        ;;
    "status")
        # Show log status
        echo -e "${CYAN}=== UNIFIED LOG STATUS ===${NC}"
        if [ -f "$CONSOLIDATED_LOG" ]; then
            echo "Log file: $CONSOLIDATED_LOG"
            echo "Size: $(du -h "$CONSOLIDATED_LOG" | cut -f1)"
            echo "Lines: $(wc -l < "$CONSOLIDATED_LOG")"
            echo ""
            echo "Recent entries:"
            tail -10 "$CONSOLIDATED_LOG"
        else
            echo "No consolidated log file found"
        fi
        ;;
    *)
        echo "LocalCart Unified Logging System"
        echo ""
        echo "Usage: $0 {init|collect|view|tail|search|errors|archive|status}"
        echo ""
        echo "Commands:"
        echo "  init      - Initialize consolidated log"
        echo "  collect   - Collect logs from all services"
        echo "  view      - View consolidated log (optionally specify line count)"
        echo "  tail      - Follow logs in real-time"
        echo "  search    - Search logs for keyword"
        echo "  errors    - Show only errors and warnings"
        echo "  archive   - Archive current log and start fresh"
        echo "  status    - Show log file status and recent entries"
        echo ""
        echo "Examples:"
        echo "  $0 collect           # Collect all logs"
        echo "  $0 view 50           # View last 50 lines"
        echo "  $0 tail              # Follow in real-time"
        echo "  $0 search 'ERROR'    # Search for errors"
        echo "  $0 errors            # Show only errors"
        exit 1
        ;;
esac
