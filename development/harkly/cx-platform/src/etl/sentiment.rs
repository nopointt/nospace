const POSITIVE: &[&str] = &[
    "love", "great", "excellent", "amazing", "good", "best", "awesome", "fantastic",
    "recommend", "perfect", "brilliant", "outstanding", "superb", "enjoy", "fun",
    "helpful", "wonderful", "smooth", "fast", "easy", "like", "nice", "happy",
    "pleased", "satisfied", "works", "fixed", "improved", "clean", "beautiful",
    "solid", "incredible", "impressive", "reliable", "worth", "fantastic",
];

const NEGATIVE: &[&str] = &[
    "bad", "terrible", "awful", "broken", "crash", "bug", "error", "fail",
    "hate", "worst", "horrible", "disgusting", "disappointing", "useless", "slow",
    "laggy", "freeze", "glitch", "scam", "waste", "refund", "problem", "issue",
    "unplayable", "ridiculous", "poor", "boring", "annoying", "frustrating",
    "rubbish", "trash", "garbage", "pathetic", "overpriced", "misleading",
    "unfinished", "incomplete", "broken", "crashes", "bugs",
];

pub fn score(text: &str) -> f32 {
    let lower = text.to_lowercase();
    let mut pos = 0i32;
    let mut neg = 0i32;

    for word in POSITIVE {
        if contains_word(&lower, word) {
            pos += 1;
        }
    }
    for word in NEGATIVE {
        if contains_word(&lower, word) {
            neg += 1;
        }
    }

    let total = pos + neg;
    if total == 0 {
        return 0.0;
    }
    (pos - neg) as f32 / total as f32
}

fn contains_word(text: &str, word: &str) -> bool {
    let mut start = 0;
    while let Some(pos) = text[start..].find(word) {
        let abs = start + pos;
        let before_ok = abs == 0 || !text.as_bytes()[abs - 1].is_ascii_alphabetic();
        let after_ok = abs + word.len() >= text.len()
            || !text.as_bytes()[abs + word.len()].is_ascii_alphabetic();
        if before_ok && after_ok {
            return true;
        }
        start = abs + 1;
    }
    false
}
