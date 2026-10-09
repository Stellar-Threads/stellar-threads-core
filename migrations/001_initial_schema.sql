-- Stellar Threads Protocol — Database Migration 001
-- Initial schema for fashion commerce, designer registry, product passports, and escrow

CREATE TABLE IF NOT EXISTS designers (
    id VARCHAR(64) PRIMARY KEY,
    stellar_address VARCHAR(56) NOT NULL UNIQUE,
    brand_name VARCHAR(255) NOT NULL,
    atelier_location VARCHAR(255) NOT NULL,
    metadata_uri TEXT NOT NULL,
    verification_status VARCHAR(32) DEFAULT 'verified',
    registered_at BIGINT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_designers_stellar ON designers(stellar_address);

CREATE TABLE IF NOT EXISTS product_passports (
    id VARCHAR(64) PRIMARY KEY,
    product_id VARCHAR(128) NOT NULL UNIQUE,
    creator_address VARCHAR(56) NOT NULL,
    owner_address VARCHAR(56) NOT NULL,
    brand_name VARCHAR(255) NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    metadata_uri TEXT NOT NULL,
    integrity_hash VARCHAR(128) NOT NULL,
    total_edition INT DEFAULT 1,
    status INT DEFAULT 1, -- 1: Active, 2: Transferred, 3: Retired
    created_at_ledger BIGINT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_passports_product_id ON product_passports(product_id);
CREATE INDEX IF NOT EXISTS idx_passports_creator ON product_passports(creator_address);
CREATE INDEX IF NOT EXISTS idx_passports_owner ON product_passports(owner_address);

CREATE TABLE IF NOT EXISTS escrow_orders (
    id VARCHAR(64) PRIMARY KEY,
    order_id BIGINT NOT NULL UNIQUE,
    buyer_address VARCHAR(56) NOT NULL,
    seller_address VARCHAR(56) NOT NULL,
    token_address VARCHAR(56) NOT NULL,
    amount_stroops BIGINT NOT NULL,
    order_ref VARCHAR(255) NOT NULL,
    state INT NOT NULL DEFAULT 0, -- 0: Created, 1: Funded, 2: Released, 3: Refunded, 4: Cancelled
    created_at_ledger BIGINT NOT NULL,
    funded_at_ledger BIGINT,
    settled_at_ledger BIGINT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_escrow_order_id ON escrow_orders(order_id);
CREATE INDEX IF NOT EXISTS idx_escrow_buyer ON escrow_orders(buyer_address);
CREATE INDEX IF NOT EXISTS idx_escrow_seller ON escrow_orders(seller_address);

CREATE TABLE IF NOT EXISTS contract_events (
    id VARCHAR(128) PRIMARY KEY,
    contract_id VARCHAR(56) NOT NULL,
    contract_name VARCHAR(64) NOT NULL,
    event_type VARCHAR(64) NOT NULL,
    ledger_index BIGINT NOT NULL,
    ledger_closed_at VARCHAR(64) NOT NULL,
    transaction_hash VARCHAR(128) NOT NULL,
    event_payload JSONB NOT NULL,
    indexed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_events_contract ON contract_events(contract_id);
CREATE INDEX IF NOT EXISTS idx_events_ledger ON contract_events(ledger_index);
CREATE INDEX IF NOT EXISTS idx_events_type ON contract_events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_tx ON contract_events(transaction_hash);

CREATE TABLE IF NOT EXISTS indexer_checkpoints (
    id VARCHAR(32) PRIMARY KEY DEFAULT 'soroban_main',
    last_processed_ledger BIGINT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
