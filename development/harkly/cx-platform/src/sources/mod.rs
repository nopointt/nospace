use crate::domain::signal::RawSignal;
pub mod steam;
pub mod reddit;
pub mod gog;

#[async_trait::async_trait]
pub trait OsintSource: Send + Sync {
    async fn fetch(&self, limit: usize) -> anyhow::Result<Vec<RawSignal>>;
    fn name(&self) -> &str;
}
