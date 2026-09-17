-- Demo Full LSAT practice blueprint.
-- Run this after the LSAT content seeds are applied.
--
-- This does not create tables. It builds one active practice test from the
-- original LSAT-style placeholder questions already in the problems table.
-- Internal section names remain SAT-shaped for compatibility:
--   reading_writing = Reading Comprehension
--   math            = Logical Reasoning

SET search_path TO "lsat";

BEGIN;

WITH upserted_test AS (
  INSERT INTO full_sat_tests (test_number, name, status)
  VALUES (1, 'Demo LSAT Practice Test', 'active')
  ON CONFLICT (test_number) DO UPDATE
  SET
    name = EXCLUDED.name,
    status = EXCLUDED.status
  RETURNING id
),
cleared AS (
  DELETE FROM full_sat_test_problems
  WHERE test_id = (SELECT id FROM upserted_test)
  RETURNING id
),
reading_pool AS (
  SELECT
    p.id AS problem_id,
    row_number() OVER (ORDER BY st.order_index, p.order_index, p.id) AS rn,
    count(*) OVER () AS total
  FROM problems p
  JOIN subtopics st ON st.id = p.subtopic_id
  WHERE p.source = 'sat'
    AND p.topic_slug = 'reading-comprehension'
),
inserted_reading AS (
  INSERT INTO full_sat_test_problems (test_id, problem_id, section, module, order_index)
  SELECT
    (SELECT id FROM upserted_test),
    problem_id,
    'reading_writing',
    CASE WHEN rn <= ceiling(total / 2.0)::int THEN 1 ELSE 2 END,
    CASE
      WHEN rn <= ceiling(total / 2.0)::int THEN (rn - 1)::int
      ELSE (rn - ceiling(total / 2.0)::int - 1)::int
    END
  FROM reading_pool
  RETURNING id
),
reasoning_pool AS (
  SELECT
    p.id AS problem_id,
    row_number() OVER (ORDER BY st.order_index, p.order_index, p.id) AS rn,
    count(*) OVER () AS total
  FROM problems p
  JOIN subtopics st ON st.id = p.subtopic_id
  WHERE p.source = 'sat'
    AND p.topic_slug = 'logical-reasoning'
),
inserted_reasoning AS (
  INSERT INTO full_sat_test_problems (test_id, problem_id, section, module, order_index)
  SELECT
    (SELECT id FROM upserted_test),
    problem_id,
    'math',
    CASE WHEN rn <= ceiling(total / 2.0)::int THEN 1 ELSE 2 END,
    CASE
      WHEN rn <= ceiling(total / 2.0)::int THEN (rn - 1)::int
      ELSE (rn - ceiling(total / 2.0)::int - 1)::int
    END
  FROM reasoning_pool
  RETURNING id
)
SELECT
  (SELECT count(*) FROM inserted_reading) AS reading_comprehension_questions,
  (SELECT count(*) FROM inserted_reasoning) AS logical_reasoning_questions,
  (SELECT count(*) FROM inserted_reading) + (SELECT count(*) FROM inserted_reasoning) AS total_questions;

COMMIT;
