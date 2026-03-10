#!/usr/bin/env python3
"""Outreach pipeline for Steam game studios."""

import argparse
import re
import smtplib
from email.mime.text import MIMEText
from pathlib import Path
from typing import Optional

import requests
from bs4 import BeautifulSoup

HEADERS = {"User-Agent": "Mozilla/5.0"}


def scrape_studio_channels(appid: int) -> dict:
    """Scrape Steam store page for studio contact channels."""
    url = f"https://store.steampowered.com/app/{appid}/"
    result = {
        "studio_name": None,
        "website": None,
        "twitter": None,
        "discord": None,
        "reddit": None,
    }
    try:
        resp = requests.get(url, headers=HEADERS, timeout=10)
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, "html.parser")

        # Studio name — extract link text inside dev_row, not the label
        dev_row = soup.find("div", class_="dev_row")
        if dev_row:
            a = dev_row.find("a")
            result["studio_name"] = a.get_text(strip=True) if a else dev_row.get_text(strip=True).split(":")[-1].strip()
        else:
            og = soup.find("meta", property="og:title")
            if og and og.get("content"):
                result["studio_name"] = og["content"]

        # Website — decode Steam linkfilter redirect to real URL
        STEAM_ACCOUNTS = {"steam", "steamgames", "valvesoftware", "valve"}
        for link in soup.find_all("a", href=True):
            href = link["href"]
            if "Visit the website" in link.get_text() or "website" in link.get_text().lower():
                if "linkfilter" in href:
                    from urllib.parse import unquote, urlparse, parse_qs
                    qs = parse_qs(urlparse(href).query)
                    href = qs.get("u", [href])[0]
                    href = unquote(href)
                result["website"] = href
                break

        # Social channels — skip Steam's own accounts
        for link in soup.find_all("a", href=True):
            href = link["href"]
            if "twitter.com/" in href or "x.com/" in href:
                handle = href.split("/")[-1].split("?")[0].lower()
                if handle and handle not in STEAM_ACCOUNTS and not result["twitter"]:
                    result["twitter"] = handle
            elif "discord.gg/" in href or "discord.com/invite/" in href:
                if not result["discord"]:
                    result["discord"] = href
            elif "reddit.com/r/" in href:
                if not result["reddit"]:
                    result["reddit"] = href.split("/r/")[-1].split("/")[0].split("?")[0]
    except Exception as e:
        print(f"[WARN] scrape_studio_channels failed: {e}")
    return result


def scrape_email(website_url: str) -> Optional[str]:
    """Find contact email from studio website."""
    email_re = re.compile(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}')
    pages_to_try = ["", "/contact", "/about", "/press"]
    for suffix in pages_to_try:
        try:
            url = website_url.rstrip("/") + suffix
            resp = requests.get(url, headers=HEADERS, timeout=10)
            resp.raise_for_status()
            # Check mailto links
            soup = BeautifulSoup(resp.text, "html.parser")
            for link in soup.find_all("a", href=True):
                href = link["href"]
                if href.startswith("mailto:"):
                    email = href[7:].split("?")[0]
                    if email_re.match(email):
                        return email
            # Check text content for email
            text = soup.get_text()
            match = email_re.search(text)
            if match:
                return match.group()
        except Exception as e:
            continue
    return None


def _extract_competitor_fan_pct(text: str) -> float:
    """Extract Competitor Fan percentage from taxonomy table."""
    match = re.search(r'Competitor Fan\s*\|\s*(\d+(?:\.\d+)?)', text, re.I)
    if match:
        return float(match.group(1))
    # Also try: | Competitor Fan | 12 | 18.5% |
    match = re.search(r'\|\s*Competitor Fan\s*\|[^|]*\|\s*(\d+(?:\.\d+)?)%', text, re.I)
    if match:
        return float(match.group(1))
    return 0.0


def _build_subject(studio_name: str, private_ratio: str, top_taxonomy: str,
                   top_cluster: str, competitor_pct: float) -> str:
    """Build dynamic subject line based on strongest signal."""
    if competitor_pct >= 15:
        return f"Your {studio_name} reviews — a lot of ETS2/ATS fans in there"
    try:
        ratio_val = float(private_ratio)
    except (ValueError, TypeError):
        ratio_val = 0.0
    if ratio_val >= 60:
        return f"{int(ratio_val)}% of your negative reviewers are invisible — here's what we found"
    if top_cluster and top_cluster != "N/A":
        cluster_short = top_cluster[:50].rstrip()
        return f"Your top complaint cluster: \"{cluster_short}\""
    return f"Quick analysis of {studio_name}'s negative reviews"


def compose_message(studio_name: str, report_path: str) -> str:
    """Compose outreach message from report file."""
    report_file = Path(report_path)
    if not report_file.exists():
        return f"[ERROR] Report not found: {report_path}"

    text = report_file.read_text(errors="ignore")
    lines = text.splitlines()

    # Extract review count
    review_match = re.search(r'Total Reviews[^\d]*(\d+)', text, re.I)
    review_count = review_match.group(1) if review_match else "N/A"

    # Extract private ratio
    ratio_match = re.search(r'Private Ratio[^\d]*(\d+(?:\.\d+)?)', text, re.I)
    private_ratio = ratio_match.group(1) if ratio_match else "N/A"

    # Extract top taxonomy — first non-header, non-private row in taxonomy table
    top_taxonomy = "N/A"
    top_taxonomy_pct = "N/A"
    in_taxonomy = False
    for line in lines:
        if "Taxonomy" in line or "taxonomy" in line:
            in_taxonomy = True
        if in_taxonomy and "|" in line and "Type" not in line and "---" not in line:
            parts = [p.strip() for p in line.split("|") if p.strip()]
            if parts and parts[0].lower() not in ("private", "type"):
                top_taxonomy = parts[0]
                # Try to grab percentage from same row
                pct_match = re.search(r'(\d+(?:\.\d+)?)%', line)
                if pct_match:
                    top_taxonomy_pct = pct_match.group(1) + "%"
                break

    # Extract top cluster name + description
    top_cluster = "N/A"
    top_cluster_desc = ""
    in_clusters = False
    for i, line in enumerate(lines):
        if line.strip().startswith("## Top Clusters"):
            in_clusters = True
            continue
        if in_clusters and line.strip().startswith("###"):
            top_cluster = re.sub(r'^###\s*\d+\.\s*', '', line.strip())
            top_cluster = re.sub(r'\s*\(\d+.*?\)', '', top_cluster).strip()
            # Grab next non-empty line as description
            for desc_line in lines[i + 1:i + 5]:
                stripped = desc_line.strip()
                if stripped and not stripped.startswith("#") and not stripped.startswith("|"):
                    top_cluster_desc = stripped[:120]
                    break
            break

    # Extract legitimacy score
    legit_match = re.search(r'Legitimacy Score[^\d]*(\d+(?:\.\d+)?)', text, re.I)
    legit_score = legit_match.group(1) + "h" if legit_match else None

    # Competitor Fan %
    competitor_pct = _extract_competitor_fan_pct(text)

    subject = _build_subject(studio_name, private_ratio, top_taxonomy, top_cluster, competitor_pct)

    # Build insight block
    insight_lines = [
        f"- Analyzed {review_count} negative reviews",
        f"- {private_ratio}% of reviewers had private profiles (no enrichment possible)",
        f"- Dominant reviewer type: {top_taxonomy} ({top_taxonomy_pct} of reviewers)",
        f"- Top complaint cluster: \"{top_cluster}\"",
    ]
    if top_cluster_desc:
        insight_lines.append(f"  → {top_cluster_desc}")
    if legit_score:
        insight_lines.append(f"- Genre Expert avg playtime at review: {legit_score} (legitimacy signal)")
    if competitor_pct >= 10:
        insight_lines.append(f"- {competitor_pct:.0f}% are Competitor Fans (ETS2/ATS players) — churn risk, not product failure")

    insight_block = "\n".join(insight_lines)

    return f"""Subject: {subject}

Hey,

I ran a player profile analysis on {studio_name}'s negative reviews on Steam. Figured I'd send it over — no pitch, just the data.

{insight_block}

Full breakdown: reviewer taxonomy, complaint clusters mapped to reviewer types, and a legitimacy score on 1-star reviews.

If any of this is useful — happy to talk through what it means. No strings attached.

— Harkly
"""


def send_via_email(to_email: str, subject: str, body: str, from_email: str, from_password: str) -> bool:
    """Send email via Gmail SMTP."""
    try:
        msg = MIMEText(body)
        msg["Subject"] = subject
        msg["From"] = from_email
        msg["To"] = to_email

        with smtplib.SMTP("smtp.gmail.com", 587) as server:
            server.starttls()
            server.login(from_email, from_password)
            server.send_message(msg)
        return True
    except Exception as e:
        print(f"[ERROR] send_via_email failed: {e}", file=__import__("sys").stderr)
        return False


def main():
    parser = argparse.ArgumentParser(description="Outreach pipeline for Steam studios")
    parser.add_argument("--appid", type=int, required=True, help="Steam app ID")
    parser.add_argument("--report", type=str, required=True, help="Path to report file")
    parser.add_argument("--email", type=str, default=None, help="Override email")
    parser.add_argument("--from-email", type=str, default=None, help="Sender Gmail address")
    parser.add_argument("--from-password", type=str, default=None, help="Gmail app password")
    args = parser.parse_args()

    # Step 1: Scrape channels
    print(f"[*] Scraping Steam store for appid {args.appid}...")
    channels = scrape_studio_channels(args.appid)
    print(f"    Studio: {channels.get('studio_name') or 'N/A'}")
    print(f"    Website: {channels.get('website') or 'N/A'}")
    print(f"    Twitter: {channels.get('twitter') or 'N/A'}")
    print(f"    Discord: {channels.get('discord') or 'N/A'}")
    print(f"    Reddit: {channels.get('reddit') or 'N/A'}")

    # Step 2: Scrape email
    email = args.email
    if not email and channels.get("website"):
        print(f"[*] Scraping email from {channels['website']}...")
        email = scrape_email(channels["website"])
        if email:
            print(f"    Found email: {email}")
        else:
            print("    No email found")

    # Step 3: Compose message
    studio_name = channels.get("studio_name") or "Studio"
    message = compose_message(studio_name, args.report)

    # Step 4: Send or display
    if args.from_email and args.from_password and email:
        subject_line = message.split("\n")[0].replace("Subject: ", "")
        body = "\n".join(message.split("\n")[1:])
        if send_via_email(email, subject_line, body, args.from_email, args.from_password):
            print(f"[*] Email sent to {email}")
        else:
            print(f"[!] Failed to send email to {email}")
    else:
        print("\n[*] No email credentials or email found. Manual outreach info:")
        print("=" * 60)
        if email:
            print(f"To: {email}")
        if channels.get("twitter"):
            print(f"Twitter: @{channels['twitter']}")
        if channels.get("discord"):
            print(f"Discord: {channels['discord']}")
        if channels.get("reddit"):
            print(f"Reddit: r/{channels['reddit']}")
        print("\nMessage preview:")
        print("-" * 60)
        print(message)


if __name__ == "__main__":
    main()
