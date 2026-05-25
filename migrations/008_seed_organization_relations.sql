-- ─── Seed: Organization members ──────────────────────────────────────────────
INSERT INTO organization.organization_members (id, organization_id, user_id, role, status)
VALUES
    ('40000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001',
     '30000000-0000-0000-0000-000000000001', 'OWNER',            'ACTIVE'),
    ('40000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001',
     '30000000-0000-0000-0000-000000000003', 'MENTOR',  'ACTIVE'),
    ('40000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000002',
     '30000000-0000-0000-0000-000000000004', 'OWNER',            'ACTIVE'),
    ('40000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000003',
     '30000000-0000-0000-0000-000000000005', 'OWNER',            'ACTIVE')
ON CONFLICT (organization_id, user_id) DO UPDATE SET
    role   = EXCLUDED.role,
    status = EXCLUDED.status;

-- ─── Seed: Partner requests (одобренные) ─────────────────────────────────────
INSERT INTO organization.partner_requests (id, organization_id, company_name, contact_email, description, status)
VALUES
    ('50000000-0000-0000-0000-000000000001',
     '00000000-0000-0000-0000-000000000002',
     'ТехКорп', 'manager@techcorp.ru',
     'Крупная технологическая компания, хотим запустить внутренние курсы.', 'APPROVED'),
    ('50000000-0000-0000-0000-000000000002',
     '00000000-0000-0000-0000-000000000003',
     'Партнёр Медиа', 'partner@media.edu',
     'Образовательный партнёр, создаём авторские программы.', 'APPROVED')
ON CONFLICT DO NOTHING;

DELETE FROM organization.partner_requests pr
USING organization.organizations o
WHERE pr.organization_id = o.id
  AND o.type = 'MAIN_COMPANY';
