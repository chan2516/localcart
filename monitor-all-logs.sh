#!/bin/bash

# LocalCart Real-Time Live Log Monitor
# Shows all system logs in real-time with color coding and filtering

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
WHITE='\033[1;37m'
BOLD='\033[1m'
NC='\033[0m' # No Color

LOG_DIR="logs"
COMBINED_LOG="$LOG_DIR/live-combined.log"

# Function to display header
show_header() {
    clear
    echo -e "${CYAN}${BOLD}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${CYAN}${BOLD}     LocalCart Live Multi-Service Log Monitor${NC}"
    echo -e "${CYAN}${BOLD}═══════════════════════════════════════════════════════════════${NC}"
    echo ""
    echo -e "${YELLOW}Available Services:${NC}"
    echo -e "  ${GREEN}●${NC} PostgreSQL Database (localhost:5432)"
    echo -e "  ${GREEN}●${NC} Redis Cache (localhost:6379)"
    echo -e "  ${GREEN}●${NC} Spring Boot Backend (localhost:8080)"
    echo -e "  ${GREEN}●${NC} System Metrics"
    echo ""
    echo -e "${YELLOW}Live monitoring started...${NC}"
    echo -e "${CYAN}${BOLD}═══════════════════════════════════════════════════════════════${NC}"
    echo ""
}

# Function to colorize output based on log level
colorize_log() {
    local line=$1
    
    if echo "$line" | grep -qi "error\|exception\|fatal"; then
        echo -e "${RED}$line${NC}"
    elif echo "$line" | grep -qi "warn"; then
        echo -e "${YELLOW}$line${NC}"
    elif echo "$line" | grep -qi "debug\|trace"; then
        echo -e "${MAGENTA}$line${NC}"
    elif echo "$line" | grep -qi "info\|started\|running"; then
        echo -e "${GREEN}$line${NC}"
    elif echo "$line" | grep -qi "postgres\|database"; then
        echo -e "${BLUE}$line${NC}"
    elif echo "$line" | grep -qi "redis\|cache"; then
        echo -e "${CYAN}$line${NC}"
    else
        echo -e "${WHITE}$line${NC}"
    fi
}

# Function to get Docker logs
get_docker_logs() {
    local service=$1
    local lines=$2
    
    if docker ps 2>/dev/null | grep -q "$service"; then
        docker logs --tail "$lines" "$service" 2>/dev/null | tail -5
    fi
}

# Function to get backend logs
get_backend_logs() {
    local lines=$1
    if [ -f "$LOG_DIR/application-startup.log" ]; then
        tail -"$lines" "$LOG_DIR/application-startup.log" | tail -5
    fi
}

# Function to create combined live log
create_combined_log() {
    > "$COMBINED_LOG"
    
    # Get logs from each service
    echo "[DATABASE LOGS]" >> "$COMBINED_LOG"
    get_docker_logs "localcart-postgres" 10 >> "$COMBINED_LOG" 2>/dev/null
    echo "" >> "$COMBINED_LOG"
    
    echo "[REDIS CACHE LOGS]" >> "$COMBINED_LOG"
    get_docker_logs "localcart-redis" 10 >> "$COMBINED_LOG" 2>/dev/null
    echo "" >> "$COMBINED_LOG"
    
    echo "[BACKEND APPLICATION LOGS]" >> "$COMBINED_LOG"
    get_backend_logs 15 >> "$COMBINED_LOG" 2>/dev/null
    echo "" >> "$COMBINED_LOG"
    
    echo "[SYSTEM STATUS]" >> "$COMBINED_LOG"
    echo "Timestamp: $(date)" >> "$COMBINED_LOG"
    echo "Docker Services:" >> "$COMBINED_LOG"
    docker-compose ps 2>/dev/null | tail -5 >> "$COMBINED_LOG"
    echo "Java Process:" >> "$COMBINED_LOG"
    ps aux | grep "[s]pring-boot" | awk '{print $2, $11, $12}' >> "$COMBINED_LOG"
}

# Function to display live monitor
display_monitor() {
    show_header
    
    while true; do
        create_combined_log
        
        # Display with colors
        while IFS= read -r line; do
            colorize_log "$line"
        done < "$COMBINED_LOG"
        
        echo ""
        echo -e "${YELLOW}(Auto-refreshing every 5 seconds... Press Ctrl+C to exit)${NC}"
        sleep 5
        clear
        show_header
    done
}

# Function to display help
show_help() {
    cat << EOF
${BLUE}LocalCart Live Log Monitor${NC}

${YELLOW}Usage:${NC}
    $0 [OPTION]

${YELLOW}Options:${NC}
    monitor     Display real-time live monitor (auto-refresh)
    single      Show current logs once
    docker      Show only Docker container logs
    backend     Show only backend application logs
    errors      Show only errors and warnings
    tail        Follow all logs in real-time
    help        Show this help message

${YELLOW}Examples:${NC}
    $0 monitor          # Start live dashboard
    $0 single           # Show current state
    $0 errors           # Filter errors only
    $0 backend          # Backend logs only
    $0 tail             # Real-time tail

${YELLOW}Color Legend:${NC}
    ${RED}Red${NC}      - Errors/Exceptions/Fatal
    ${YELLOW}Yellow${NC}   - Warnings
    ${GREEN}Green${NC}    - Info/Started/Running
    ${BLUE}Blue${NC}     - Database
    ${CYAN}Cyan${NC}     - Redis Cache
    ${MAGENTA}Magenta${NC}  - Debug/Trace

EOF
}

# Parse arguments
case="${1:-monitor}"

case "$1" in
    "monitor")
        display_monitor
        ;;
    "single")
        show_header
        create_combined_log
        while IFS= read -r line; do
            colorize_log "$line"
        done < "$COMBINED_LOG"
        ;;
    "docker")
        echo -e "${CYAN}PostgreSQL Logs:${NC}"
        get_docker_logs "localcart-postgres" 20
        echo ""
        echo -e "${CYAN}Redis Logs:${NC}"
        get_docker_logs "localcart-redis" 20
        ;;
    "backend")
        echo -e "${CYAN}Backend Application Logs:${NC}"
        if [ -f "$LOG_DIR/application-startup.log" ]; then
            tail -30 "$LOG_DIR/application-startup.log"
        fi
        ;;
    "errors")
        echo -e "${RED}${BOLD}Errors and Warnings:${NC}"
        echo ""
        if [ -f "$LOG_DIR/application-startup.log" ]; then
            grep -i "error\|warn\|exception" "$LOG_DIR/application-startup.log" | tail -20
        fi
        ;;
    "tail")
        echo -e "${YELLOW}Following all logs (Ctrl+C to exit)...${NC}"
        echo ""
        
        # Create named pipes for each service
        (get_docker_logs "localcart-postgres" 1000 & get_docker_logs "localcart-redis" 1000 & 
         tail -f "$LOG_DIR/application-startup.log" 2>/dev/null) | while IFS= read -r line; do
            colorize_log "$line"
        done
        ;;
    "help"|"-h"|"--help")
        show_help
        ;;
    *)
        echo "Unknown option: $1"
        show_help
        exit 1
        ;;
esac
