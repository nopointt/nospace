use reqwest::Client;
use serde::Deserialize;
use chrono::DateTime;
use crate::domain::signal::{RawSignal, SourceType};
use super::OsintSource;
use anyhow::Result;
use tokio::time::{sleep, Duration};

#[derive(Deserialize)]
struct GogReviewsResponse {
    items: Vec<GogReviewItem>,
    #[serde(default)]
    pages: u32,
}

#[derive(Deserialize)]
struct GogReviewItem {
    id: String,
    title: Option<String>,
    description: String,
    rating: Option<u32>,
    date: String,
    author: GogAuthor,
}

#[derive(Deserialize)]
struct GogAuthor {
    username: String,
}

pub struct GogSource {
    pub product_id: u32,
    client: Client,
}

impl GogSource {
    pub fn new(product_id: u32) -> Self {
        GogSource {
            product_id,
            client: Client::new(),
        }
    }
}

#[async_trait::async_trait]
impl OsintSource for GogSource {
    fn name(&self) -> &str {
        "gog"
    }

    async fn fetch(&self, limit: usize) -> Result<Vec<RawSignal>> {
        let mut signals = Vec::new();
        let mut page = 1u32;

        loop {
            let url = format!(
                "https://reviews.gog.com/v1/products/{}/reviews?order=date:desc&limit=100&page={}",
                self.product_id, page
            );

            let resp = self.client
                .get(&url)
                .send()
                .await?
                .json::<GogReviewsResponse>()
                .await?;

            if resp.items.is_empty() {
                break;
            }

            for item in resp.items {
                if signals.len() >= limit {
                    break;
                }
                let content = match &item.title {
                    Some(t) if !t.is_empty() => format!("{}\n\n{}", t, item.description),
                    _ => item.description.clone(),
                };
                let collected_at = DateTime::parse_from_rfc3339(&item.date)
                    .map(|dt| dt.with_timezone(&chrono::Utc))
                    .unwrap_or_else(|_| chrono::Utc::now());
                signals.push(RawSignal {
                    source_type: SourceType::GogReview,
                    source_url: Some(format!(
                        "https://www.gog.com/game/{}", self.product_id
                    )),
                    content,
                    author: Some(item.author.username),
                    metadata: serde_json::json!({
                        "id": item.id,
                        "rating": item.rating
                    }),
                    collected_at,
                });
            }

            if signals.len() >= limit || page >= resp.pages.max(1) {
                break;
            }
            page += 1;
            sleep(Duration::from_millis(500)).await;
        }

        Ok(signals)
    }
}
