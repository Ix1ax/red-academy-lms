ALTER TABLE organization.organizations
    ADD COLUMN IF NOT EXISTS inn VARCHAR(12),
    ADD COLUMN IF NOT EXISTS ogrn VARCHAR(15),
    ADD COLUMN IF NOT EXISTS doc_inn_id UUID,
    ADD COLUMN IF NOT EXISTS doc_egrul_id UUID,
    ADD COLUMN IF NOT EXISTS doc_charter_id UUID,
    ADD COLUMN IF NOT EXISTS doc_poa_id UUID,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

ALTER TABLE organization.partner_requests
    ADD COLUMN IF NOT EXISTS review_reason TEXT;
