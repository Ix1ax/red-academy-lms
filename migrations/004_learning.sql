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
    has_certificate BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

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
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_lessons_parent FOREIGN KEY (parent_id) REFERENCES learning.lessons(id) ON DELETE CASCADE
);

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
    registration_deadline TIMESTAMPTZ,
    cover_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

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

CREATE TABLE IF NOT EXISTS learning.intensive_applications (
    id UUID PRIMARY KEY,
    intensive_id UUID NOT NULL REFERENCES learning.intensives(id) ON DELETE CASCADE,
    user_id UUID,
    organization_id UUID,
    github_url TEXT,
    status VARCHAR(64) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

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

CREATE TABLE IF NOT EXISTS learning.intensive_managers (
    id UUID PRIMARY KEY,
    intensive_id UUID NOT NULL REFERENCES learning.intensives(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    organization_id UUID,
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

CREATE UNIQUE INDEX IF NOT EXISTS ux_task_submissions_task_user
    ON learning.task_submissions(task_id, user_id);

CREATE TABLE IF NOT EXISTS learning.certificates (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    course_id UUID REFERENCES learning.courses(id) ON DELETE SET NULL,
    intensive_id UUID REFERENCES learning.intensives(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    file_id UUID,
    issued_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
