"""
Admin Bot Config API — Manage bot prompts, compliance rules, and templates.

Endpoints:
  GET  /api/admin/bot-config           — Fetch all bot_* settings
  PUT  /api/admin/bot-config/{key}     — Update a specific setting
  POST /api/admin/bot-config/reset/{key} — Reset a setting to its default
"""

from __future__ import annotations

import json
import logging

from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse

from app import bot_config
from app.db.connection import get_pool

logger = logging.getLogger(__name__)
router = APIRouter()

# Valid bot config keys (whitelist to prevent arbitrary writes)
VALID_BOT_KEYS = {
    "bot_default_system_prompt",
    "bot_compliance_rules",
    "bot_sebi_disclaimer",
    "bot_blocked_phrases",
    "bot_advice_patterns",
    "bot_escalation_responses",
    "bot_nudge_templates",
    "bot_fallback_response",
}


@router.get("/bot-config")
async def get_all_bot_config():
    """
    Fetch all bot_* settings.
    Returns a dict of key → value for every bot configuration entry.
    Includes defaults for any keys not yet in the database.
    """
    try:
        pool = get_pool()
        rows = await pool.fetch(
            "SELECT key, value FROM system_settings WHERE key LIKE 'bot_%'"
        )

        result = {}
        for row in rows:
            val = row["value"]
            if not isinstance(val, dict):
                try:
                    val = json.loads(val)
                except (json.JSONDecodeError, TypeError):
                    val = {"text": str(val)}
            result[row["key"]] = val

        # Fill in defaults for any missing keys
        for key, default_val in bot_config.DEFAULTS.items():
            if key not in result:
                result[key] = default_val

        return JSONResponse(content=result)

    except Exception as e:
        logger.error(f"Failed to fetch bot config: {e}")
        # Return defaults on DB failure
        return JSONResponse(content=bot_config.DEFAULTS)


@router.put("/bot-config/{key}")
async def update_bot_config(key: str, request: Request):
    """
    Update a specific bot config setting.
    Body should be the JSON value to store (e.g., {"text": "..."} or {"patterns": [...]}).
    """
    if key not in VALID_BOT_KEYS:
        return JSONResponse(
            status_code=400,
            content={"error": f"Invalid key: {key}. Valid keys: {sorted(VALID_BOT_KEYS)}"},
        )

    try:
        body = await request.json()
    except Exception as e:
        return JSONResponse(status_code=400, content={"error": f"Invalid JSON: {e}"})

    try:
        pool = get_pool()

        # Upsert the setting
        await pool.execute(
            """
            INSERT INTO system_settings (key, value)
            VALUES ($1, $2::jsonb)
            ON CONFLICT (key) DO UPDATE SET value = $2::jsonb, updated_at = NOW()
            """,
            key,
            json.dumps(body),
        )

        # Invalidate the bot_config cache so new values take effect
        bot_config.invalidate()

        logger.info(f"Bot config updated: {key}")
        return JSONResponse(content={"status": "updated", "key": key})

    except Exception as e:
        logger.error(f"Failed to update bot config {key}: {e}")
        return JSONResponse(status_code=500, content={"error": str(e)})


@router.post("/bot-config/reset/{key}")
async def reset_bot_config(key: str):
    """
    Reset a bot config setting to its hardcoded default value.
    """
    if key not in VALID_BOT_KEYS:
        return JSONResponse(
            status_code=400,
            content={"error": f"Invalid key: {key}"},
        )

    if key not in bot_config.DEFAULTS:
        return JSONResponse(
            status_code=400,
            content={"error": f"No default found for key: {key}"},
        )

    try:
        pool = get_pool()
        default_value = bot_config.DEFAULTS[key]

        await pool.execute(
            """
            INSERT INTO system_settings (key, value)
            VALUES ($1, $2::jsonb)
            ON CONFLICT (key) DO UPDATE SET value = $2::jsonb, updated_at = NOW()
            """,
            key,
            json.dumps(default_value),
        )

        # Invalidate cache
        bot_config.invalidate()

        logger.info(f"Bot config reset to default: {key}")
        return JSONResponse(content={
            "status": "reset",
            "key": key,
            "value": default_value,
        })

    except Exception as e:
        logger.error(f"Failed to reset bot config {key}: {e}")
        return JSONResponse(status_code=500, content={"error": str(e)})
