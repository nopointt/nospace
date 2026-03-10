import json
import time
import urllib.request
from urllib.error import URLError, HTTPError
import sys
import os
from typing import Dict, List, Any, Optional
import re

from db import get_db_path

class Validator:
    def __init__(self):
        self.sleep_interval = 1
        self.steam_api_base = "https://store.steampowered.com/api/appdetails"
        self.news_api_base = "https://api.steampowered.com/ISteamNews/GetNewsForApp/v0002"
        self.store_base = "https://store.steampowered.com/app"
    
    def fetch_app_details(self, appid: str) -> Optional[Dict[str, Any]]:
        url = f"{self.steam_api_base}?appids={appid}"
        try:
            with urllib.request.urlopen(url, timeout=15) as response:
                data = json.loads(response.read().decode('utf-8'))
                return data.get(appid, {}).get("data", None)
        except (HTTPError, URLError, json.JSONDecodeError):
            return None
    
    def fetch_news(self, appid: str) -> Optional[Dict[str, Any]]:
        url = f"{self.news_api_base}?appid={appid}&count=10&maxlength=0&format=json"
        try:
            with urllib.request.urlopen(url, timeout=15) as response:
                return json.loads(response.read().decode('utf-8'))
        except (HTTPError, URLError, json.JSONDecodeError):
            return None
    
    def scrape_store_page(self, appid: str) -> Dict[str, str]:
        url = f"{self.store_base}/{appid}"
        try:
            with urllib.request.urlopen(url, timeout=15) as response:
                html = response.read().decode('utf-8', errors='ignore')
                
                # Extract social links using regex
                twitter = re.search(r"https?://(?:www\.)?twitter\.com/([\w-]{1,30})", html)
                discord = re.search(r"https?://(?:www\.)?discord\.gg/([\w-]{1,30})", html)
                
                return {
                    "twitter": twitter.group(1) if twitter else "",
                    "discord": discord.group(1) if discord else "",
                    "raw_html": html[:500]  # Save small snippet for debugging
                }
        except (HTTPError, URLError, UnicodeDecodeError):
            return {"twitter": "", "discord": "", "raw_html": ""}
    
    def scrape_website(self, website: str) -> Dict[str, str]:
        if not website:
            return {"twitter": "", "discord": "", "email": ""}
        
        try:
            # Clean URL
            if not website.startswith(("http://", "https://")):
                website = "https://" + website
            
            with urllib.request.urlopen(website, timeout=10) as response:
                html = response.read().decode('utf-8', errors='ignore')
                
                twitter = re.search(r"https?://(?:www\.)?twitter\.com/([\w-]{1,30})", html)
                discord = re.search(r"https?://(?:www\.)?discord\.gg/([\w-]{1,30})", html)
                email = re.search(r"[\w\.-]+@[\w\.-]+\.\w+", html)
                
                return {
                    "twitter": twitter.group(1) if twitter else "",
                    "discord": discord.group(1) if discord else "",
                    "email": email.group(0) if email else ""
                }
        except (HTTPError, URLError, UnicodeDecodeError):
            return {"twitter": "", "discord": "", "email": ""}
    
    def calculate_activity_score(self, app_details: Dict[str, Any], 
                                news_data: Dict[str, Any], 
                                store_links: Dict[str, str]) -> int:
        score = 0
        
        # Last news age (using current date)
        try:
            if news_data and 'appnews' in news_data:
                news_items = news_data['appnews'].get('newsitems', [])
                if news_items:
                    # Get latest news date
                    latest_date = news_items[0]['date']
                    # Simplified: if we have news, assume recent
                    score += 15  # Base for having recent news
        except:
            pass
        
        # News count last 6 months (simplified)
        try:
            if news_data and 'appnews' in news_data:
                news_items = news_data['appnews'].get('newsitems', [])
                count = len([n for n in news_items if n["date"] > 15778800])  # ~6 months in seconds
                if count >= 5:
                    score += 15
                elif count >= 2:
                    score += 10
                elif count >= 1:
                    score += 5
        except:
            pass
        
        # Social links from store page
        if store_links["twitter"]:
            score += 8
        if store_links["discord"]:
            score += 7
        
        return min(score, 45)
    
    def calculate_budget_score(self, app_details: Dict[str, Any]) -> int:
        score = 0
        
        # Total reviews
        try:
            total_reviews = int(app_details.get("score_rank", 0))
            if total_reviews > 3000:
                score += 12
            elif total_reviews >= 1500:
                score += 9
            elif total_reviews >= 500:
                score += 6
        except:
            pass
        
        # DLC count
        try:
            dlc_count = len(app_details.get("dlc", []))
            if dlc_count >= 5:
                score += 12
            elif dlc_count >= 1:
                score += 8
            else:
                score += 4
        except:
            pass
        
        # Website
        if app_details.get("website"):
            score += 6
        
        return min(score, 30)
    
    def calculate_accessibility_score(self, store_links: Dict[str, str], 
                                    website_links: Dict[str, str]) -> int:
        score = 0
        
        # Confirmed social links
        if store_links["twitter"]:
            score += 10
        if store_links["discord"]:
            score += 8
        
        # Website links
        if website_links["twitter"]:
            score += 5
        if website_links["discord"]:
            score += 4
        if website_links["email"]:
            score += 7
        
        return min(score, 25)
    
    def validate_studio(self, candidate: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        print(f"Validating {candidate['name']} ({candidate['appid']})...")
        
        # Fetch app details
        app_details = self.fetch_app_details(candidate["appid"])
        if not app_details:
            print(f"  ❌ Failed to fetch app details")
            return None
        
        # Get developer info
        developer = app_details.get("developer", [""])[0] if app_details.get("developer") else ""
        website = app_details.get("website", "")
        support_email = app_details.get("support_info", {}).get("email", "")
        price_usd = app_details.get("price", {}).get("initial", 0) / 100.0
        release_date = app_details.get("release_date", {}).get("date", "")
        
        # Fetch news
        news_data = self.fetch_news(candidate["appid"])
        
        # Scrape store page
        store_links = self.scrape_store_page(candidate["appid"])
        
        # Scrape website
        website_links = self.scrape_website(website)
        
        # Calculate scores
        score_activity = self.calculate_activity_score(app_details, news_data, store_links)
        score_budget = self.calculate_budget_score(app_details)
        score_accessibility = self.calculate_accessibility_score(store_links, website_links)
        score_total = score_activity + score_budget + score_accessibility
        
        # Get DLC count
        dlc_count = len(app_details.get("dlc", []))
        
        studio = {
            "appid": candidate["appid"],
            "name": candidate["name"],
            "developer": developer,
            "website": website,
            "support_email": support_email,
            "twitter_handle": store_links["twitter"] or website_links["twitter"],
            "discord_url": store_links["discord"] or website_links["discord"],
            "price_usd": price_usd,
            "dlc_count": dlc_count,
            "release_date": release_date,
            "last_news_date": None,  # Could parse from news_data if needed
            "news_count_6m": 0,  # Could calculate from news_data
            "score_activity": score_activity,
            "score_budget": score_budget,
            "score_accessibility": score_accessibility,
            "score_total": score_total
        }
        
        print(f"  ✅ Score: {score_total}/100 (A:{score_activity} B:{score_budget} Ac:{score_accessibility})")
        return studio
    
    def validate_all(self, min_score: int = 50) -> List[Dict[str, Any]]:
        from db import DB
        db = DB(get_db_path())
        db.init_schema()
        
        candidates = db.get_candidates()
        if not candidates:
            print("No candidates found in database")
            return []
        
        valid_studios = []
        
        for candidate in candidates:
            try:
                studio = self.validate_studio(candidate)
                if studio and studio["score_total"] >= min_score:
                    valid_studios.append(studio)
                time.sleep(self.sleep_interval)
            except Exception as e:
                print(f"Error validating {candidate['name']}: {e}")
                continue
        
        if valid_studios:
            db.insert_studios(valid_studios)
            print(f"Validated {len(valid_studios)} studios with score >= {min_score}")
        else:
            print("No studios met the minimum score")
        
        return valid_studios


def main():
    import argparse
    
    parser = argparse.ArgumentParser(description="Validate Steam game studios")
    parser.add_argument("--min-score", type=int, default=50, help="Minimum OSINT score")
    
    args = parser.parse_args()
    
    validator = Validator()
    valid_studios = validator.validate_all(args.min_score)
    
    if valid_studios:
        print(f"\nTop validated studios:")
        for studio in valid_studios[:5]:
            print(f"  {studio['name']} ({studio['developer']}) - {studio['score_total']}/100")
    else:
        print("No valid studios found")


if __name__ == "__main__":
    main()