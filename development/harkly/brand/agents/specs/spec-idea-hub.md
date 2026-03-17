# Spec: idea_hub.py — Idea Hub CRUD module

## Goal
Create `agents/idea_hub.py` — a simple CRUD module for managing content ideas stored in `ideas/hub.json`.

## Output file
`/c/Users/noadmin/nospace/development/harkly/brand/agents/idea_hub.py`

## Hub storage
`/c/Users/noadmin/nospace/development/harkly/brand/ideas/hub.json`

## hub.json schema
```json
{
  "version": "1",
  "ideas": []
}
```

Each idea object:
```json
{
  "id": "<uuid4>",
  "topic": "<main topic, 5-10 words>",
  "angle": "<unique take, 1 sentence>",
  "pillar": "signals|category|methodology",
  "channel": "telegram|ghost|habr",
  "sources": [{"title": "...", "url": "...", "type": "hn|github|telegram|web"}],
  "priority": 3,
  "status": "new|assigned|writing|written|published",
  "created_at": "<ISO 8601>",
  "updated_at": "<ISO 8601>",
  "research_brief_path": null
}
```

## Functions to implement

```python
def init_hub() -> None
    # Create hub.json with empty ideas list if not exists

def add_idea(topic, angle, pillar, channel, sources, priority=3) -> str
    # Add idea, generate uuid4 id, set status="new", timestamps
    # Return idea id

def get_ideas(status=None, channel=None, pillar=None) -> list
    # Return filtered ideas list, sorted by priority desc

def get_idea(idea_id: str) -> dict | None
    # Return single idea by id

def update_idea(idea_id: str, **kwargs) -> bool
    # Update any fields of idea, always update updated_at
    # Return True if found and updated

def get_next_idea(channel="telegram") -> dict | None
    # Return highest priority idea with status="new" for given channel

def list_ideas() -> None
    # Print a formatted table of all ideas to stdout
    # Columns: id[:8], pillar, channel, priority, status, topic[:50]
```

## Requirements
- Use `uuid` stdlib for id generation
- Use `json` stdlib for storage (atomic write: write to .tmp then rename)
- Use `pathlib.Path` for all file operations
- All functions must handle missing hub.json gracefully (call init_hub)
- `__main__` block: call `init_hub()` then `list_ideas()` — useful for testing

## Constraints
- No external dependencies beyond stdlib
- File: single module, under 150 lines
- No classes — plain functions only
