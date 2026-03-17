"""Idea Hub CRUD module for managing content ideas."""

import json
import uuid
from datetime import datetime, timezone
from pathlib import Path

HUB_PATH = Path(__file__).parent.parent / "ideas" / "hub.json"


def _load_hub() -> dict:
    """Load hub.json, initializing if missing."""
    if not HUB_PATH.exists():
        init_hub()
    with open(HUB_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def _save_hub(data: dict) -> None:
    """Atomically write hub.json (write to .tmp then rename)."""
    tmp_path = HUB_PATH.with_suffix(".tmp")
    with open(tmp_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    tmp_path.replace(HUB_PATH)


def init_hub() -> None:
    """Create hub.json with empty ideas list if not exists."""
    HUB_PATH.parent.mkdir(parents=True, exist_ok=True)
    if not HUB_PATH.exists():
        _save_hub({"version": "1", "ideas": []})


def add_idea(topic: str, angle: str, pillar: str, channel: str, sources: list, priority: int = 3) -> str:
    """Add idea, generate uuid4 id, set status='new', timestamps. Return idea id."""
    data = _load_hub()
    idea_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    idea = {
        "id": idea_id,
        "topic": topic,
        "angle": angle,
        "pillar": pillar,
        "channel": channel,
        "sources": sources,
        "priority": priority,
        "status": "new",
        "created_at": now,
        "updated_at": now,
        "research_brief_path": None,
    }
    data["ideas"].append(idea)
    _save_hub(data)
    return idea_id


def get_ideas(status: str | None = None, channel: str | None = None, pillar: str | None = None) -> list:
    """Return filtered ideas list, sorted by priority desc."""
    data = _load_hub()
    ideas = data["ideas"]
    if status:
        ideas = [i for i in ideas if i["status"] == status]
    if channel:
        ideas = [i for i in ideas if i["channel"] == channel]
    if pillar:
        ideas = [i for i in ideas if i["pillar"] == pillar]
    return sorted(ideas, key=lambda x: x["priority"], reverse=True)


def get_idea(idea_id: str) -> dict | None:
    """Return single idea by id."""
    data = _load_hub()
    for idea in data["ideas"]:
        if idea["id"] == idea_id:
            return idea
    return None


def update_idea(idea_id: str, **kwargs) -> bool:
    """Update any fields of idea, always update updated_at. Return True if found."""
    data = _load_hub()
    for idea in data["ideas"]:
        if idea["id"] == idea_id:
            for key, value in kwargs.items():
                if key in idea:
                    idea[key] = value
            idea["updated_at"] = datetime.now(timezone.utc).isoformat()
            _save_hub(data)
            return True
    return False


def get_next_idea(channel: str = "telegram") -> dict | None:
    """Return highest priority idea with status='new' for given channel."""
    ideas = get_ideas(status="new", channel=channel)
    return ideas[0] if ideas else None


def list_ideas() -> None:
    """Print a formatted table of all ideas to stdout."""
    data = _load_hub()
    ideas = sorted(data["ideas"], key=lambda x: x["priority"], reverse=True)
    if not ideas:
        print("No ideas in hub.")
        return
    print(f"{'id':<8} {'pillar':<12} {'channel':<10} {'priority':<8} {'status':<10} {'topic':<50}")
    print("-" * 100)
    for i in ideas:
        print(f"{i['id'][:8]:<8} {i['pillar']:<12} {i['channel']:<10} {i['priority']:<8} {i['status']:<10} {i['topic'][:50]:<50}")


if __name__ == "__main__":
    init_hub()
    list_ideas()
