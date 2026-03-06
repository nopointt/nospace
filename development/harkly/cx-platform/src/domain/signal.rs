use chrono::{DateTime, Utc};
use std::fmt;

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub enum SourceType {
    SteamReview,
    RedditPost,
    GogReview,
    WebScraping,
}

impl fmt::Display for SourceType {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        let s = match self {
            SourceType::SteamReview => "steam_review",
            SourceType::RedditPost => "reddit_post",
            SourceType::GogReview => "gog_review",
            SourceType::WebScraping => "web_scraping",
        };
        write!(f, "{}", s)
    }
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct RawSignal {
    pub source_type: SourceType,
    pub source_url: Option<String>,
    pub content: String,
    pub author: Option<String>,
    pub metadata: serde_json::Value,
    pub collected_at: DateTime<Utc>,
}
