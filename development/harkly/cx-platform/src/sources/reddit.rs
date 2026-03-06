use reqwest::Client;
use serde::Deserialize;
use chrono::DateTime;
use crate::domain::signal::{RawSignal, SourceType};
use super::OsintSource;
use anyhow::Result;
use tokio::time::{sleep, Duration};

#[derive(Deserialize)]
struct RedditListing {
    data: RedditListingData,
}

#[derive(Deserialize)]
struct RedditListingData {
    children: Vec<RedditChild>,
    after: Option<String>,
}

#[derive(Deserialize)]
struct RedditChild {
    data: RedditPost,
}

#[derive(Deserialize)]
struct RedditPost {
    id: String,
    title: String,
    selftext: String,
    author: String,
    created_utc: f64,
    subreddit: String,
    permalink: String,
    url: String,
}

pub struct RedditSource {
    pub query: String,
    client: Client,
}

impl RedditSource {
    pub fn new(query: &str) -> Self {
        let client = Client::builder()
            .user_agent("harkly-cx-platform/0.1 (research tool)")
            .build()
            .unwrap_or_default();
        RedditSource {
            query: query.to_string(),
            client,
        }
    }
}

#[async_trait::async_trait]
impl OsintSource for RedditSource {
    fn name(&self) -> &str {
        "reddit"
    }

    async fn fetch(&self, limit: usize) -> Result<Vec<RawSignal>> {
        let mut signals = Vec::new();
        let mut after: Option<String> = None;

        while signals.len() < limit {
            let mut url = format!(
                "https://www.reddit.com/search.json?q={}&sort=new&limit=100&type=link",
                urlencoding::encode(&self.query)
            );
            if let Some(ref cursor) = after {
                url.push_str(&format!("&after={}", cursor));
            }

            let resp = self.client
                .get(&url)
                .send()
                .await?
                .json::<RedditListing>()
                .await?;

            if resp.data.children.is_empty() {
                break;
            }

            let next_after = resp.data.after.clone();

            for child in resp.data.children {
                if signals.len() >= limit {
                    break;
                }
                let post = child.data;
                let content = if post.selftext.trim().is_empty() {
                    post.title.clone()
                } else {
                    format!("{}\n\n{}", post.title, post.selftext)
                };
                let collected_at = DateTime::from_timestamp(post.created_utc as i64, 0)
                    .unwrap_or_else(chrono::Utc::now);
                signals.push(RawSignal {
                    source_type: SourceType::RedditPost,
                    source_url: Some(format!("https://reddit.com{}", post.permalink)),
                    content,
                    author: Some(post.author),
                    metadata: serde_json::json!({
                        "id": post.id,
                        "subreddit": post.subreddit,
                        "url": post.url
                    }),
                    collected_at,
                    sentiment: None,
                });
            }

            match next_after {
                Some(cursor) => after = Some(cursor),
                None => break,
            }
            sleep(Duration::from_millis(500)).await;
        }

        Ok(signals)
    }
}
