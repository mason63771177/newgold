-- 创建用户钱包地址表
CREATE TABLE IF NOT EXISTS user_wallet_addresses (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
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

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_user_wallet_addresses_user_id ON user_wallet_addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_user_wallet_addresses_address ON user_wallet_addresses(address);
CREATE INDEX IF NOT EXISTS idx_user_wallet_addresses_status ON user_wallet_addresses(status);
CREATE INDEX IF NOT EXISTS idx_user_wallet_addresses_network ON user_wallet_addresses(network);

-- 资金归集记录表
CREATE TABLE IF NOT EXISTS fund_consolidation_records (
    id BIGSERIAL PRIMARY KEY,
    batch_id VARCHAR(50) NOT NULL,
    from_address VARCHAR(42) NOT NULL,
    to_address VARCHAR(42) NOT NULL,
    user_id BIGINT,
    amount DECIMAL(15,8) NOT NULL,
    fee DECIMAL(15,8) NOT NULL DEFAULT 0.00000000,
    tx_hash VARCHAR(255),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed')),
    network VARCHAR(20) NOT NULL DEFAULT 'testnet',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    confirmed_at TIMESTAMP WITH TIME ZONE
);

-- 创建资金归集记录表索引
CREATE INDEX IF NOT EXISTS idx_fund_consolidation_records_batch_id ON fund_consolidation_records(batch_id);
CREATE INDEX IF NOT EXISTS idx_fund_consolidation_records_user_id ON fund_consolidation_records(user_id);
CREATE INDEX IF NOT EXISTS idx_fund_consolidation_records_status ON fund_consolidation_records(status);