import duckdb
import os
import json
from typing import Any, Dict, List, Optional


class DB:
    def __init__(self, db_path: str = "harkly.db"):
        self.db_path = db_path

    def connect(self):
        return duckdb.connect(self.db_path)

    def _to_dicts(self, rel) -> List[Dict[str, Any]]:
        cols = [d[0] for d in rel.description]
        return [dict(zip(cols, row)) for row in rel.fetchall()]

    def init_schema(self):
        with self.connect() as conn:
            conn.execute("""
            CREATE TABLE IF NOT EXISTS candidates (
                appid VARCHAR PRIMARY KEY,
                name VARCHAR,
                positive_rate FLOAT,
                total_reviews INTEGER,
                owners VARCHAR,
                collected_at TIMESTAMP DEFAULT NOW()
            )""")
            conn.execute("""
            CREATE TABLE IF NOT EXISTS studios (
                appid VARCHAR PRIMARY KEY,
                name VARCHAR,
                developer VARCHAR,
                website VARCHAR,
                support_email VARCHAR,
                twitter_handle VARCHAR,
                discord_url VARCHAR,
                price_usd FLOAT,
                dlc_count INTEGER,
                release_date VARCHAR,
                last_news_date TIMESTAMP,
                news_count_6m INTEGER,
                score_activity INTEGER,
                score_budget INTEGER,
                score_accessibility INTEGER,
                score_total INTEGER,
                validated_at TIMESTAMP DEFAULT NOW()
            )""")
            conn.execute("""
            CREATE TABLE IF NOT EXISTS reviews (
                review_id VARCHAR PRIMARY KEY,
                appid VARCHAR,
                text TEXT,
                voted_up BOOLEAN,
                votes_up INTEGER,
                playtime_minutes INTEGER,
                review_date TIMESTAMP,
                fetched_at TIMESTAMP DEFAULT NOW()
            )""")
            conn.execute("""
            CREATE TABLE IF NOT EXISTS clusters (
                appid VARCHAR,
                cluster_name VARCHAR,
                cluster_type VARCHAR,
                pct INTEGER,
                quotes JSON,
                insight TEXT,
                top_problem TEXT,
                founder_insight TEXT,
                clustered_at TIMESTAMP DEFAULT NOW(),
                PRIMARY KEY (appid, cluster_name)
            )""")

    def insert_candidates(self, candidates: List[Dict[str, Any]]) -> None:
        with self.connect() as conn:
            for c in candidates:
                conn.execute("""
                INSERT INTO candidates (appid, name, positive_rate, total_reviews, owners)
                VALUES ($1, $2, $3, $4, $5)
                ON CONFLICT (appid) DO NOTHING
                """, [c["appid"], c["name"], c["positive_rate"], c["total_reviews"], c["owners"]])

    def get_candidates(self) -> List[Dict[str, Any]]:
        with self.connect() as conn:
            rel = conn.execute("""
            SELECT appid, name, positive_rate, total_reviews, owners
            FROM candidates ORDER BY total_reviews DESC
            """)
            return self._to_dicts(rel)

    def insert_studios(self, studios: List[Dict[str, Any]]) -> None:
        with self.connect() as conn:
            for s in studios:
                conn.execute("""
                INSERT INTO studios (appid, name, developer, website, support_email,
                                   twitter_handle, discord_url, price_usd, dlc_count,
                                   release_date, last_news_date, news_count_6m,
                                   score_activity, score_budget, score_accessibility, score_total)
                VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
                ON CONFLICT (appid) DO UPDATE SET
                    name=EXCLUDED.name, developer=EXCLUDED.developer,
                    website=EXCLUDED.website, support_email=EXCLUDED.support_email,
                    twitter_handle=EXCLUDED.twitter_handle, discord_url=EXCLUDED.discord_url,
                    price_usd=EXCLUDED.price_usd, dlc_count=EXCLUDED.dlc_count,
                    release_date=EXCLUDED.release_date, last_news_date=EXCLUDED.last_news_date,
                    news_count_6m=EXCLUDED.news_count_6m, score_activity=EXCLUDED.score_activity,
                    score_budget=EXCLUDED.score_budget, score_accessibility=EXCLUDED.score_accessibility,
                    score_total=EXCLUDED.score_total
                """, [
                    s["appid"], s["name"],
                    s.get("developer", ""), s.get("website", ""),
                    s.get("support_email", ""), s.get("twitter_handle", ""),
                    s.get("discord_url", ""), s.get("price_usd", 0.0),
                    s.get("dlc_count", 0), s.get("release_date", ""),
                    s.get("last_news_date", None), s.get("news_count_6m", 0),
                    s.get("score_activity", 0), s.get("score_budget", 0),
                    s.get("score_accessibility", 0), s.get("score_total", 0)
                ])

    def get_studios(self, min_score: int = 0) -> List[Dict[str, Any]]:
        with self.connect() as conn:
            rel = conn.execute("""
            SELECT * FROM studios WHERE score_total >= $1 ORDER BY score_total DESC
            """, [min_score])
            return self._to_dicts(rel)

    def insert_reviews(self, reviews: List[Dict[str, Any]]) -> None:
        with self.connect() as conn:
            for r in reviews:
                conn.execute("""
                INSERT INTO reviews (review_id, appid, text, voted_up, votes_up, playtime_minutes, review_date)
                VALUES ($1,$2,$3,$4,$5,$6,$7)
                ON CONFLICT (review_id) DO NOTHING
                """, [
                    r["review_id"], r["appid"], r["text"],
                    r["voted_up"], r["votes_up"], r["playtime_minutes"], r["review_date"]
                ])

    def get_reviews(self, appid: str) -> List[Dict[str, Any]]:
        with self.connect() as conn:
            rel = conn.execute("""
            SELECT * FROM reviews WHERE appid = $1 ORDER BY review_date DESC
            """, [appid])
            return self._to_dicts(rel)

    def insert_clusters(self, clusters: List[Dict[str, Any]]) -> None:
        with self.connect() as conn:
            for c in clusters:
                conn.execute("""
                INSERT INTO clusters (appid, cluster_name, cluster_type, pct, quotes, insight, top_problem, founder_insight)
                VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
                ON CONFLICT (appid, cluster_name) DO UPDATE SET
                    cluster_type=EXCLUDED.cluster_type, pct=EXCLUDED.pct,
                    quotes=EXCLUDED.quotes, insight=EXCLUDED.insight,
                    top_problem=EXCLUDED.top_problem, founder_insight=EXCLUDED.founder_insight
                """, [
                    c["appid"], c["cluster_name"], c["cluster_type"],
                    c.get("pct", 0), json.dumps(c.get("quotes", [])),
                    c.get("insight", ""), c.get("top_problem", ""),
                    c.get("founder_insight", "")
                ])

    def get_clusters(self, appid: str) -> List[Dict[str, Any]]:
        with self.connect() as conn:
            rel = conn.execute("""
            SELECT * FROM clusters WHERE appid = $1 ORDER BY pct DESC
            """, [appid])
            return self._to_dicts(rel)

    def clear_table(self, table_name: str) -> None:
        with self.connect() as conn:
            conn.execute(f"DELETE FROM {table_name}")


def get_db_path():
    return os.path.join(os.path.dirname(__file__), "..", "output", "harkly.db")
