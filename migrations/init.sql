CREATE SCHEMA IF NOT EXISTS identity;
CREATE SCHEMA IF NOT EXISTS organization;
CREATE SCHEMA IF NOT EXISTS learning;
CREATE SCHEMA IF NOT EXISTS communication;

CREATE TABLE IF NOT EXISTS identity.users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(64) NOT NULL,
    organization_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS identity.refresh_tokens (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES identity.users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS organization.organizations (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(64) NOT NULL,
    status VARCHAR(64) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS organization.partner_requests (
    id UUID PRIMARY KEY,
    organization_id UUID REFERENCES organization.organizations(id) ON DELETE CASCADE,
    company_name VARCHAR(255) NOT NULL,
    contact_email VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(64) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    reviewed_at TIMESTAMPTZ
);

ALTER TABLE organization.partner_requests
    ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organization.organizations(id) ON DELETE CASCADE;

CREATE UNIQUE INDEX IF NOT EXISTS ux_partner_requests_org_pending
    ON organization.partner_requests(organization_id)
    WHERE status = 'PENDING' AND organization_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS organization.organization_members (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organization.organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    role VARCHAR(64) NOT NULL,
    status VARCHAR(64) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(organization_id, user_id)
);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'uk_organization_members_org_user'
    ) THEN
        ALTER TABLE organization.organization_members
            ADD CONSTRAINT uk_organization_members_org_user UNIQUE (organization_id, user_id);
    END IF;
END $$;

-- Employee invites (company → user by email, user accepts in profile)
CREATE TABLE IF NOT EXISTS organization.org_invites (
    id          UUID PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organization.organizations(id) ON DELETE CASCADE,
    email       VARCHAR(255) NOT NULL,
    role        VARCHAR(64)  NOT NULL DEFAULT 'CORPORATE_STUDENT',
    status      VARCHAR(64)  NOT NULL DEFAULT 'PENDING',
    message     TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    accepted_at TIMESTAMPTZ
);
CREATE UNIQUE INDEX IF NOT EXISTS ux_org_invites_org_email_pending
    ON organization.org_invites(organization_id, lower(email))
    WHERE status = 'PENDING';

-- Partner request review reason
ALTER TABLE organization.partner_requests
    ADD COLUMN IF NOT EXISTS review_reason TEXT;

CREATE TABLE IF NOT EXISTS learning.courses (
    id UUID PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    author_type VARCHAR(64) NOT NULL,
    course_type VARCHAR(64) NOT NULL DEFAULT 'PUBLIC',
    organization_id UUID,
    level VARCHAR(64) NOT NULL,
    duration_hours INT NOT NULL,
    status VARCHAR(64) NOT NULL,
    cover_url TEXT,
    content_object_key TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE learning.courses ADD COLUMN IF NOT EXISTS content_object_key TEXT;
ALTER TABLE learning.courses ADD COLUMN IF NOT EXISTS course_type VARCHAR(64) NOT NULL DEFAULT 'PUBLIC';
ALTER TABLE learning.courses ADD COLUMN IF NOT EXISTS has_certificate BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE organization.organizations ADD COLUMN IF NOT EXISTS inn VARCHAR(12);
ALTER TABLE organization.organizations ADD COLUMN IF NOT EXISTS ogrn VARCHAR(15);
ALTER TABLE organization.organizations ADD COLUMN IF NOT EXISTS doc_inn_id UUID;
ALTER TABLE organization.organizations ADD COLUMN IF NOT EXISTS doc_egrul_id UUID;
ALTER TABLE organization.organizations ADD COLUMN IF NOT EXISTS doc_charter_id UUID;
ALTER TABLE organization.organizations ADD COLUMN IF NOT EXISTS doc_poa_id UUID;

CREATE TABLE IF NOT EXISTS learning.lessons (
    id UUID PRIMARY KEY,
    course_id UUID NOT NULL REFERENCES learning.courses(id) ON DELETE CASCADE,
    parent_id UUID,
    item_type VARCHAR(64) NOT NULL DEFAULT 'LONGREAD',
    title VARCHAR(255) NOT NULL,
    content TEXT,
    test_schema JSONB,
    estimated_minutes INT NOT NULL DEFAULT 15,
    position INT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE learning.lessons ADD COLUMN IF NOT EXISTS parent_id UUID;
ALTER TABLE learning.lessons ADD COLUMN IF NOT EXISTS item_type VARCHAR(64) NOT NULL DEFAULT 'LONGREAD';
ALTER TABLE learning.lessons ADD COLUMN IF NOT EXISTS test_schema JSONB;
ALTER TABLE learning.lessons ADD COLUMN IF NOT EXISTS estimated_minutes INT NOT NULL DEFAULT 15;
ALTER TABLE learning.lessons ALTER COLUMN content DROP NOT NULL;
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_lessons_parent'
    ) THEN
        ALTER TABLE learning.lessons
            ADD CONSTRAINT fk_lessons_parent FOREIGN KEY (parent_id) REFERENCES learning.lessons(id) ON DELETE CASCADE;
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS learning.tasks (
    id UUID PRIMARY KEY,
    course_id UUID REFERENCES learning.courses(id) ON DELETE CASCADE,
    intensive_id UUID,
    intensive_stage_id UUID,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    deadline_at TIMESTAMPTZ,
    max_score INT NOT NULL DEFAULT 100,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE learning.tasks ADD COLUMN IF NOT EXISTS intensive_stage_id UUID;

CREATE TABLE IF NOT EXISTS learning.enrollments (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    course_id UUID NOT NULL REFERENCES learning.courses(id) ON DELETE CASCADE,
    progress INT NOT NULL DEFAULT 0,
    status VARCHAR(64) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id, course_id)
);

CREATE TABLE IF NOT EXISTS learning.lesson_progress (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    course_id UUID NOT NULL REFERENCES learning.courses(id) ON DELETE CASCADE,
    lesson_id UUID NOT NULL REFERENCES learning.lessons(id) ON DELETE CASCADE,
    status VARCHAR(64) NOT NULL,
    score INT NOT NULL DEFAULT 0,
    answer_json JSONB,
    completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id, lesson_id)
);

CREATE TABLE IF NOT EXISTS learning.intensives (
    id UUID PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    organizer_type VARCHAR(64) NOT NULL,
    organization_id UUID,
    status VARCHAR(64) NOT NULL,
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ NOT NULL,
    participant_limit INT NOT NULL,
    program_object_key TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE learning.intensives ADD COLUMN IF NOT EXISTS program_object_key TEXT;
ALTER TABLE learning.intensives ADD COLUMN IF NOT EXISTS registration_deadline TIMESTAMPTZ;
ALTER TABLE learning.intensives ADD COLUMN IF NOT EXISTS cover_url TEXT;

CREATE TABLE IF NOT EXISTS learning.intensive_stages (
    id UUID PRIMARY KEY,
    intensive_id UUID NOT NULL REFERENCES learning.intensives(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    task_title VARCHAR(255),
    task_description TEXT,
    answer_type VARCHAR(64) NOT NULL DEFAULT 'GITHUB_REPOSITORY',
    position INT NOT NULL,
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ NOT NULL
);

ALTER TABLE learning.intensive_stages ADD COLUMN IF NOT EXISTS task_title VARCHAR(255);
ALTER TABLE learning.intensive_stages ADD COLUMN IF NOT EXISTS task_description TEXT;
ALTER TABLE learning.intensive_stages ADD COLUMN IF NOT EXISTS answer_type VARCHAR(64) NOT NULL DEFAULT 'GITHUB_REPOSITORY';

CREATE TABLE IF NOT EXISTS learning.intensive_applications (
    id UUID PRIMARY KEY,
    intensive_id UUID NOT NULL REFERENCES learning.intensives(id) ON DELETE CASCADE,
    user_id UUID,
    organization_id UUID,
    github_url TEXT,
    status VARCHAR(64) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE learning.intensive_applications ADD COLUMN IF NOT EXISTS github_url TEXT;

CREATE TABLE IF NOT EXISTS learning.intensive_participants (
    id UUID PRIMARY KEY,
    intensive_id UUID NOT NULL REFERENCES learning.intensives(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    organization_id UUID,
    github_url TEXT,
    score INT NOT NULL DEFAULT 0,
    status VARCHAR(64) NOT NULL,
    eliminated_at TIMESTAMPTZ,
    eliminated_by UUID,
    elimination_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(intensive_id, user_id)
);

ALTER TABLE learning.intensive_participants ADD COLUMN IF NOT EXISTS github_url TEXT;
ALTER TABLE learning.intensive_participants ADD COLUMN IF NOT EXISTS eliminated_at TIMESTAMPTZ;
ALTER TABLE learning.intensive_participants ADD COLUMN IF NOT EXISTS eliminated_by UUID;
ALTER TABLE learning.intensive_participants ADD COLUMN IF NOT EXISTS elimination_reason TEXT;

CREATE TABLE IF NOT EXISTS learning.intensive_managers (
    id UUID PRIMARY KEY,
    intensive_id UUID NOT NULL REFERENCES learning.intensives(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    organization_id UUID NOT NULL,
    role VARCHAR(64) NOT NULL DEFAULT 'INTENSIVE_MANAGER',
    status VARCHAR(64) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(intensive_id, user_id)
);

CREATE TABLE IF NOT EXISTS learning.task_submissions (
    id UUID PRIMARY KEY,
    task_id UUID NOT NULL REFERENCES learning.tasks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    file_id UUID,
    answer_text TEXT,
    github_url TEXT,
    score INT,
    status VARCHAR(64) NOT NULL,
    reviewer_comment TEXT,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    reviewed_at TIMESTAMPTZ
);

ALTER TABLE learning.task_submissions ADD COLUMN IF NOT EXISTS github_url TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS ux_task_submissions_task_user ON learning.task_submissions(task_id, user_id);

CREATE TABLE IF NOT EXISTS learning.certificates (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    course_id UUID REFERENCES learning.courses(id) ON DELETE SET NULL,
    intensive_id UUID REFERENCES learning.intensives(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    file_id UUID,
    issued_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

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


-- ═══════════════════════════════════════════════════════════════════════════════
-- SEED: COURSES (6 курсов — официальные, партнёрские, корпоративный)
-- ═══════════════════════════════════════════════════════════════════════════════
INSERT INTO learning.courses
    (id, title, description, author_type, course_type, organization_id, level, duration_hours, status)
VALUES
    -- ── Официальные курсы РедАкадемии ──────────────────────────────────────
    ('a0000000-0000-0000-0000-000000000001',
     'Python для начинающих',
     'Полный курс по Python с нуля: синтаксис, структуры данных, функции и ООП. Подходит тем, кто никогда не программировал.',
     'MAIN_COMPANY', 'PUBLIC', '00000000-0000-0000-0000-000000000001',
     'BEGINNER', 24, 'PUBLISHED'),

    ('a0000000-0000-0000-0000-000000000002',
     'Веб-разработка на React',
     'Современный фронтенд на React 18: компоненты, хуки, роутинг, TypeScript и работа с REST API. Практические проекты в каждом разделе.',
     'MAIN_COMPANY', 'PUBLIC', '00000000-0000-0000-0000-000000000001',
     'INTERMEDIATE', 36, 'PUBLISHED'),

    ('a0000000-0000-0000-0000-000000000003',
     'Алгоритмы и структуры данных',
     'Глубокое погружение в классические алгоритмы: сортировка, поиск, графы, динамическое программирование. Разбор задач с LeetCode.',
     'MAIN_COMPANY', 'PUBLIC', '00000000-0000-0000-0000-000000000001',
     'ADVANCED', 48, 'PUBLISHED'),

    -- ── Партнёрские курсы (Партнёр Медиа) ──────────────────────────────────
    ('a0000000-0000-0000-0000-000000000004',
     'UX/UI дизайн с нуля',
     'Научитесь проектировать удобные интерфейсы: исследование пользователей, вайрфреймы, прототипы в Figma и тестирование юзабилити.',
     'PARTNER', 'PUBLIC', '00000000-0000-0000-0000-000000000003',
     'BEGINNER', 28, 'PUBLISHED'),

    ('a0000000-0000-0000-0000-000000000005',
     'Продуктовый менеджмент',
     'Полный курс по управлению IT-продуктом: discovery, метрики, роудмап, работа с командой и стейкхолдерами. Разбор реальных кейсов.',
     'PARTNER', 'PUBLIC', '00000000-0000-0000-0000-000000000003',
     'INTERMEDIATE', 32, 'PUBLISHED'),

    -- ── Корпоративный курс ТехКорп ──────────────────────────────────────────
    ('a0000000-0000-0000-0000-000000000006',
     'Информационная безопасность для сотрудников',
     'Обязательный курс по корпоративной ИБ: фишинг, социальная инженерия, защита данных и действия при инцидентах.',
     'COMPANY', 'COMPANY', '00000000-0000-0000-0000-000000000002',
     'BEGINNER', 8, 'PUBLISHED')

ON CONFLICT (id) DO UPDATE SET
    title        = EXCLUDED.title,
    description  = EXCLUDED.description,
    status       = EXCLUDED.status,
    updated_at   = now();


-- ═══════════════════════════════════════════════════════════════════════════════
-- SEED: LESSONS — Курс 1: Python для начинающих
-- ═══════════════════════════════════════════════════════════════════════════════
INSERT INTO learning.lessons
    (id, course_id, parent_id, item_type, title, content, test_schema, estimated_minutes, position)
VALUES
    -- Модуль 1: Основы языка
    ('b1000000-0000-0000-0000-000000000001',
     'a0000000-0000-0000-0000-000000000001', NULL, 'FOLDER',
     'Основы языка', NULL, NULL, 0, 1),

    ('b1000000-0000-0000-0000-000000000002',
     'a0000000-0000-0000-0000-000000000001',
     'b1000000-0000-0000-0000-000000000001', 'LONGREAD',
     'Введение в Python',
     E'## Что такое Python?\n\nPython — высокоуровневый интерпретируемый язык программирования с динамической типизацией. Создан Гвидо ван Россумом в 1991 году.\n\n### Почему Python?\n- Простой и читаемый синтаксис\n- Огромная экосистема библиотек (pip)\n- Применяется в веб-разработке, анализе данных и машинном обучении\n\n### Первая программа\n```python\nprint("Hello, World!")\n```\n\nДля запуска интерпретатора выполните команду `python3` в терминале. Интерактивный режим позволяет вводить и сразу выполнять команды.\n\n### Установка\nСкачайте Python с официального сайта python.org. Установите расширение Python для VS Code — оно добавит подсветку синтаксиса и отладчик.',
     NULL, 15, 2),

    ('b1000000-0000-0000-0000-000000000003',
     'a0000000-0000-0000-0000-000000000001',
     'b1000000-0000-0000-0000-000000000001', 'LONGREAD',
     'Переменные и типы данных',
     E'## Переменные в Python\n\nПеременные объявляются простым присваиванием — указывать тип не нужно.\n\n```python\nname = "Мария"\nage = 25\nprice = 9.99\nis_active = True\n```\n\n### Основные типы данных\n\n**int — целые числа**\n```python\nx = 42\ny = -100\nbig = 1_000_000  # подчёркивание для читаемости\n```\n\n**float — числа с плавающей точкой**\n```python\npi = 3.14159\ntemperature = -17.5\n```\n\n**str — строки**\n```python\ngreeting = "Привет"\nmultiline = """Строка\nна несколько\nстрок"""\nformatted = f"Привет, {name}! Тебе {age} лет."\n```\n\n**bool — булевы значения**\n```python\nflag = True\nempty = False\n```\n\n### Функция type()\nПозволяет узнать тип переменной:\n```python\nprint(type(42))     # <class int>\nprint(type(3.14))   # <class float>\nprint(type("hi"))   # <class str>\n```',
     NULL, 20, 3),

    ('b1000000-0000-0000-0000-000000000004',
     'a0000000-0000-0000-0000-000000000001',
     'b1000000-0000-0000-0000-000000000001', 'TEST',
     'Тест: Основы Python',
     NULL,
     '{"questions":[{"type":"SINGLE","title":"Какой тип данных хранит целые числа в Python?","options":["int","float","str","bool"],"answer":"int"},{"type":"SINGLE","title":"Что выведет print(type(3.14))?","options":["<class int>","<class float>","<class number>","<class str>"],"answer":"<class float>"},{"type":"SINGLE","title":"Как правильно объявить переменную x равную 5?","options":["var x = 5","int x = 5","x = 5","x := 5"],"answer":"x = 5"}]}',
     10, 4),

    -- Модуль 2: Управляющие конструкции
    ('b1000000-0000-0000-0000-000000000005',
     'a0000000-0000-0000-0000-000000000001', NULL, 'FOLDER',
     'Управляющие конструкции', NULL, NULL, 0, 5),

    ('b1000000-0000-0000-0000-000000000006',
     'a0000000-0000-0000-0000-000000000001',
     'b1000000-0000-0000-0000-000000000005', 'LONGREAD',
     'Условия: if, elif, else',
     E'## Условные операторы\n\nУсловный оператор `if` выполняет блок кода только если условие истинно.\n\n```python\nage = 18\n\nif age >= 18:\n    print("Совершеннолетний")\nelif age >= 14:\n    print("Подросток")\nelse:\n    print("Ребёнок")\n```\n\n### Операторы сравнения\n| Оператор | Значение |\n|----------|----------|\n| `==` | равно |\n| `!=` | не равно |\n| `>` | больше |\n| `<` | меньше |\n| `>=` | больше или равно |\n| `<=` | меньше или равно |\n\n### Логические операторы\n```python\nx = 15\nif x > 10 and x < 20:\n    print("Число от 10 до 20")\n\nif x < 0 or x > 100:\n    print("Выход за пределы")\n\nif not (x == 0):\n    print("Ненулевое значение")\n```\n\n### Тернарный оператор\n```python\nstatus = "совершеннолетний" if age >= 18 else "несовершеннолетний"\n```',
     NULL, 20, 6),

    ('b1000000-0000-0000-0000-000000000007',
     'a0000000-0000-0000-0000-000000000001',
     'b1000000-0000-0000-0000-000000000005', 'LONGREAD',
     'Циклы: for и while',
     E'## Циклы в Python\n\n### Цикл for\nИтерирует по последовательности — списку, строке, range и другим объектам.\n\n```python\nfruits = ["яблоко", "банан", "вишня"]\nfor fruit in fruits:\n    print(fruit)\n\n# range() генерирует числа\nfor i in range(5):         # 0 1 2 3 4\n    print(i)\n\nfor i in range(2, 10, 2):  # 2 4 6 8\n    print(i)\n```\n\n### Цикл while\nВыполняется пока условие истинно.\n\n```python\ncount = 0\nwhile count < 5:\n    print(count)\n    count += 1\n```\n\n### Управление циклом\n```python\nfor i in range(10):\n    if i == 5:\n        break      # выйти из цикла\n    if i % 2 == 0:\n        continue   # пропустить итерацию\n    print(i)\n```\n\n### enumerate и zip\n```python\nfor index, value in enumerate(fruits):\n    print(f"{index}: {value}")\n\nnames = ["Анна", "Борис"]\nscores = [95, 87]\nfor name, score in zip(names, scores):\n    print(f"{name}: {score}")\n```',
     NULL, 20, 7),

    ('b1000000-0000-0000-0000-000000000008',
     'a0000000-0000-0000-0000-000000000001',
     'b1000000-0000-0000-0000-000000000005', 'TEST',
     'Тест: Управляющие конструкции',
     NULL,
     '{"questions":[{"type":"SINGLE","title":"Какой оператор используется для выхода из цикла?","options":["continue","break","return","exit"],"answer":"break"},{"type":"SINGLE","title":"Что выведет range(2, 8, 2)?","options":["2 4 6 8","2 4 6","0 2 4 6","2 3 4 5 6 7"],"answer":"2 4 6"},{"type":"SINGLE","title":"Что делает оператор continue внутри цикла?","options":["Завершает программу","Выходит из цикла","Пропускает текущую итерацию","Перезапускает цикл"],"answer":"Пропускает текущую итерацию"}]}',
     10, 8)

ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, content = EXCLUDED.content, position = EXCLUDED.position;


-- ═══════════════════════════════════════════════════════════════════════════════
-- SEED: LESSONS — Курс 2: Веб-разработка на React
-- ═══════════════════════════════════════════════════════════════════════════════
INSERT INTO learning.lessons
    (id, course_id, parent_id, item_type, title, content, test_schema, estimated_minutes, position)
VALUES
    -- Модуль 1: Основы React
    ('b2000000-0000-0000-0000-000000000001',
     'a0000000-0000-0000-0000-000000000002', NULL, 'FOLDER',
     'Основы React', NULL, NULL, 0, 1),

    ('b2000000-0000-0000-0000-000000000002',
     'a0000000-0000-0000-0000-000000000002',
     'b2000000-0000-0000-0000-000000000001', 'LONGREAD',
     'Что такое React и Virtual DOM',
     E'## React — библиотека для UI\n\nReact — JavaScript-библиотека для построения пользовательских интерфейсов, разработанная Facebook (Meta). Первый релиз — 2013 год.\n\n### Основные идеи\n- **Компонентный подход**: UI разбивается на переиспользуемые компоненты\n- **Декларативный стиль**: описываем что хотим видеть, а не как это делать\n- **Virtual DOM**: React работает с виртуальной копией DOM и применяет только нужные изменения\n\n### Virtual DOM\n\nПри изменении состояния React:\n1. Создаёт новое дерево Virtual DOM\n2. Сравнивает его с предыдущим (reconciliation)\n3. Применяет только изменённые части к реальному DOM\n\nЭто значительно ускоряет обновление интерфейса.\n\n### Первый компонент\n```jsx\nfunction Welcome() {\n  return <h1>Привет, React!</h1>;\n}\n\nexport default Welcome;\n```\n\nКомпонент — это просто функция, которая возвращает JSX.',
     NULL, 20, 2),

    ('b2000000-0000-0000-0000-000000000003',
     'a0000000-0000-0000-0000-000000000002',
     'b2000000-0000-0000-0000-000000000001', 'LONGREAD',
     'JSX и props',
     E'## JSX — расширение синтаксиса\n\nJSX позволяет писать HTML-подобный синтаксис прямо в JavaScript. Babel компилирует JSX в вызовы `React.createElement()`.\n\n```jsx\n// JSX\nconst element = <h1 className="title">Заголовок</h1>;\n\n// Компилируется в\nconst element = React.createElement(\n  "h1",\n  { className: "title" },\n  "Заголовок"\n);\n```\n\n### Важные отличия от HTML\n- `class` → `className`\n- `for` → `htmlFor`\n- Все теги должны быть закрыты: `<br />`\n- Можно вставлять выражения в `{}`\n\n```jsx\nconst name = "Мария";\nconst element = <p>Привет, {name}!</p>;\n```\n\n### Props — свойства компонента\n\nProps передаются как атрибуты и доступны в функции компонента.\n\n```jsx\nfunction UserCard({ name, age, role }) {\n  return (\n    <div className="card">\n      <h2>{name}</h2>\n      <p>Возраст: {age}</p>\n      <span>{role}</span>\n    </div>\n  );\n}\n\n// Использование\n<UserCard name="Анна" age={28} role="Разработчик" />\n```',
     NULL, 25, 3),

    ('b2000000-0000-0000-0000-000000000004',
     'a0000000-0000-0000-0000-000000000002',
     'b2000000-0000-0000-0000-000000000001', 'TEST',
     'Тест: Основы React',
     NULL,
     '{"questions":[{"type":"SINGLE","title":"Что такое JSX?","options":["Отдельный язык программирования","Синтаксическое расширение JavaScript","База данных для React","CSS-фреймворк"],"answer":"Синтаксическое расширение JavaScript"},{"type":"SINGLE","title":"Как передать данные из родительского компонента в дочерний?","options":["Через state","Через props","Через context","Через ref"],"answer":"Через props"},{"type":"SINGLE","title":"Какой атрибут используется вместо class в JSX?","options":["class","cssClass","className","styleClass"],"answer":"className"}]}',
     10, 4),

    -- Модуль 2: Хуки
    ('b2000000-0000-0000-0000-000000000005',
     'a0000000-0000-0000-0000-000000000002', NULL, 'FOLDER',
     'Хуки React', NULL, NULL, 0, 5),

    ('b2000000-0000-0000-0000-000000000006',
     'a0000000-0000-0000-0000-000000000002',
     'b2000000-0000-0000-0000-000000000005', 'LONGREAD',
     'useState — управление состоянием',
     E'## Хук useState\n\n`useState` позволяет добавить локальное состояние в функциональный компонент.\n\n```jsx\nimport { useState } from "react";\n\nfunction Counter() {\n  const [count, setCount] = useState(0); // начальное значение 0\n\n  return (\n    <div>\n      <p>Счётчик: {count}</p>\n      <button onClick={() => setCount(count + 1)}>+</button>\n      <button onClick={() => setCount(count - 1)}>-</button>\n      <button onClick={() => setCount(0)}>Сброс</button>\n    </div>\n  );\n}\n```\n\n### Правила\n- Вызывать хуки только на верхнем уровне функции компонента\n- Не вызывать внутри условий, циклов или вложенных функций\n\n### Функциональное обновление\n```jsx\n// Лучше использовать функцию когда новое состояние зависит от старого\nsetCount(prev => prev + 1);\n```\n\n### Объект в состоянии\n```jsx\nconst [user, setUser] = useState({ name: "Анна", age: 28 });\n\n// Обновление поля объекта (spread)\nsetUser(prev => ({ ...prev, age: 29 }));\n```',
     NULL, 25, 6),

    ('b2000000-0000-0000-0000-000000000007',
     'a0000000-0000-0000-0000-000000000002',
     'b2000000-0000-0000-0000-000000000005', 'LONGREAD',
     'useEffect — сайд-эффекты',
     E'## Хук useEffect\n\n`useEffect` позволяет выполнять сайд-эффекты: запросы к API, подписки на события, работа с DOM.\n\n```jsx\nimport { useState, useEffect } from "react";\n\nfunction UserList() {\n  const [users, setUsers] = useState([]);\n\n  useEffect(() => {\n    fetch("/api/users")\n      .then(res => res.json())\n      .then(data => setUsers(data));\n  }, []); // [] означает запуск только один раз при монтировании\n\n  return <ul>{users.map(u => <li key={u.id}>{u.name}</li>)}</ul>;\n}\n```\n\n### Массив зависимостей\n```jsx\n// Запуск при каждом рендере (без второго аргумента)\nuseEffect(() => { /* ... */ });\n\n// Запуск только при монтировании\nuseEffect(() => { /* ... */ }, []);\n\n// Запуск при изменении userId\nuseEffect(() => { /* ... */ }, [userId]);\n```\n\n### Функция очистки\n```jsx\nuseEffect(() => {\n  const timer = setInterval(() => setCount(c => c + 1), 1000);\n\n  // Эта функция вызывается при размонтировании или перед следующим эффектом\n  return () => clearInterval(timer);\n}, []);\n```',
     NULL, 25, 7),

    ('b2000000-0000-0000-0000-000000000008',
     'a0000000-0000-0000-0000-000000000002',
     'b2000000-0000-0000-0000-000000000005', 'TEST',
     'Тест: Хуки React',
     NULL,
     '{"questions":[{"type":"SINGLE","title":"Что означает пустой массив [] как второй аргумент useEffect?","options":["Эффект не запускается никогда","Эффект запускается при каждом рендере","Эффект запускается один раз при монтировании","Эффект запускается при размонтировании"],"answer":"Эффект запускается один раз при монтировании"},{"type":"SINGLE","title":"Что возвращает функция очистки в useEffect?","options":["Новое состояние","Промис","Функция для отмены побочного эффекта","JSX-элемент"],"answer":"Функция для отмены побочного эффекта"},{"type":"SINGLE","title":"Что вернёт useState(0)?","options":["Число 0","Массив [значение, функция-сеттер]","Объект { value, setValue }","Функцию обновления"],"answer":"Массив [значение, функция-сеттер]"}]}',
     10, 8)

ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, content = EXCLUDED.content, position = EXCLUDED.position;


-- ═══════════════════════════════════════════════════════════════════════════════
-- SEED: LESSONS — Курс 3: Алгоритмы и структуры данных
-- ═══════════════════════════════════════════════════════════════════════════════
INSERT INTO learning.lessons
    (id, course_id, parent_id, item_type, title, content, test_schema, estimated_minutes, position)
VALUES
    ('b3000000-0000-0000-0000-000000000001',
     'a0000000-0000-0000-0000-000000000003', NULL, 'FOLDER',
     'Анализ сложности', NULL, NULL, 0, 1),

    ('b3000000-0000-0000-0000-000000000002',
     'a0000000-0000-0000-0000-000000000003',
     'b3000000-0000-0000-0000-000000000001', 'LONGREAD',
     'Нотация Big O',
     E'## Оценка сложности алгоритмов\n\nBig O нотация описывает как растёт время выполнения или потребление памяти алгоритма в зависимости от размера входных данных.\n\n### Основные классы сложности\n\n| Нотация | Название | Пример |\n|---------|----------|--------|\n| O(1) | Константная | Доступ к элементу массива по индексу |\n| O(log n) | Логарифмическая | Бинарный поиск |\n| O(n) | Линейная | Линейный поиск |\n| O(n log n) | Линейно-логарифмическая | Быстрая сортировка |\n| O(n²) | Квадратичная | Сортировка пузырьком |\n| O(2ⁿ) | Экспоненциальная | Перебор всех подмножеств |\n\n### Примеры\n\n```python\n# O(1) — константное время\ndef get_first(arr):\n    return arr[0]\n\n# O(n) — линейное время\ndef find_max(arr):\n    max_val = arr[0]\n    for x in arr:  # n итераций\n        if x > max_val:\n            max_val = x\n    return max_val\n\n# O(n²) — квадратичное время\ndef has_duplicates(arr):\n    for i in range(len(arr)):    # n\n        for j in range(len(arr)):  # n\n            if i != j and arr[i] == arr[j]:\n                return True\n    return False\n```',
     NULL, 30, 2),

    ('b3000000-0000-0000-0000-000000000003',
     'a0000000-0000-0000-0000-000000000003',
     'b3000000-0000-0000-0000-000000000001', 'LONGREAD',
     'Сортировки: пузырьком и быстрая',
     E'## Алгоритмы сортировки\n\n### Сортировка пузырьком — O(n²)\n\nМногократно проходит по массиву и меняет соседние элементы, если они стоят не в том порядке.\n\n```python\ndef bubble_sort(arr):\n    n = len(arr)\n    for i in range(n):\n        for j in range(n - i - 1):\n            if arr[j] > arr[j + 1]:\n                arr[j], arr[j + 1] = arr[j + 1], arr[j]\n    return arr\n```\n\n**Минус**: медленная O(n²), не подходит для больших данных.\n\n### Быстрая сортировка — O(n log n)\n\nДелит массив вокруг опорного элемента (pivot), рекурсивно сортирует части.\n\n```python\ndef quick_sort(arr):\n    if len(arr) <= 1:\n        return arr\n\n    pivot = arr[len(arr) // 2]\n    left   = [x for x in arr if x < pivot]\n    middle = [x for x in arr if x == pivot]\n    right  = [x for x in arr if x > pivot]\n\n    return quick_sort(left) + middle + quick_sort(right)\n```\n\n**Плюс**: средняя сложность O(n log n), один из самых быстрых на практике.\n\n### Встроенная сортировка Python\n```python\ndata = [5, 2, 8, 1, 9]\nsorted_data = sorted(data)   # возвращает новый список\ndata.sort()                  # сортирует на месте\n```\nВстроенная сортировка Python использует алгоритм Timsort — O(n log n) в худшем случае.',
     NULL, 35, 3),

    ('b3000000-0000-0000-0000-000000000004',
     'a0000000-0000-0000-0000-000000000003',
     'b3000000-0000-0000-0000-000000000001', 'TEST',
     'Тест: Сложность и сортировки',
     NULL,
     '{"questions":[{"type":"SINGLE","title":"Какова сложность бинарного поиска?","options":["O(1)","O(log n)","O(n)","O(n²)"],"answer":"O(log n)"},{"type":"SINGLE","title":"Сортировка пузырьком имеет сложность?","options":["O(n)","O(n log n)","O(n²)","O(log n)"],"answer":"O(n²)"},{"type":"SINGLE","title":"Какую среднюю сложность имеет быстрая сортировка?","options":["O(n²)","O(n)","O(n log n)","O(log n)"],"answer":"O(n log n)"}]}',
     15, 4),

    ('b3000000-0000-0000-0000-000000000005',
     'a0000000-0000-0000-0000-000000000003', NULL, 'FOLDER',
     'Структуры данных', NULL, NULL, 0, 5),

    ('b3000000-0000-0000-0000-000000000006',
     'a0000000-0000-0000-0000-000000000003',
     'b3000000-0000-0000-0000-000000000005', 'LONGREAD',
     'Стек и очередь',
     E'## Линейные структуры данных\n\n### Стек (Stack) — LIFO\n\nПоследний пришёл — первый ушёл (Last In, First Out).\n\n```python\nstack = []\nstack.append(1)  # push\nstack.append(2)\nstack.append(3)\n\nprint(stack.pop())  # 3 — снимаем с верхушки\nprint(stack.pop())  # 2\n```\n\n**Применение**: история браузера, отмена действий Ctrl+Z, стек вызовов.\n\n### Очередь (Queue) — FIFO\n\nПервый пришёл — первый ушёл (First In, First Out).\n\n```python\nfrom collections import deque\n\nqueue = deque()\nqueue.append("первый")   # enqueue\nqueue.append("второй")\nqueue.append("третий")\n\nprint(queue.popleft())  # первый — убираем из начала\nprint(queue.popleft())  # второй\n```\n\n**Применение**: очередь задач, BFS-обход графа, буферизация данных.\n\n### Двусвязный список\nПозволяет O(1) вставку и удаление в любом месте, но O(n) доступ по индексу. Python `deque` реализован на его основе.',
     NULL, 25, 6),

    ('b3000000-0000-0000-0000-000000000007',
     'a0000000-0000-0000-0000-000000000003',
     'b3000000-0000-0000-0000-000000000005', 'LONGREAD',
     'Деревья и графы',
     E'## Нелинейные структуры данных\n\n### Дерево (Tree)\n\nИерархическая структура: каждый узел может иметь потомков.\n\n```python\nclass TreeNode:\n    def __init__(self, val):\n        self.val = val\n        self.left = None\n        self.right = None\n\n# Двоичное дерево поиска (BST)\nroot = TreeNode(8)\nroot.left = TreeNode(3)\nroot.right = TreeNode(10)\nroot.left.left = TreeNode(1)\n```\n\n**BST-свойство**: левый потомок < родитель < правый потомок.\nПоиск, вставка и удаление — O(log n) в среднем.\n\n### Обходы дерева\n```python\ndef inorder(node):\n    if node:\n        inorder(node.left)\n        print(node.val)   # левый -> текущий -> правый\n        inorder(node.right)\n```\n\n### Граф (Graph)\n\nМножество вершин и рёбер.\n\n```python\n# Граф как словарь смежности\ngraph = {\n    "A": ["B", "C"],\n    "B": ["A", "D"],\n    "C": ["A"],\n    "D": ["B"]\n}\n\ndef bfs(graph, start):\n    visited = set()\n    queue = deque([start])\n    while queue:\n        node = queue.popleft()\n        if node not in visited:\n            visited.add(node)\n            queue.extend(graph[node])\n```',
     NULL, 30, 7)

ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, content = EXCLUDED.content, position = EXCLUDED.position;


-- ═══════════════════════════════════════════════════════════════════════════════
-- SEED: LESSONS — Курс 4: UX/UI дизайн с нуля
-- ═══════════════════════════════════════════════════════════════════════════════
INSERT INTO learning.lessons
    (id, course_id, parent_id, item_type, title, content, test_schema, estimated_minutes, position)
VALUES
    ('b4000000-0000-0000-0000-000000000001',
     'a0000000-0000-0000-0000-000000000004', NULL, 'FOLDER',
     'Основы UX-дизайна', NULL, NULL, 0, 1),

    ('b4000000-0000-0000-0000-000000000002',
     'a0000000-0000-0000-0000-000000000004',
     'b4000000-0000-0000-0000-000000000001', 'LONGREAD',
     'Принципы UX-дизайна',
     E'## Что такое UX-дизайн?\n\nUX (User Experience) — это совокупность ощущений и впечатлений пользователя при взаимодействии с продуктом. UX-дизайнер создаёт удобные, понятные и приятные интерфейсы.\n\n### 10 принципов Якоба Нильсена\n\n1. **Видимость системного статуса** — система всегда должна информировать пользователя о происходящем (индикаторы загрузки, уведомления).\n2. **Соответствие реальному миру** — язык интерфейса должен быть понятен пользователю, не техническим специалистам.\n3. **Контроль пользователя** — должны быть кнопки «Отмена» и «Вернуться назад».\n4. **Стандарты и единообразие** — одинаковые элементы должны вести себя одинаково.\n5. **Предотвращение ошибок** — лучше не допустить ошибку, чем исправлять её.\n\n### Пирамида Маслоу для UX\n\nОт базового к высшему:\n- Функциональность (работает?)\n- Надёжность (работает всегда?)\n- Удобство использования (легко?)\n- Приятность (нравится?)',
     NULL, 25, 2),

    ('b4000000-0000-0000-0000-000000000003',
     'a0000000-0000-0000-0000-000000000004',
     'b4000000-0000-0000-0000-000000000001', 'LONGREAD',
     'Цвет и типографика',
     E'## Цвет в дизайне\n\n### Цветовая теория\n\nЦветовой круг Иттена помогает подбирать гармоничные сочетания:\n- **Монохромная схема**: оттенки одного цвета\n- **Комплементарная**: противоположные цвета (синий + оранжевый)\n- **Аналогичная**: соседние цвета (синий + фиолетовый + голубой)\n\n### Психология цвета\n| Цвет | Ассоциации |\n|------|------------|\n| Красный | Энергия, срочность, опасность |\n| Синий | Доверие, надёжность, профессионализм |\n| Зелёный | Успех, природа, здоровье |\n| Оранжевый | Дружелюбие, энтузиазм, призыв к действию |\n\n### Контрастность\nWCAG требует минимальный контраст 4.5:1 для обычного текста и 3:1 для крупного. Используйте contrast checker для проверки.\n\n## Типографика\n\n### Иерархия заголовков\nОграничьтесь 2-3 шрифтами. Устанавливайте явную иерархию размерами:\n- H1: 32-48px\n- H2: 24-32px\n- Основной текст: 14-18px\n- Мелкий текст: 12-13px\n\n### Межстрочный интервал\nДля читаемого текста: 1.4-1.6 от размера шрифта.',
     NULL, 20, 3),

    ('b4000000-0000-0000-0000-000000000004',
     'a0000000-0000-0000-0000-000000000004',
     'b4000000-0000-0000-0000-000000000001', 'TEST',
     'Тест: Основы UX/UI',
     NULL,
     '{"questions":[{"type":"SINGLE","title":"Что означает аббревиатура UX?","options":["User Experience","User Extension","Unique Experience","Universal XML"],"answer":"User Experience"},{"type":"SINGLE","title":"Какой минимальный контраст требует WCAG для обычного текста?","options":["2:1","3:1","4.5:1","7:1"],"answer":"4.5:1"},{"type":"SINGLE","title":"Синий цвет в дизайне чаще всего ассоциируется с?","options":["Энергией и срочностью","Доверием и надёжностью","Природой и здоровьем","Дружелюбием"],"answer":"Доверием и надёжностью"}]}',
     10, 4)

ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, content = EXCLUDED.content, position = EXCLUDED.position;


-- ═══════════════════════════════════════════════════════════════════════════════
-- SEED: LESSONS — Курс 5: Продуктовый менеджмент
-- ═══════════════════════════════════════════════════════════════════════════════
INSERT INTO learning.lessons
    (id, course_id, parent_id, item_type, title, content, test_schema, estimated_minutes, position)
VALUES
    ('b5000000-0000-0000-0000-000000000001',
     'a0000000-0000-0000-0000-000000000005', NULL, 'FOLDER',
     'Продуктовое мышление', NULL, NULL, 0, 1),

    ('b5000000-0000-0000-0000-000000000002',
     'a0000000-0000-0000-0000-000000000005',
     'b5000000-0000-0000-0000-000000000001', 'LONGREAD',
     'Роль продакт-менеджера',
     E'## Кто такой Product Manager?\n\nПродакт-менеджер (PM) — это человек, который отвечает за успех продукта. Он стоит на пересечении бизнеса, технологий и пользователей.\n\n### Чем занимается PM?\n- **Discovery**: понимает проблемы пользователей, исследует рынок\n- **Стратегия**: формирует видение продукта и приоритеты\n- **Роудмап**: планирует, что и когда будет разработано\n- **Delivery**: координирует разработку с командой\n- **Метрики**: отслеживает KPI и принимает решения на основе данных\n\n### PM vs Project Manager\n| | Product Manager | Project Manager |\n|--|--|--|\n| Фокус | Что и зачем строить | Как и когда построить |\n| Успех | Продуктовые метрики | Сроки и бюджет |\n| Горизонт | Стратегический | Тактический |\n\n### Ключевые навыки\n- Аналитическое мышление\n- Коммуникация и переговоры\n- Приоритизация (RICE, MoSCoW)\n- Понимание данных (SQL, аналитика)\n- Эмпатия к пользователям',
     NULL, 25, 2),

    ('b5000000-0000-0000-0000-000000000003',
     'a0000000-0000-0000-0000-000000000005',
     'b5000000-0000-0000-0000-000000000001', 'LONGREAD',
     'Customer Development',
     E'## Customer Development — методология\n\nCustDev помогает проверить гипотезы о проблемах и потребностях пользователей до того, как вы начнёте разрабатывать продукт.\n\n### 4 этапа CustDev\n\n1. **Customer Discovery** — находим и изучаем сегмент пользователей\n2. **Customer Validation** — проверяем, готовы ли платить\n3. **Customer Creation** — масштабируем продажи\n4. **Company Building** — переходим к полноценной операционной деятельности\n\n### Правила CustDev-интервью\n\n- Говорите о прошлом, не о будущем ("расскажите как вы делали X" vs "вы бы стали делать X?")\n- Не питчите свой продукт во время интервью\n- Слушайте 80%, говорите 20%\n- Ищите боль, частоту и готовность платить\n\n### Шаблон интервью\n```\n1. Расскажите о себе и своей работе\n2. Как вы сейчас решаете [проблема]?\n3. Что самое неудобное в этом процессе?\n4. Как часто это происходит?\n5. Что было бы идеальным решением?\n```\n\n### Jobs to be Done (JTBD)\nПользователи "нанимают" продукт для выполнения работы. Пример: люди покупают дрель не ради дрели — им нужна дырка в стене.',
     NULL, 30, 3)

ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, content = EXCLUDED.content, position = EXCLUDED.position;


-- ═══════════════════════════════════════════════════════════════════════════════
-- SEED: LESSONS — Курс 6: Информационная безопасность
-- ═══════════════════════════════════════════════════════════════════════════════
INSERT INTO learning.lessons
    (id, course_id, parent_id, item_type, title, content, test_schema, estimated_minutes, position)
VALUES
    ('b6000000-0000-0000-0000-000000000001',
     'a0000000-0000-0000-0000-000000000006', NULL, 'FOLDER',
     'Основы информационной безопасности', NULL, NULL, 0, 1),

    ('b6000000-0000-0000-0000-000000000002',
     'a0000000-0000-0000-0000-000000000006',
     'b6000000-0000-0000-0000-000000000001', 'LONGREAD',
     'Основные угрозы и атаки',
     E'## Угрозы информационной безопасности\n\n### Фишинг\nМошеннические письма, сайты или сообщения, которые маскируются под легитимные источники для кражи данных.\n\n**Признаки фишинга:**\n- Срочность ("Ваш аккаунт заблокирован!")\n- Подозрительный домен (corp0rate.com вместо corporate.com)\n- Просьба ввести пароль или данные карты\n- Грамматические ошибки\n\n### Социальная инженерия\nМанипуляция людьми с целью получения доступа к системам или данным.\n\n**Виды атак:**\n- Pretexting (злоумышленник притворяется IT-поддержкой)\n- Baiting (подброшенная флешка с вредоносным ПО)\n- Tailgating (проникновение в офис следом за сотрудником)\n\n### Вредоносное ПО\n| Тип | Описание |\n|-----|----------|\n| Вирус | Заражает файлы и распространяется |\n| Троян | Маскируется под легальное ПО |\n| Ransomware | Шифрует данные и требует выкуп |\n| Spyware | Следит за действиями пользователя |\n\n### Правило: если что-то кажется подозрительным — это подозрительно.\nПозвоните коллеге или в IT, прежде чем открывать вложения.',
     NULL, 20, 2),

    ('b6000000-0000-0000-0000-000000000003',
     'a0000000-0000-0000-0000-000000000006',
     'b6000000-0000-0000-0000-000000000001', 'LONGREAD',
     'Безопасная работа с паролями',
     E'## Пароли и аутентификация\n\n### Требования к надёжному паролю\n- Минимум 12 символов\n- Строчные и прописные буквы\n- Цифры и спецсимволы\n- Не содержит личную информацию (имя, дату рождения)\n\n### Что нельзя делать с паролями\n- Использовать один пароль для нескольких сервисов\n- Записывать на бумагу и оставлять у монитора\n- Передавать по почте или мессенджеру\n- Использовать: 123456, password, qwerty\n\n### Менеджеры паролей\nИспользуйте менеджер паролей (1Password, Bitwarden, KeePass) — он генерирует и хранит уникальные пароли для каждого сервиса.\n\n### Двухфакторная аутентификация (2FA)\nВсегда включайте 2FA там, где это возможно:\n- SMS-код (слабый вариант)\n- TOTP-приложение (Google Authenticator, Authy) — надёжно\n- Аппаратный ключ (YubiKey) — максимальная защита\n\n### Политика компании\nПароли к корпоративным системам меняются каждые 90 дней. Используйте только утверждённые менеджеры паролей. При подозрении на компрометацию — немедленно сообщите в ИТ-безопасность.',
     NULL, 20, 3),

    ('b6000000-0000-0000-0000-000000000004',
     'a0000000-0000-0000-0000-000000000006',
     'b6000000-0000-0000-0000-000000000001', 'TEST',
     'Тест: Информационная безопасность',
     NULL,
     '{"questions":[{"type":"SINGLE","title":"Как называется атака, при которой злоумышленник притворяется IT-специалистом?","options":["Фишинг","Pretexting","Tailgating","Baiting"],"answer":"Pretexting"},{"type":"SINGLE","title":"Какой тип 2FA считается наиболее надёжным?","options":["SMS-код","TOTP-приложение","Email-код","Аппаратный ключ (YubiKey)"],"answer":"Аппаратный ключ (YubiKey)"},{"type":"SINGLE","title":"Что нужно сделать при подозрении на компрометацию пароля?","options":["Подождать и посмотреть","Немедленно сообщить в ИТ-безопасность","Поменять пароль самостоятельно и никому не говорить","Удалить аккаунт"],"answer":"Немедленно сообщить в ИТ-безопасность"}]}',
     10, 4)

ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, content = EXCLUDED.content, position = EXCLUDED.position;


-- ═══════════════════════════════════════════════════════════════════════════════
-- SEED: INTENSIVES (2 интенсива)
-- ═══════════════════════════════════════════════════════════════════════════════
INSERT INTO learning.intensives
    (id, title, description, organizer_type, organization_id, status,
     starts_at, ends_at, participant_limit, registration_deadline)
VALUES
    ('c0000000-0000-0000-0000-000000000001',
     'Хакатон: ML и анализ данных',
     'Трёхэтапный образовательный хакатон по машинному обучению. Участники получат реальный датасет, построят и обучат модель, а затем защитят результаты перед жюри. Победители получают сертификаты и упоминание в кейс-листе РедАкадемии.',
     'MAIN_COMPANY', '00000000-0000-0000-0000-000000000001',
     'REGISTRATION_OPEN',
     '2026-07-01 09:00:00+00', '2026-08-31 18:00:00+00',
     30, '2026-06-20 23:59:00+00'),

    ('c0000000-0000-0000-0000-000000000002',
     'Веб-интенсив: от идеи до продукта',
     'Интенсив для начинающих и средних разработчиков. За три этапа вы спроектируете, разработаете и публично представите полноценное веб-приложение. Наставники дают обратную связь после каждого этапа.',
     'PARTNER', '00000000-0000-0000-0000-000000000003',
     'OPEN',
     '2026-08-15 09:00:00+00', '2026-10-31 18:00:00+00',
     25, '2026-07-31 23:59:00+00')

ON CONFLICT (id) DO UPDATE SET
    title       = EXCLUDED.title,
    description = EXCLUDED.description,
    status      = EXCLUDED.status,
    updated_at  = now();


-- ═══════════════════════════════════════════════════════════════════════════════
-- SEED: INTENSIVE STAGES
-- ═══════════════════════════════════════════════════════════════════════════════
INSERT INTO learning.intensive_stages
    (id, intensive_id, title, description, task_title, task_description, answer_type, position, starts_at, ends_at)
VALUES
    -- Хакатон ML: этап 1
    ('d0000000-0000-0000-0000-000000000001',
     'c0000000-0000-0000-0000-000000000001',
     'Анализ данных и постановка задачи',
     'На первом этапе участники получают датасет и должны провести первичный анализ: изучить распределения признаков, найти пропуски, выбросы и сформулировать гипотезы. Результат — Jupyter Notebook с EDA и описание предполагаемого подхода к решению.',
     'EDA и гипотезы', 'Загрузите ссылку на GitHub-репозиторий с Jupyter Notebook, содержащим разведочный анализ датасета (минимум 10 визуализаций) и описание выбранной модели.',
     'GITHUB_REPOSITORY', 1,
     '2026-07-01 09:00:00+00', '2026-07-14 23:59:00+00'),

    -- Хакатон ML: этап 2
    ('d0000000-0000-0000-0000-000000000002',
     'c0000000-0000-0000-0000-000000000001',
     'Обучение и оценка модели',
     'Второй этап — разработка и обучение модели машинного обучения. Участники должны реализовать пайплайн обработки данных, обучить модель и оценить её на тестовой выборке. Метрика оценки: F1-score для классификации или RMSE для регрессии.',
     'Обученная модель ML', 'Загрузите ссылку на репозиторий с полным кодом: предобработка данных, обучение модели, оценка метрик на тестовой выборке. Укажите достигнутое значение целевой метрики.',
     'GITHUB_REPOSITORY', 2,
     '2026-07-15 09:00:00+00', '2026-07-31 23:59:00+00'),

    -- Хакатон ML: этап 3
    ('d0000000-0000-0000-0000-000000000003',
     'c0000000-0000-0000-0000-000000000001',
     'Финальная презентация и защита',
     'Завершающий этап — подготовка и защита результатов перед жюри. Необходима презентация на 10 минут с демо модели. Жюри оценивает качество модели, чистоту кода, визуализацию результатов и убедительность доклада.',
     'Презентация результатов', 'Загрузите PDF-презентацию (10-15 слайдов): постановка задачи, подход, результаты и выводы. Также приложите итоговую ссылку на репозиторий.',
     'FILE_UPLOAD', 3,
     '2026-08-01 09:00:00+00', '2026-08-31 18:00:00+00'),

    -- Веб-интенсив: этап 1
    ('d0000000-0000-0000-0000-000000000004',
     'c0000000-0000-0000-0000-000000000002',
     'Архитектура и прототип',
     'Первый этап посвящён проектированию. Участники формулируют идею приложения, описывают целевую аудиторию, проектируют схему базы данных и создают интерактивный прототип в Figma. Наставник проводит ревью прототипа и даёт рекомендации.',
     'Прототип в Figma', 'Загрузите ссылку на публичный Figma-файл с прототипом приложения (минимум 5 экранов) и README с описанием идеи, аудитории и стека технологий.',
     'GITHUB_REPOSITORY', 1,
     '2026-08-15 09:00:00+00', '2026-09-05 23:59:00+00'),

    -- Веб-интенсив: этап 2
    ('d0000000-0000-0000-0000-000000000005',
     'c0000000-0000-0000-0000-000000000002',
     'MVP разработка',
     'Второй этап — разработка минимально жизнеспособного продукта. Приложение должно иметь работающий бэкенд с API, фронтенд и базу данных. Наставник проводит code review и помогает с деплоем.',
     'Рабочее MVP', 'Загрузите ссылку на GitHub-репозиторий с кодом MVP. В README укажите инструкцию по запуску и ссылку на задеплоенное приложение (если есть).',
     'GITHUB_REPOSITORY', 2,
     '2026-09-06 09:00:00+00', '2026-10-10 23:59:00+00'),

    -- Веб-интенсив: этап 3
    ('d0000000-0000-0000-0000-000000000006',
     'c0000000-0000-0000-0000-000000000002',
     'Публичная защита проекта',
     'Финальный этап — демо-день. Каждый участник представляет свой проект в формате 7-минутного питча с демонстрацией. Победителей определяет голосование жюри и аудитории. Все участники получают сертификат.',
     'Финальная презентация', 'Загрузите PDF-презентацию вашего проекта и обновлённую ссылку на репозиторий. Укажите что было реализовано, какие технологии использовали и чему научились.',
     'FILE_UPLOAD', 3,
     '2026-10-11 09:00:00+00', '2026-10-31 18:00:00+00')

ON CONFLICT (id) DO UPDATE SET
    title            = EXCLUDED.title,
    description      = EXCLUDED.description,
    task_description = EXCLUDED.task_description;


-- ═══════════════════════════════════════════════════════════════════════════════
-- SEED: ENROLLMENTS — Студент записан на 2 курса
-- ═══════════════════════════════════════════════════════════════════════════════
INSERT INTO learning.enrollments (id, user_id, course_id, progress, status)
VALUES
    ('e0000000-0000-0000-0000-000000000001',
     '30000000-0000-0000-0000-000000000002',
     'a0000000-0000-0000-0000-000000000001',
     50, 'ACTIVE'),

    ('e0000000-0000-0000-0000-000000000002',
     '30000000-0000-0000-0000-000000000002',
     'a0000000-0000-0000-0000-000000000002',
     12, 'ACTIVE')

ON CONFLICT (user_id, course_id) DO UPDATE SET
    progress   = EXCLUDED.progress,
    status     = EXCLUDED.status,
    updated_at = now();


-- ═══════════════════════════════════════════════════════════════════════════════
-- SEED: LESSON PROGRESS — Студент прошёл 4 урока из курса 1
-- ═══════════════════════════════════════════════════════════════════════════════
INSERT INTO learning.lesson_progress
    (id, user_id, course_id, lesson_id, status, score, completed_at)
VALUES
    -- "Введение в Python" прочитан
    ('f0000000-0000-0000-0000-000000000001',
     '30000000-0000-0000-0000-000000000002',
     'a0000000-0000-0000-0000-000000000001',
     'b1000000-0000-0000-0000-000000000002',
     'COMPLETED', 100, now() - interval '5 days'),

    -- "Переменные и типы данных" прочитан
    ('f0000000-0000-0000-0000-000000000002',
     '30000000-0000-0000-0000-000000000002',
     'a0000000-0000-0000-0000-000000000001',
     'b1000000-0000-0000-0000-000000000003',
     'COMPLETED', 100, now() - interval '4 days'),

    -- Тест "Основы Python" пройден на 85%
    ('f0000000-0000-0000-0000-000000000003',
     '30000000-0000-0000-0000-000000000002',
     'a0000000-0000-0000-0000-000000000001',
     'b1000000-0000-0000-0000-000000000004',
     'COMPLETED', 67, now() - interval '3 days'),

    -- "Условия if/elif/else" прочитан
    ('f0000000-0000-0000-0000-000000000004',
     '30000000-0000-0000-0000-000000000002',
     'a0000000-0000-0000-0000-000000000001',
     'b1000000-0000-0000-0000-000000000006',
     'COMPLETED', 100, now() - interval '2 days'),

    -- "Что такое React" прочитан (из курса 2)
    ('f0000000-0000-0000-0000-000000000005',
     '30000000-0000-0000-0000-000000000002',
     'a0000000-0000-0000-0000-000000000002',
     'b2000000-0000-0000-0000-000000000002',
     'COMPLETED', 100, now() - interval '1 day')

ON CONFLICT (user_id, lesson_id) DO UPDATE SET
    status       = EXCLUDED.status,
    score        = EXCLUDED.score,
    completed_at = EXCLUDED.completed_at;


-- ═══════════════════════════════════════════════════════════════════════════════
-- SEED: INTENSIVE APPLICATION — Студент подал заявку на хакатон ML
-- ═══════════════════════════════════════════════════════════════════════════════
INSERT INTO learning.intensive_applications
    (id, intensive_id, user_id, organization_id, github_url, status)
VALUES
    ('aa000000-0000-0000-0000-000000000001',
     'c0000000-0000-0000-0000-000000000001',
     '30000000-0000-0000-0000-000000000002',
     NULL,
     'https://github.com/maria-student/ml-hackathon',
     'APPROVED')

ON CONFLICT (id) DO NOTHING;


-- ═══════════════════════════════════════════════════════════════════════════════
-- SEED: INTENSIVE PARTICIPANTS — Студент участвует в хакатоне
-- ═══════════════════════════════════════════════════════════════════════════════
INSERT INTO learning.intensive_participants
    (id, intensive_id, user_id, organization_id, github_url, score, status)
VALUES
    ('ab000000-0000-0000-0000-000000000001',
     'c0000000-0000-0000-0000-000000000001',
     '30000000-0000-0000-0000-000000000002',
     NULL,
     'https://github.com/maria-student/ml-hackathon',
     42, 'ACTIVE')

ON CONFLICT (intensive_id, user_id) DO UPDATE SET
    score  = EXCLUDED.score,
    status = EXCLUDED.status;


-- ═══════════════════════════════════════════════════════════════════════════════
-- SEED: INTENSIVE MANAGERS — Ментор управляет хакатоном ML
-- ═══════════════════════════════════════════════════════════════════════════════
INSERT INTO learning.intensive_managers
    (id, intensive_id, user_id, organization_id, role, status)
VALUES
    ('ac000000-0000-0000-0000-000000000001',
     'c0000000-0000-0000-0000-000000000001',
     '30000000-0000-0000-0000-000000000003',
     '00000000-0000-0000-0000-000000000001',
     'INTENSIVE_MANAGER', 'ACTIVE')

ON CONFLICT (intensive_id, user_id) DO NOTHING;


-- ═══════════════════════════════════════════════════════════════════════════════
-- SEED: TASKS — Практические задания к курсам
-- ═══════════════════════════════════════════════════════════════════════════════
INSERT INTO learning.tasks
    (id, course_id, intensive_id, intensive_stage_id, title, description, deadline_at, max_score)
VALUES
    ('ba000000-0000-0000-0000-000000000001',
     'a0000000-0000-0000-0000-000000000001', NULL, NULL,
     'Калькулятор на Python',
     'Напишите консольный калькулятор на Python, который выполняет четыре арифметических операции. Программа должна обрабатывать деление на ноль и некорректный ввод.',
     now() + interval '14 days', 100),

    ('ba000000-0000-0000-0000-000000000002',
     'a0000000-0000-0000-0000-000000000002', NULL, NULL,
     'To-Do приложение на React',
     'Создайте полноценное To-Do приложение на React: добавление, удаление и отметка задач выполненными. Используйте useState и хранение данных в localStorage.',
     now() + interval '21 days', 100)

ON CONFLICT (id) DO UPDATE SET
    title       = EXCLUDED.title,
    description = EXCLUDED.description;


-- ═══════════════════════════════════════════════════════════════════════════════
-- SEED: CERTIFICATES — Студент получил сертификат (условный — для демо)
-- ═══════════════════════════════════════════════════════════════════════════════
INSERT INTO learning.certificates
    (id, user_id, course_id, intensive_id, title, issued_at)
VALUES
    ('bc000000-0000-0000-0000-000000000001',
     '30000000-0000-0000-0000-000000000002',
     NULL,
     'c0000000-0000-0000-0000-000000000001',
     'Участник хакатона: ML и анализ данных',
     now() - interval '10 days')

ON CONFLICT (id) DO NOTHING;


-- ═══════════════════════════════════════════════════════════════════════════════
-- SEED: NOTIFICATIONS
-- ═══════════════════════════════════════════════════════════════════════════════
INSERT INTO communication.notifications
    (id, user_id, organization_id, title, message, type, read_at)
VALUES
    -- Студент: приветствие
    ('bb000000-0000-0000-0000-000000000001',
     '30000000-0000-0000-0000-000000000002', NULL,
     'Добро пожаловать на платформу!',
     'Привет, Мария! Вы успешно зарегистрировались на РедАкадемии. Начните с бесплатных курсов в каталоге или подайте заявку на ближайший интенсив.',
     'INFO', now() - interval '7 days'),

    -- Студент: заявка одобрена
    ('bb000000-0000-0000-0000-000000000002',
     '30000000-0000-0000-0000-000000000002', NULL,
     'Заявка на интенсив одобрена',
     'Ваша заявка на участие в хакатоне "ML и анализ данных" одобрена. Интенсив начнётся 1 июля 2026 года. Подготовьте рабочее окружение Python с библиотеками pandas, scikit-learn и matplotlib.',
     'SUCCESS', now() - interval '3 days'),

    -- Студент: напоминание о прогрессе
    ('bb000000-0000-0000-0000-000000000003',
     '30000000-0000-0000-0000-000000000002', NULL,
     'Не останавливайтесь!',
     'Вы прошли 50% курса "Python для начинающих". Осталось ещё 3 урока — продолжайте в том же темпе! После завершения курса вы сможете выполнить практическое задание.',
     'INFO', NULL),

    -- Ментор: новый участник
    ('bb000000-0000-0000-0000-000000000004',
     '30000000-0000-0000-0000-000000000003', NULL,
     'Новый участник в вашем интенсиве',
     'Студентка Мария Студентова была зачислена в интенсив "Хакатон: ML и анализ данных". Просмотрите профиль участника в разделе Наставник.',
     'INFO', now() - interval '3 days'),

    -- Менеджер: организационное уведомление
    ('bb000000-0000-0000-0000-000000000005',
     '30000000-0000-0000-0000-000000000004', NULL,
     'Корпоративный курс опубликован',
     'Курс "Информационная безопасность для сотрудников" успешно опубликован. Теперь все сотрудники ТехКорп могут его пройти. Вы можете отслеживать прогресс в корпоративном кабинете.',
     'SUCCESS', now() - interval '5 days'),

    -- Broadcast: новый интенсив
    ('bb000000-0000-0000-0000-000000000006',
     NULL, NULL,
     'Открыта регистрация на хакатон',
     'Стартует набор на хакатон "ML и анализ данных". Регистрация открыта до 20 июня 2026 года. Количество мест ограничено — 30 участников. Подайте заявку уже сегодня!',
     'ANNOUNCEMENT', NULL)

ON CONFLICT (id) DO NOTHING;


-- ═══════════════════════════════════════════════════════════════════════════════
-- SEED: AUDIT LOG — несколько записей для демо
-- ═══════════════════════════════════════════════════════════════════════════════
INSERT INTO communication.audit_log
    (id, actor_user_id, action, entity_type, entity_id, details)
VALUES
    ('ca000000-0000-0000-0000-000000000001',
     '30000000-0000-0000-0000-000000000001',
     'COURSE_PUBLISHED', 'Course',
     'a0000000-0000-0000-0000-000000000001',
     'Опубликован курс "Python для начинающих"'),

    ('ca000000-0000-0000-0000-000000000002',
     '30000000-0000-0000-0000-000000000001',
     'INTENSIVE_CREATED', 'Intensive',
     'c0000000-0000-0000-0000-000000000001',
     'Создан интенсив "Хакатон: ML и анализ данных"'),

    ('ca000000-0000-0000-0000-000000000003',
     '30000000-0000-0000-0000-000000000001',
     'APPLICATION_APPROVED', 'IntensiveApplication',
     'aa000000-0000-0000-0000-000000000001',
     'Одобрена заявка студентки Марии Студентовой на хакатон ML'),

    ('ca000000-0000-0000-0000-000000000004',
     '30000000-0000-0000-0000-000000000001',
     'PARTNER_REQUEST_APPROVED', 'PartnerRequest',
     '50000000-0000-0000-0000-000000000002',
     'Одобрена партнёрская заявка организации "Партнёр Медиа"')

ON CONFLICT (id) DO NOTHING;

