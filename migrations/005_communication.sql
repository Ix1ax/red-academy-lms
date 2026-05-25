CREATE TABLE IF NOT EXISTS communication.notifications (
    id UUID PRIMARY KEY,
    user_id UUID,
    organization_id UUID,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(64) NOT NULL,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS communication.files (
    id UUID PRIMARY KEY,
    owner_user_id UUID,
    organization_id UUID,
    bucket VARCHAR(255) NOT NULL,
    object_key TEXT NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    content_type VARCHAR(255) NOT NULL,
    size_bytes BIGINT NOT NULL,
    access_level VARCHAR(64) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS communication.audit_log (
    id UUID PRIMARY KEY,
    actor_user_id UUID,
    action VARCHAR(255) NOT NULL,
    entity_type VARCHAR(255) NOT NULL,
    entity_id UUID,
    details TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
