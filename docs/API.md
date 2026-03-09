# API Reference

## GET /api/character

Fetches character profile data by searching the Lodestone via Nodestone.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| name | string | yes | Character first and last name |
| server | string | yes | Server name (e.g., Gilgamesh) |

**Response (200) -- Single Match:**
```json
{
  "character": {
    "id": "string",
    "name": "string",
    "server": "string",
    "avatar": "string (URL)",
    "achievementPoints": 0,
    "achievementsCompleted": 0,
    "totalAchievements": 0,
    "lastUpdated": "ISO 8601 string"
  },
  "lodestoneId": 12345678,
  "completedAchievements": [],
  "_isMockData": false
}
```

**Response (200) -- Multiple Matches:**
```json
{
  "character": null,
  "lodestoneId": null,
  "possibleMatches": [
    {
      "id": "12345678",
      "name": "Character Name",
      "server": "Gilgamesh",
      "avatar": "https://img2.finalfantasyxiv.com/..."
    }
  ],
  "message": "Multiple characters found. Please select one."
}
```

**Error (404):** Character not found.
**Error (429):** Rate limited (30 requests/minute).

**Notes:**
- Searches the Lodestone directly via Nodestone (no API key required).
- Falls back to mock data if the Lodestone search is unavailable.
- Input is sanitized and validated before the search.
- When multiple characters match, the frontend presents a selection UI.

---

## GET /api/achievements

Fetches achievement list with TSR-G scores.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| lodestoneId | number | no | Lodestone ID for completion status |

**Response (200):**
```json
[
  {
    "id": 1,
    "name": "string",
    "description": "string",
    "category": "string",
    "points": 5,
    "patch": "6.0",
    "isObtainable": true,
    "isCompleted": false,
    "tsrg": {
      "time": 2,
      "skill": 1,
      "rng": 1,
      "group": 1,
      "composite": 5,
      "tier": 1
    }
  }
]
```

**Notes:**
- Without `lodestoneId`, returns the general achievement list (all `isCompleted: false`).
- With `lodestoneId`, merges FFXIVCollect owned and missing endpoints for accurate completion status.
- Client-side cache duration: 6 hours.

---

## Debug Endpoints (development only)

### GET /api/debug/inspect
Returns API endpoint inspection data. Supports endpoints: `ffxiv-collect-achievements`, `ffxiv-collect-character`, `nodestone-search`.
