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
