use crate::domain::signal::RawSignal;
use crate::etl::sentiment;
use regex::Regex;

pub fn normalize(mut signal: RawSignal) -> RawSignal {
    let html_re = Regex::new(r"<[^>]+>").unwrap();
    let ws_re = Regex::new(r"\s+").unwrap();
    let cleaned = html_re.replace_all(&signal.content, "");
    signal.content = ws_re.replace_all(cleaned.trim(), " ").to_string();
    signal.sentiment = Some(sentiment::score(&signal.content));
    signal
}
