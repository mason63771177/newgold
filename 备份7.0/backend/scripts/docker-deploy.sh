#!/bin/bash

# Tatum 钱包服务 Docker 部署脚本
# 使用方法: ./scripts/docker-deploy.sh [start|stop|restart|logs|status]

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 项目配置
PROJECT_NAME="tatum-wallet-service"
COMPOSE_FILE="docker-compose.yml"
ENV_FILE=".env"

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查依赖
check_dependencies() {
    log_info "检查依赖..."
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker 未安装，请先安装 Docker"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose 未安装，请先安装 Docker Compose"
        exit 1
    fi
    
    log_success "依赖检查完成"
}

# 检查环境文件
check_env_file() {
    log_info "检查环境配置..."
    
    if [ ! -f "$ENV_FILE" ]; then
        log_warning "环境文件 $ENV_FILE 不存在，从示例文件复制..."
        if [ -f ".env.example" ]; then
            cp .env.example $ENV_FILE
            log_warning "请编辑 $ENV_FILE 文件配置正确的环境变量"
        else
            log_error "示例环境文件 .env.example 不存在"
            exit 1
        fi
    fi
    
    # 检查关键环境变量
    source $ENV_FILE
    
    if [ -z "$TATUM_API_KEY" ] || [ "$TATUM_API_KEY" = "your_tatum_api_key_here" ]; then
        log_error "请在 $ENV_FILE 中配置正确的 TATUM_API_KEY"
        exit 1
    fi
    
    if [ -z "$MASTER_WALLET_MNEMONIC" ] || [ "$MASTER_WALLET_MNEMONIC" = "your_master_wallet_mnemonic_phrase_here" ]; then
        log_error "请在 $ENV_FILE 中配置正确的 MASTER_WALLET_MNEMONIC"
        exit 1
    fi
    
    if [ -z "$ENCRYPTION_KEY" ] || [ "$ENCRYPTION_KEY" = "your_32_character_encryption_key_here" ]; then
        log_error "请在 $ENV_FILE 中配置正确的 ENCRYPTION_KEY"
        exit 1
    fi
    
    log_success "环境配置检查完成"
}

# 创建必要的目录
create_directories() {
    log_info "创建必要的目录..."
    
    mkdir -p logs
    mkdir -p ssl
    
    # 如果 SSL 证书不存在，创建自签名证书
    if [ ! -f "ssl/server.crt" ] || [ ! -f "ssl/server.key" ]; then
        log_warning "SSL 证书不存在，创建自签名证书..."
        openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
            -keyout ssl/server.key \
            -out ssl/server.crt \
            -subj "/C=CN/ST=State/L=City/O=Organization/CN=localhost"
        log_success "自签名证书创建完成"
    fi
    
    log_success "目录创建完成"
}

# 启动服务
start_services() {
    log_info "启动 $PROJECT_NAME 服务..."
    
    check_dependencies
    check_env_file
    create_directories
    
    # 构建并启动服务
    docker-compose -f $COMPOSE_FILE up -d --build
    
    log_success "服务启动完成"
    
    # 等待服务启动
    log_info "等待服务启动..."
    sleep 30
    
    # 检查服务状态
    check_service_health
}

# 停止服务
stop_services() {
    log_info "停止 $PROJECT_NAME 服务..."
    
    docker-compose -f $COMPOSE_FILE down
    
    log_success "服务停止完成"
}

# 重启服务
restart_services() {
    log_info "重启 $PROJECT_NAME 服务..."
    
    stop_services
    sleep 5
    start_services
}

# 查看日志
view_logs() {
    log_info "查看服务日志..."
    
    if [ -n "$2" ]; then
        docker-compose -f $COMPOSE_FILE logs -f "$2"
    else
        docker-compose -f $COMPOSE_FILE logs -f
    fi
}

# 检查服务健康状态
check_service_health() {
    log_info "检查服务健康状态..."
    
    # 检查容器状态
    docker-compose -f $COMPOSE_FILE ps
    
    # 检查健康状态
    log_info "等待健康检查..."
    sleep 10
    
    # 测试 API 连接
    if curl -f http://localhost:3000/health > /dev/null 2>&1; then
        log_success "API 服务健康检查通过"
    else
        log_warning "API 服务健康检查失败，请查看日志"
    fi
    
    # 测试数据库连接
    if docker-compose -f $COMPOSE_FILE exec -T mysql mysqladmin ping -h localhost -u root -p$MYSQL_ROOT_PASSWORD > /dev/null 2>&1; then
        log_success "数据库连接正常"
    else
        log_warning "数据库连接失败"
    fi
    
    # 测试 Redis 连接
    if docker-compose -f $COMPOSE_FILE exec -T redis redis-cli ping > /dev/null 2>&1; then
        log_success "Redis 连接正常"
    else
        log_warning "Redis 连接失败"
    fi
}

# 清理资源
cleanup() {
    log_info "清理 Docker 资源..."
    
    # 停止并删除容器
    docker-compose -f $COMPOSE_FILE down -v
    
    # 删除镜像（可选）
    read -p "是否删除 Docker 镜像？(y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        docker-compose -f $COMPOSE_FILE down --rmi all
        log_success "Docker 镜像已删除"
    fi
    
    log_success "清理完成"
}

# 备份数据
backup_data() {
    log_info "备份数据..."
    
    BACKUP_DIR="backups/$(date +%Y%m%d_%H%M%S)"
    mkdir -p $BACKUP_DIR
    
    # 备份数据库
    docker-compose -f $COMPOSE_FILE exec -T mysql mysqldump -u root -p$MYSQL_ROOT_PASSWORD $DB_NAME > $BACKUP_DIR/database.sql
    
    # 备份 Redis 数据
    docker-compose -f $COMPOSE_FILE exec -T redis redis-cli BGSAVE
    docker cp $(docker-compose -f $COMPOSE_FILE ps -q redis):/data/dump.rdb $BACKUP_DIR/
    
    # 备份日志
    cp -r logs $BACKUP_DIR/
    
    # 备份配置
    cp $ENV_FILE $BACKUP_DIR/
    
    log_success "数据备份完成: $BACKUP_DIR"
}

# 显示帮助信息
show_help() {
    echo "Tatum 钱包服务 Docker 部署脚本"
    echo ""
    echo "使用方法:"
    echo "  $0 [命令] [选项]"
    echo ""
    echo "命令:"
    echo "  start     启动所有服务"
    echo "  stop      停止所有服务"
    echo "  restart   重启所有服务"
    echo "  logs      查看服务日志 (可指定服务名)"
    echo "  status    检查服务状态"
    echo "  cleanup   清理 Docker 资源"
    echo "  backup    备份数据"
    echo "  help      显示帮助信息"
    echo ""
    echo "示例:"
    echo "  $0 start                    # 启动所有服务"
    echo "  $0 logs tatum-wallet-service # 查看钱包服务日志"
    echo "  $0 status                   # 检查服务状态"
}

# 主函数
main() {
    case "${1:-help}" in
        start)
            start_services
            ;;
        stop)
            stop_services
            ;;
        restart)
            restart_services
            ;;
        logs)
            view_logs "$@"
            ;;
        status)
            check_service_health
            ;;
        cleanup)
            cleanup
            ;;
        backup)
            backup_data
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            log_error "未知命令: $1"
            show_help
            exit 1
            ;;
    esac
}

# 执行主函数
main "$@"