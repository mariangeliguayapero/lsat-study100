# LSAT content seed for QA and staging

Daily Practice, Review, Study Library, and seeded Learn routes require the LSAT
topic and problem bank in Supabase. Apply all repository migrations before
running these files.

## Required order

Run the following SQL files against the intended local, QA, or staging Supabase
project, in this order:

1. `supabase/seed_lsat_core_practice.sql`
2. `supabase/seed_lsat_content_depth.sql`

The core file creates or updates the two LSAT sections, nine seeded subtopics,
and baseline questions. The depth file enriches the same records and leaves a
56-question bank: 32 Logical Reasoning questions and 24 Reading Comprehension
questions. Correct answers are evenly distributed across A/B/C/D, with 14
questions at each position. Each problem includes answer options, the correct option, an
explanation, a hint, a detailed hint, difficulty metadata, concept tags, and a
recommended time.

For a complete new-user QA flow, also run:

3. `supabase/seed_lsat_onboarding_questions.sql`

For Full LSAT demo QA only, run this last:

4. `supabase/seed_demo_full_lsat.sql`

The Full LSAT demo seed replaces the problem mappings for test number `1`, so it
should only be used in an approved local, QA, or staging project.

## Applying the files

The files can be pasted into the Supabase SQL Editor, or applied with `psql`:

```bash
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/seed_lsat_core_practice.sql
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/seed_lsat_content_depth.sql
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/seed_lsat_onboarding_questions.sql
```

Do not point these commands at production unless the data change has been
reviewed and approved. The existing `make db-seed` command does not apply these
LSAT SQL files.

## Rerun behavior

The LSAT content files are designed to be rerun:

- Topics upsert by `slug`.
- Subtopics upsert by `(topic_id, slug)`.
- Practice problems upsert by `(subtopic_id, order_index)` for `source = 'sat'`.
- Onboarding problems use the unique onboarding `order_index` and ignore
  duplicates.
- The Full LSAT demo test upserts test number `1`, clears its mappings, and
  rebuilds them in one transaction.

Always run the core file before the depth file. Running the depth file alone on
an empty database succeeds without creating content because its inserts join to
the core topics and subtopics.

## Read-only verification

After applying the required files, this query should return 5 subtopics and 32
problems for Logical Reasoning, plus 4 subtopics and 24 problems for Reading
Comprehension:

```sql
SELECT
  t.slug,
  COUNT(DISTINCT st.id) AS subtopics,
  COUNT(p.id) FILTER (WHERE p.source = 'sat') AS problems
FROM topics t
LEFT JOIN subtopics st ON st.topic_id = t.id
LEFT JOIN problems p ON p.subtopic_id = st.id
WHERE t.slug IN ('logical-reasoning', 'reading-comprehension')
GROUP BY t.slug
ORDER BY t.slug;
```

## Known QA limitations

- Flaw, Assumption, Strengthen/Weaken, Main Point/Structure, and
  Inference/Detail have eight questions each. The four newly added subtopics
  have four questions each, so their difficulty coverage is intentionally
  shallower.
- Daily Practice can reuse questions once the available bank for a difficulty
  bucket is exhausted.
- Without the seed, Study Library and Review show empty guidance, the dashboard
  reports Daily Practice as unavailable, and direct `/quest` navigation shows a
  no-practice-set state with a link back to the dashboard.
