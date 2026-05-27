UPDATE identity.users
SET role = 'PARTNER_MANAGER',
    updated_at = now()
WHERE role = 'COMPANY_MANAGER';

UPDATE organization.organization_members
SET role = 'PARTNER_MANAGER'
WHERE role = 'COMPANY_MANAGER';
