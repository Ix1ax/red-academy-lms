-- ─── Seed: Users (пароль для всех — Test1234!) ───────────────────────────────
-- Hash: $2b$10$6IxopF9Tq2k.Zb02RYV/0ubtlGRmYZ6bkIB83u5Pil.Bq4mB2g/du  ← bcrypt(Test1234!)
INSERT INTO identity.users (id, email, password_hash, full_name, role, organization_id)
VALUES
    -- Администратор платформы
    ('30000000-0000-0000-0000-000000000001', 'admin@red.academy',
     '$2b$10$6IxopF9Tq2k.Zb02RYV/0ubtlGRmYZ6bkIB83u5Pil.Bq4mB2g/du',
     'Александр Владимиров', 'ADMIN', '00000000-0000-0000-0000-000000000001'),
    -- Обычный студент
    ('30000000-0000-0000-0000-000000000002', 'student@red.academy',
     '$2b$10$6IxopF9Tq2k.Zb02RYV/0ubtlGRmYZ6bkIB83u5Pil.Bq4mB2g/du',
     'Мария Студентова', 'STUDENT', NULL),
    -- Ментор
    ('30000000-0000-0000-0000-000000000003', 'mentor@red.academy',
     '$2b$10$6IxopF9Tq2k.Zb02RYV/0ubtlGRmYZ6bkIB83u5Pil.Bq4mB2g/du',
     'Дмитрий Наставников', 'MENTOR', '00000000-0000-0000-0000-000000000001'),
    -- Менеджер компании-партнёра ТехКорп
    ('30000000-0000-0000-0000-000000000004', 'manager@techcorp.ru',
     '$2b$10$6IxopF9Tq2k.Zb02RYV/0ubtlGRmYZ6bkIB83u5Pil.Bq4mB2g/du',
     'Ольга Менеджерова', 'PARTNER_MANAGER', '00000000-0000-0000-0000-000000000002'),
    -- Партнёрский менеджер
    ('30000000-0000-0000-0000-000000000005', 'partner@media.edu',
     '$2b$10$6IxopF9Tq2k.Zb02RYV/0ubtlGRmYZ6bkIB83u5Pil.Bq4mB2g/du',
     'Иван Партнёров', 'PARTNER_MANAGER', '00000000-0000-0000-0000-000000000003')
ON CONFLICT (id) DO UPDATE SET
    full_name       = EXCLUDED.full_name,
    role            = EXCLUDED.role,
    organization_id = EXCLUDED.organization_id,
    updated_at      = now();
