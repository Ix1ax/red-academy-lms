-- ─── Seed: Organizations ─────────────────────────────────────────────────────
INSERT INTO organization.organizations (id, name, type, status, description)
VALUES
    ('00000000-0000-0000-0000-000000000001', 'РедАкадемия',    'MAIN_COMPANY', 'ACTIVE', 'Образовательная платформа РедСофт'),
    ('00000000-0000-0000-0000-000000000002', 'ТехКорп',        'COMPANY',      'ACTIVE', 'Корпоративный партнёр — технологическая компания'),
    ('00000000-0000-0000-0000-000000000003', 'Партнёр Медиа',  'PARTNER',      'ACTIVE', 'Партнёрская образовательная организация')
ON CONFLICT (id) DO UPDATE SET
    name        = EXCLUDED.name,
    type        = EXCLUDED.type,
    status      = EXCLUDED.status,
    description = EXCLUDED.description,
    updated_at  = now();
