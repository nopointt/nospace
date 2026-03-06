use crate::domain::signal::RawSignal;
use sha2::{Digest, Sha256};

pub fn compute_hash(content: &str) -> String {
    let mut hasher = Sha256::new();
    hasher.update(content.as_bytes());
    hex::encode(hasher.finalize())
}

pub fn validate(signal: &RawSignal) -> anyhow::Result<()> {
    if signal.content.trim().len() <= 10 {
        return Err(anyhow::anyhow!(
            "Content too short: {} chars",
            signal.content.len()
        ));
    }
    Ok(())
}
