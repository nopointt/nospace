use sqlx::PgPool;
use uuid::Uuid;
use crate::domain::signal::RawSignal;
use crate::etl::validate::compute_hash;

pub async fn batch_insert(
    pool: &PgPool,
    tenant_id: Uuid,
    research_id: Uuid,
    signals: Vec<RawSignal>,
) -> anyhow::Result<(usize, usize)> {
    let mut inserted = 0usize;
    let mut skipped = 0usize;

    for signal in signals {
        let hash = compute_hash(&signal.content);
        let source_type_str = signal.source_type.to_string();
        let metadata_val = signal.metadata.clone();

        let result = sqlx::query(
            r#"INSERT INTO signals
               (id, tenant_id, research_id, source_type, source_url, content,
                content_hash, author, metadata, collected_at, sentiment)
               VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
               ON CONFLICT (tenant_id, content_hash) DO NOTHING"#,
        )
        .bind(tenant_id)
        .bind(research_id)
        .bind(source_type_str)
        .bind(signal.source_url)
        .bind(signal.content)
        .bind(hash)
        .bind(signal.author)
        .bind(metadata_val)
        .bind(signal.collected_at)
        .bind(signal.sentiment)
        .execute(pool)
        .await?;

        if result.rows_affected() > 0 {
            inserted += 1;
        } else {
            skipped += 1;
        }
    }
    Ok((inserted, skipped))
}
