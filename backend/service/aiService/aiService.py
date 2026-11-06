"""AI 音乐生成服务（mock）。

当前为桩实现：根据请求构造 1-3 个 mock GeneratedClip（随机波形），
模拟 1-2 秒延迟后返回，并追加到 aiHistory.json。

未来接入真实 AI 时：
- 前端 aiStore.generate 检查 pluginConfig.realAi 标志
- 若 realAi=true，前端走 sdk.ai.chat（宿主 SDK 持有 auth）
- 此 handler 可保留作为离线 fallback 或删除

预留接入点示例（注释）：
    from plugin_runtime import host_get_plugin_config
    plugin_config = host_get_plugin_config() or {}
    ai_defaults = plugin_config.get("aiDefaults", {})
    model_id = ai_defaults.get("modelId")
    # 前端调用 sdk.ai.chat({ modelId, messages, tools }) 获取真实生成结果
"""

import random
import time
from datetime import datetime, timezone
from uuid import uuid4

from plugin_runtime import handler
from service.audioSettingsService.audioSettingsService import append_ai_history_entry


VALID_DURATIONS = (30, 60, 120, 300)
VALID_MOODS = ("cheerful", "melancholy", "passionate", "calm", "romantic", "mysterious")
VALID_GENRES = ("pop", "rock", "jazz", "classical", "electronic", "hiphop", "rnb", "folk", "country", "blues")


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _build_mock_clip(request: dict, index: int) -> dict:
    genres = request.get("genres") or []
    primary_genre = genres[0] if genres else "pop"
    genre_label = {
        "pop": "流行", "rock": "摇滚", "jazz": "爵士", "classical": "古典",
        "electronic": "电子", "hiphop": "嘻哈", "rnb": "R&B", "folk": "民谣",
        "country": "乡村", "blues": "蓝调",
    }.get(primary_genre, primary_genre)

    titles = [f"AI 旋律 - {genre_label}风格", f"AI 伴奏 - {genre_label}风格", f"AI 和声 - {genre_label}风格"]
    duration_seconds = int(request.get("duration") or 120)
    # 50 个波形柱，高度 20-100
    waveform = [random.randint(20, 100) for _ in range(50)]

    return {
        "id": uuid4().hex[:8],
        "title": titles[index] if index < len(titles) else titles[0],
        "durationSeconds": duration_seconds,
        "waveform": waveform,
        "genres": list(genres),
        "createdAt": _now_iso(),
    }


@handler("generateAudio")
def generate_audio(params):
    """mock 生成音频片段。

    params: { audioId, request: GenerationRequest }
    returns: { clips: GeneratedClip[], historyEntry: GenerationHistoryEntry }
    """
    if not isinstance(params, dict):
        raise ValueError("params must be a dict")

    audio_id = str(params.get("audioId") or "").strip()
    if not audio_id:
        raise ValueError("audioId is required")

    request = params.get("request")
    if not isinstance(request, dict):
        raise ValueError("request is required")

    # 校验
    prompt = str(request.get("prompt") or "").strip()
    if not prompt:
        raise ValueError("request.prompt is required")

    bpm = request.get("bpm")
    if not isinstance(bpm, (int, float)) or not (40 <= bpm <= 240):
        raise ValueError("request.bpm must be a number in [40, 240]")

    duration = request.get("duration")
    if duration not in VALID_DURATIONS:
        raise ValueError(f"request.duration must be one of {VALID_DURATIONS}")

    genres = request.get("genres")
    if not isinstance(genres, list) or not genres:
        raise ValueError("request.genres must be a non-empty list")
    invalid_genres = [g for g in genres if g not in VALID_GENRES]
    if invalid_genres:
        raise ValueError(f"invalid genres: {invalid_genres}")

    # 模拟生成延迟
    time.sleep(random.uniform(1.0, 2.0))

    # 构造 1-3 个 mock 片段
    clip_count = random.randint(1, 3)
    clips = [_build_mock_clip(request, i) for i in range(clip_count)]

    # 追加历史
    history_entry = {
        "id": uuid4().hex[:8],
        "request": request,
        "clipIds": [c["id"] for c in clips],
        "createdAt": _now_iso(),
    }
    append_ai_history_entry(audio_id, history_entry)

    return {
        "clips": clips,
        "historyEntry": history_entry,
    }
