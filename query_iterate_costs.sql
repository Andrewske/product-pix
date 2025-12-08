-- Query to get total costs for an iterate session
-- Replace 'your-session-id' with the actual session ID

SELECT 
  pt.batch_label,
  COUNT(*) as tests,
  SUM(COALESCE(pt.cost_usd, 0)) as generation_cost,
  SUM(COALESCE(pe.cost_usd, 0)) as evaluation_cost,
  SUM(COALESCE(pt.cost_usd, 0) + COALESCE(pe.cost_usd, 0)) as total_cost
FROM prompt_tests pt
LEFT JOIN prompt_evaluations pe ON pe.test_id = pt.id
WHERE pt.batch_label LIKE 'iteration-your-session-id-gen-%'
GROUP BY pt.batch_label
ORDER BY pt.batch_label;

-- Total across all generations
SELECT 
  'TOTAL' as batch_label,
  COUNT(*) as tests,
  SUM(COALESCE(pt.cost_usd, 0)) as generation_cost,
  SUM(COALESCE(pe.cost_usd, 0)) as evaluation_cost,
  SUM(COALESCE(pt.cost_usd, 0) + COALESCE(pe.cost_usd, 0)) as total_cost
FROM prompt_tests pt
LEFT JOIN prompt_evaluations pe ON pe.test_id = pt.id
WHERE pt.batch_label LIKE 'iteration-your-session-id-gen-%';
