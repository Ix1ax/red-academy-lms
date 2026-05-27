ALTER TABLE learning.courses
    ADD COLUMN IF NOT EXISTS has_certificate BOOLEAN NOT NULL DEFAULT false;
