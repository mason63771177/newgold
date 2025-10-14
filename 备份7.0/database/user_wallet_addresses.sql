-- 用户钱包地址映射表
-- 为每个用户分配专属的TRC20 USDT充值地址

CREATE TABLE user_wallet_addresses (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    address VARCHAR(42) NOT NULL UNIQUE,
    address_index INTEGER NOT NULL,
    private_key_encrypted TEXT,
    network VARCHAR(20) NOT NULL DEFAULT 'testnet',
    currency VARCHAR(10) NOT NULL DEFAULT 'USDT',
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    total_received DECIMAL(15,8) NOT NULL DEFAULT 0.00000000,
    last_deposit_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- 确保每个用户只有一个活跃的充值地址
    UNIQUE(user_id, currency, network)
);

-- 表注释
COMMENT ON TABLE user_wallet_addresses IS '用户钱包地址映射表';
COMMENT ON COLUMN user_wallet_addresses.user_id IS '用户ID';
COMMENT ON COLUMN user_wallet_addresses.address IS 'TRON钱包地址';
COMMENT ON COLUMN user_wallet_addresses.address_index IS '地址派生索引';
COMMENT ON COLUMN user_wallet_addresses.private_key_encrypted IS '加密的私钥（可选）';
COMMENT ON COLUMN user_wallet_addresses.network IS '网络类型：testnet/mainnet';
COMMENT ON COLUMN user_wallet_addresses.currency IS '币种：USDT';
COMMENT ON COLUMN user_wallet_addresses.status IS '地址状态：active-活跃，inactive-非活跃，suspended-暂停';
COMMENT ON COLUMN user_wallet_addresses.total_received IS '累计接收金额';
COMMENT ON COLUMN user_wallet_addresses.last_deposit_at IS '最后充值时间';

-- 创建索引
CREATE INDEX idx_user_wallet_addresses_user_id ON user_wallet_addresses(user_id);
CREATE INDEX idx_user_wallet_addresses_address ON user_wallet_addresses(address);
CREATE INDEX idx_user_wallet_addresses_status ON user_wallet_addresses(status);
CREATE INDEX idx_user_wallet_addresses_network ON user_wallet_addresses(network);

-- 资金归集记录表
CREATE TABLE fund_consolidation_records (
    id BIGSERIAL PRIMARY KEY,
    batch_id VARCHAR(50) NOT NULL,
    from_address VARCHAR(42) NOT NULL,
    to_address VARCHAR(42) NOT NULL,
    user_id UUID REFERENCES users(id),
    amount DECIMAL(15,8) NOT NULL,
    fee DECIMAL(15,8) NOT NULL DEFAULT 0.00000000,
    tx_hash VARCHAR(255),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed')),
    network VARCHAR(20) NOT NULL DEFAULT 'testnet',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    confirmed_at TIMESTAMP WITH TIME ZONE
);

-- 资金归集记录表注释
COMMENT ON TABLE fund_consolidation_records IS '资金归集记录表';
COMMENT ON COLUMN fund_consolidation_records.batch_id IS '批次ID';
COMMENT ON COLUMN fund_consolidation_records.from_address IS '源地址（用户充值地址）';
COMMENT ON COLUMN fund_consolidation_records.to_address IS '目标地址（主钱包地址）';
COMMENT ON COLUMN fund_consolidation_records.user_id IS '用户ID';
COMMENT ON COLUMN fund_consolidation_records.amount IS '归集金额';
COMMENT ON COLUMN fund_consolidation_records.fee IS '手续费';
COMMENT ON COLUMN fund_consolidation_records.tx_hash IS '交易哈希';
COMMENT ON COLUMN fund_consolidation_records.status IS '状态：pending-待确认，confirmed-已确认，failed-失败';

-- 创建资金归集记录索引
CREATE INDEX idx_fund_consolidation_batch_id ON fund_consolidation_records(batch_id);
CREATE INDEX idx_fund_consolidation_from_address ON fund_consolidation_records(from_address);
CREATE INDEX idx_fund_consolidation_user_id ON fund_consolidation_records(user_id);
CREATE INDEX idx_fund_consolidation_status ON fund_consolidation_records(status);
CREATE INDEX idx_fund_consolidation_created_at ON fund_consolidation_records(created_at);