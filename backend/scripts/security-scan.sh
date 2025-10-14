#!/bin/bash

# Tatum 钱包服务安全扫描脚本
# 用于定期检查系统安全状态

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志文件
SCAN_LOG="logs/security-scan-$(date +%Y%m%d_%H%M%S).log"
mkdir -p logs

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1" | tee -a "$SCAN_LOG"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$SCAN_LOG"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$SCAN_LOG"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$SCAN_LOG"
}

# 开始扫描
start_scan() {
    log_info "开始安全扫描 - $(date)"
    log_info "扫描日志: $SCAN_LOG"
    echo "========================================" >> "$SCAN_LOG"
}

# 检查系统更新
check_system_updates() {
    log_info "检查系统更新..."
    
    if command -v apt &> /dev/null; then
        # Ubuntu/Debian
        apt list --upgradable 2>/dev/null | grep -v "WARNING" | tee -a "$SCAN_LOG"
        
        UPDATES=$(apt list --upgradable 2>/dev/null | grep -c upgradable || true)
        if [ "$UPDATES" -gt 1 ]; then
            log_warning "发现 $((UPDATES-1)) 个可用更新"
        else
            log_success "系统已是最新版本"
        fi
    elif command -v yum &> /dev/null; then
        # CentOS/RHEL
        yum check-update | tee -a "$SCAN_LOG"
    elif command -v brew &> /dev/null; then
        # macOS
        brew outdated | tee -a "$SCAN_LOG"
        
        OUTDATED=$(brew outdated | wc -l)
        if [ "$OUTDATED" -gt 0 ]; then
            log_warning "发现 $OUTDATED 个过期的 Homebrew 包"
        else
            log_success "Homebrew 包都是最新版本"
        fi
    fi
}

# 检查 Node.js 依赖漏洞
check_npm_vulnerabilities() {
    log_info "检查 Node.js 依赖漏洞..."
    
    if [ -f "package.json" ]; then
        # 运行 npm audit
        if npm audit --audit-level=moderate >> "$SCAN_LOG" 2>&1; then
            log_success "未发现中等或高危漏洞"
        else
            log_warning "发现依赖漏洞，请查看详细报告"
            npm audit --audit-level=low | head -20 | tee -a "$SCAN_LOG"
        fi
        
        # 检查过期依赖
        log_info "检查过期依赖..."
        npm outdated | tee -a "$SCAN_LOG"
    else
        log_warning "未找到 package.json 文件"
    fi
}

# 检查 Docker 镜像漏洞
check_docker_vulnerabilities() {
    log_info "检查 Docker 镜像漏洞..."
    
    if command -v docker &> /dev/null; then
        # 检查是否有 Trivy
        if command -v trivy &> /dev/null; then
            log_info "使用 Trivy 扫描 Docker 镜像..."
            trivy image --severity HIGH,CRITICAL tatum-wallet-service:latest >> "$SCAN_LOG" 2>&1 || true
        else
            log_warning "Trivy 未安装，跳过 Docker 镜像漏洞扫描"
            log_info "安装 Trivy: https://aquasecurity.github.io/trivy/latest/getting-started/installation/"
        fi
        
        # 检查 Docker 版本
        DOCKER_VERSION=$(docker --version | grep -oE '[0-9]+\.[0-9]+\.[0-9]+')
        log_info "Docker 版本: $DOCKER_VERSION"
        
        # 检查运行中的容器
        log_info "运行中的容器:"
        docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}" | tee -a "$SCAN_LOG"
    else
        log_warning "Docker 未安装或不可用"
    fi
}

# 检查端口开放情况
check_open_ports() {
    log_info "检查开放端口..."
    
    if command -v netstat &> /dev/null; then
        log_info "使用 netstat 检查监听端口:"
        netstat -tlnp | grep LISTEN | tee -a "$SCAN_LOG"
    elif command -v ss &> /dev/null; then
        log_info "使用 ss 检查监听端口:"
        ss -tlnp | grep LISTEN | tee -a "$SCAN_LOG"
    fi
    
    # 检查常见危险端口
    DANGEROUS_PORTS=(21 23 25 53 135 139 445 1433 3389 5432)
    for port in "${DANGEROUS_PORTS[@]}"; do
        if netstat -tln 2>/dev/null | grep -q ":$port "; then
            log_warning "检测到潜在危险端口开放: $port"
        fi
    done
}

# 检查文件权限
check_file_permissions() {
    log_info "检查关键文件权限..."
    
    # 检查敏感文件
    SENSITIVE_FILES=(
        ".env"
        ".env.production"
        "ssl/*.key"
        "ssl/*.pem"
        "config/*.key"
    )
    
    for pattern in "${SENSITIVE_FILES[@]}"; do
        for file in $pattern; do
            if [ -f "$file" ]; then
                PERMS=$(stat -c "%a" "$file" 2>/dev/null || stat -f "%A" "$file" 2>/dev/null)
                log_info "文件权限 $file: $PERMS"
                
                # 检查是否权限过于宽松
                if [ "$PERMS" -gt 600 ]; then
                    log_warning "文件 $file 权限过于宽松 ($PERMS)，建议设置为 600"
                fi
            fi
        done
    done
    
    # 检查目录权限
    SENSITIVE_DIRS=(
        "logs"
        "ssl"
        "config"
    )
    
    for dir in "${SENSITIVE_DIRS[@]}"; do
        if [ -d "$dir" ]; then
            PERMS=$(stat -c "%a" "$dir" 2>/dev/null || stat -f "%A" "$dir" 2>/dev/null)
            log_info "目录权限 $dir: $PERMS"
            
            if [ "$PERMS" -gt 755 ]; then
                log_warning "目录 $dir 权限过于宽松 ($PERMS)，建议设置为 755"
            fi
        fi
    done
}

# 检查环境变量安全
check_environment_security() {
    log_info "检查环境变量安全..."
    
    if [ -f ".env" ]; then
        # 检查是否使用默认值
        DEFAULT_VALUES=(
            "your_password"
            "your_secret"
            "your_key"
            "change_me"
            "default"
            "admin"
            "password"
            "123456"
        )
        
        for default in "${DEFAULT_VALUES[@]}"; do
            if grep -qi "$default" .env; then
                log_error "发现默认值或弱密码: $default"
            fi
        done
        
        # 检查密钥长度
        while IFS= read -r line; do
            if [[ $line =~ ^[A-Z_]+_KEY= ]] || [[ $line =~ ^[A-Z_]+_SECRET= ]]; then
                KEY_NAME=$(echo "$line" | cut -d'=' -f1)
                KEY_VALUE=$(echo "$line" | cut -d'=' -f2)
                KEY_LENGTH=${#KEY_VALUE}
                
                if [ "$KEY_LENGTH" -lt 32 ]; then
                    log_warning "$KEY_NAME 长度不足 ($KEY_LENGTH 字符)，建议至少 32 字符"
                else
                    log_success "$KEY_NAME 长度符合要求 ($KEY_LENGTH 字符)"
                fi
            fi
        done < .env
    else
        log_warning "未找到 .env 文件"
    fi
}

# 检查 SSL 证书
check_ssl_certificates() {
    log_info "检查 SSL 证书..."
    
    SSL_DIRS=("ssl" "config/ssl" "/etc/nginx/ssl")
    
    for dir in "${SSL_DIRS[@]}"; do
        if [ -d "$dir" ]; then
            for cert in "$dir"/*.crt "$dir"/*.pem; do
                if [ -f "$cert" ]; then
                    log_info "检查证书: $cert"
                    
                    # 检查证书有效期
                    if command -v openssl &> /dev/null; then
                        EXPIRY=$(openssl x509 -in "$cert" -noout -enddate 2>/dev/null | cut -d= -f2)
                        if [ -n "$EXPIRY" ]; then
                            EXPIRY_TIMESTAMP=$(date -d "$EXPIRY" +%s 2>/dev/null || date -j -f "%b %d %H:%M:%S %Y %Z" "$EXPIRY" +%s 2>/dev/null)
                            CURRENT_TIMESTAMP=$(date +%s)
                            DAYS_LEFT=$(( (EXPIRY_TIMESTAMP - CURRENT_TIMESTAMP) / 86400 ))
                            
                            if [ "$DAYS_LEFT" -lt 30 ]; then
                                log_warning "证书 $cert 将在 $DAYS_LEFT 天后过期"
                            else
                                log_success "证书 $cert 有效期还有 $DAYS_LEFT 天"
                            fi
                        fi
                    fi
                fi
            done
        fi
    done
}

# 检查数据库安全
check_database_security() {
    log_info "检查数据库安全配置..."
    
    # 检查 MySQL 配置
    if command -v mysql &> /dev/null && [ -n "$DB_HOST" ] && [ -n "$DB_USER" ] && [ -n "$DB_PASSWORD" ]; then
        log_info "检查 MySQL 连接和配置..."
        
        # 测试连接
        if mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" -e "SELECT 1;" &>/dev/null; then
            log_success "数据库连接正常"
            
            # 检查用户权限
            mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" -e "SHOW GRANTS;" 2>/dev/null | tee -a "$SCAN_LOG"
        else
            log_error "数据库连接失败"
        fi
    fi
    
    # 检查 Redis 安全
    if command -v redis-cli &> /dev/null && [ -n "$REDIS_HOST" ]; then
        log_info "检查 Redis 连接和配置..."
        
        if redis-cli -h "$REDIS_HOST" ping &>/dev/null; then
            log_success "Redis 连接正常"
            
            # 检查 Redis 配置
            redis-cli -h "$REDIS_HOST" CONFIG GET "*auth*" | tee -a "$SCAN_LOG"
        else
            log_error "Redis 连接失败"
        fi
    fi
}

# 检查日志文件
check_log_files() {
    log_info "检查日志文件..."
    
    LOG_DIRS=("logs" "/var/log")
    
    for dir in "${LOG_DIRS[@]}"; do
        if [ -d "$dir" ]; then
            # 检查日志文件大小
            find "$dir" -name "*.log" -type f -exec ls -lh {} \; | tee -a "$SCAN_LOG"
            
            # 检查是否有错误日志
            find "$dir" -name "*error*.log" -type f -mtime -1 -exec echo "Recent error log: {}" \; | tee -a "$SCAN_LOG"
        fi
    done
}

# 生成安全报告摘要
generate_summary() {
    log_info "生成安全扫描摘要..."
    
    echo "" | tee -a "$SCAN_LOG"
    echo "========================================" | tee -a "$SCAN_LOG"
    echo "安全扫描摘要 - $(date)" | tee -a "$SCAN_LOG"
    echo "========================================" | tee -a "$SCAN_LOG"
    
    # 统计警告和错误
    WARNINGS=$(grep -c "\[WARNING\]" "$SCAN_LOG" || echo "0")
    ERRORS=$(grep -c "\[ERROR\]" "$SCAN_LOG" || echo "0")
    
    echo "警告数量: $WARNINGS" | tee -a "$SCAN_LOG"
    echo "错误数量: $ERRORS" | tee -a "$SCAN_LOG"
    
    if [ "$ERRORS" -gt 0 ]; then
        log_error "发现 $ERRORS 个安全错误，需要立即处理"
    elif [ "$WARNINGS" -gt 0 ]; then
        log_warning "发现 $WARNINGS 个安全警告，建议尽快处理"
    else
        log_success "未发现严重安全问题"
    fi
    
    echo "详细报告: $SCAN_LOG" | tee -a "$SCAN_LOG"
}

# 主函数
main() {
    # 加载环境变量
    if [ -f ".env" ]; then
        source .env
    fi
    
    start_scan
    
    check_system_updates
    check_npm_vulnerabilities
    check_docker_vulnerabilities
    check_open_ports
    check_file_permissions
    check_environment_security
    check_ssl_certificates
    check_database_security
    check_log_files
    
    generate_summary
    
    log_info "安全扫描完成"
}

# 执行主函数
main "$@"