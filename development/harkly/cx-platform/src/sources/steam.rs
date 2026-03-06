use reqwest::Client;
use serde::Deserialize;
use chrono::DateTime;
use crate::domain::signal::{RawSignal, SourceType};
use super::OsintSource;
use anyhow::Result;
use tokio::time::{sleep, Duration};

#[derive(Deserialize)]
struct SteamReviewResponse {
    #[allow(dead_code)]
    success: i32,
    reviews: Vec<SteamReview>,
    cursor: String,
}

#[derive(Deserialize)]
struct SteamReview {
    recommendationid: String,
    author: SteamAuthor,
    review: String,
    timestamp_created: i64,
    voted_up: bool,
}

#[derive(Deserialize)]
struct SteamAuthor {
    steamid: String,
}

pub struct SteamSource {
    pub appid: u32,
    pub base_url: String,
    client: Client,
}

impl SteamSource {
    pub fn new(appid: u32, base_url: &str) -> Self {
        SteamSource {
            appid,
            base_url: base_url.to_string(),
            client: Client::new(),
        }
    }

    async fn fetch_page(&self, cursor: &str) -> Result<SteamReviewResponse> {
        let encoded = urlencoding::encode(cursor);
        let url = format!(
            "{}/appreviews/{}?json=1&num_per_page=100&filter=all&cursor={}",
            self.base_url, self.appid, encoded
        );
        let resp = self.client
            .get(&url)
            .send()
            .await?
            .json::<SteamReviewResponse>()
            .await?;
        Ok(resp)
    }
}

#[async_trait::async_trait]
impl OsintSource for SteamSource {
    fn name(&self) -> &str {
        "steam"
    }

    async fn fetch(&self, limit: usize) -> Result<Vec<RawSignal>> {
        let mut signals = Vec::new();
        let mut cursor = "*".to_string();
        let mut prev_cursor = String::new();

        while signals.len() < limit {
            let resp = self.fetch_page(&cursor).await?;
            if resp.reviews.is_empty() || cursor == prev_cursor {
                break;
            }
            prev_cursor = cursor.clone();
            cursor = resp.cursor.clone();

            for review in resp.reviews {
                if signals.len() >= limit {
                    break;
                }
                let collected_at = DateTime::from_timestamp(review.timestamp_created, 0)
                    .unwrap_or_else(chrono::Utc::now);
                let signal = RawSignal {
                    source_type: SourceType::SteamReview,
                    source_url: Some(format!(
                        "https://store.steampowered.com/app/{}/",
                        self.appid
                    )),
                    content: review.review,
                    author: Some(review.author.steamid),
                    metadata: serde_json::json!({
                        "voted_up": review.voted_up,
                        "recommendationid": review.recommendationid
                    }),
                    collected_at,
                    sentiment: None,
                };
                signals.push(signal);
            }
            sleep(Duration::from_secs(1)).await;
        }
        Ok(signals)
    }
}
