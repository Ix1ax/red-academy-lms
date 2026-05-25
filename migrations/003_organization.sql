CREATE TABLE IF NOT EXISTS organization.organizations (
    id           UUID PRIMARY KEY,
    name         VARCHAR(255) NOT NULL,
    type         VARCHAR(64)  NOT NULL,
    status       VARCHAR(64)  NOT NULL,
    description  TEXT,
    inn          VARCHAR(12),
    ogrn         VARCHAR(15),
    doc_inn_id   UUID,
    doc_egrul_id UUID,
    doc_charter_id UUID,
    doc_poa_id   UUID,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS organization.partner_requests (
    id              UUID PRIMARY KEY,
    organization_id UUID REFERENCES organization.organizations(id) ON DELETE CASCADE,
    company_name    VARCHAR(255) NOT NULL,
    contact_email   VARCHAR(255) NOT NULL,
    description     TEXT,
    status          VARCHAR(64)  NOT NULL,
    review_reason   TEXT,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    reviewed_at     TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_partner_requests_org_pending
    ON organization.partner_requests(organization_id)
    WHERE status = 'PENDING' AND organization_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS organization.organization_members (
    id              UUID PRIMARY KEY,
    organization_id UUID        NOT NULL REFERENCES organization.organizations(id) ON DELETE CASCADE,
    user_id         UUID        NOT NULL,
    role            VARCHAR(64) NOT NULL,
    status          VARCHAR(64) NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(organization_id, user_id)
);

CREATE TABLE IF NOT EXISTS organization.org_invites (
    id              UUID PRIMARY KEY,
    organization_id UUID        NOT NULL REFERENCES organization.organizations(id) ON DELETE CASCADE,
    email           VARCHAR(255) NOT NULL,
    role            VARCHAR(64)  NOT NULL DEFAULT 'CORPORATE_STUDENT',
    status          VARCHAR(64)  NOT NULL DEFAULT 'PENDING',
    message         TEXT,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    accepted_at     TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_org_invites_org_email_pending
    ON organization.org_invites(organization_id, lower(email))
    WHERE status = 'PENDING';
