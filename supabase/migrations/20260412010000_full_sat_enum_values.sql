SET search_path TO "lsat";

ALTER TYPE problem_source ADD VALUE IF NOT EXISTS 'full_sat';
ALTER TYPE session_source ADD VALUE IF NOT EXISTS 'full_sat';
