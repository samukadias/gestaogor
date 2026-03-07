-- SQL Migration Script to introduce RBAC roles
-- Check before
SELECT role,
    count(id) as total
FROM users
GROUP BY role
ORDER BY total DESC;
-- Show users about to be migrated
SELECT id,
    name,
    email,
    role,
    department
FROM users
WHERE email = 'dayane@gor.com'
    OR role = 'general_manager';
-- Perform Migration
UPDATE users
SET role = 'executive'
WHERE email = 'dayane@gor.com'
    OR role = 'general_manager';
-- Check after
SELECT role,
    count(id) as total
FROM users
GROUP BY role
ORDER BY total DESC;