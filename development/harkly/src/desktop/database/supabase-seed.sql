-- Seed data for testing
-- Run this after schema.sql

-- Create test user (for manual testing)
-- Note: This should be done via Supabase Auth UI or API
-- Then get the user_id and insert profile

-- Insert test project
-- REPLACE 'your-user-uuid' with actual user UUID from Supabase Auth
INSERT INTO projects (id, user_id, name, description, source_type)
VALUES (
    '550e8400-e29b-41d4-a716-446655440000',
    'your-user-uuid-here',
    'Тестовый проект',
    'Проект для тестирования парсинга отзывов',
    'otzovik'
);

-- Insert test scraping job
INSERT INTO scraping_jobs (
    id,
    project_id,
    url,
    status,
    max_pages,
    progress,
    metadata
)
VALUES (
    '660e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440000',
    'https://otzovik.com/reviews/some_product',
    'completed',
    10,
    '{"current": 10, "total": 10, "percentage": 100}',
    '{"source": "test", "test_data": true}'
);

-- Insert sample reviews
INSERT INTO reviews (
    job_id,
    source,
    external_id,
    source_url,
    title,
    text,
    rating,
    author,
    review_date,
    metadata
)
VALUES 
(
    '660e8400-e29b-41d4-a716-446655440001',
    'otzovik',
    'review-1',
    'https://otzovik.com/reviews/1',
    'Отличный товар',
    'Купил месяц назад, очень доволен. Рекомендую всем!',
    5,
    'Иван Петров',
    '2025-01-15',
    '{"verified": true, "helpful": 15}'
),
(
    '660e8400-e29b-41d4-a716-446655440001',
    'otzovik',
    'review-2',
    'https://otzovik.com/reviews/2',
    'Нормально',
    'Неплохой товар, но есть недочеты. Цена соответствует качеству.',
    4,
    'Мария Сидорова',
    '2025-01-10',
    '{"verified": true, "helpful": 8}'
),
(
    '660e8400-e29b-41d4-a716-446655440001',
    'otzovik',
    'review-3',
    'https://otzovik.com/reviews/3',
    'Не оправдал ожиданий',
    'Разочарован покупкой. Качество оставляет желать лучшего.',
    2,
    'Аноним',
    '2025-01-05',
    '{"verified": false, "helpful": 3}'
);

-- Insert sample proxy settings
INSERT INTO proxy_settings (
    id,
    user_id,
    name,
    proxy_type,
    host,
    port,
    is_active
)
VALUES (
    '770e8400-e29b-41d4-a716-446655440002',
    'your-user-uuid-here',
    'Тестовый прокси',
    'http',
    'proxy.example.com',
    8080,
    true
);
