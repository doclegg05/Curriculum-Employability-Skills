"""Generate WebVTT caption files from MP4 videos using ElevenLabs Scribe v2."""
from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path
from typing import Optional

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

LESSONS_NEEDING_CAPTIONS = [
    "lesson-communicating-with-the-public",
    "lesson-controlling-anger",
    "lesson-interview-skills",
    "lesson-problem-solving-and-decision-making",
]

ALL_LESSONS_WITH_VIDEOS = [
    "lesson-communicating-with-the-public",
    "lesson-controlling-anger",
    "lesson-time-management",
    "lesson-interview-skills",
    "lesson-problem-solving-and-decision-making",
]

MAX_CUE_SECONDS = 5.0
MAX_CUE_WORDS = 10

PROJECT_ROOT = Path(__file__).resolve().parent.parent


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def format_timestamp(seconds: float) -> str:
    """Format seconds as HH:MM:SS.mmm for WebVTT."""
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = seconds % 60
    whole_secs = int(secs)
    millis = int(round((secs - whole_secs) * 1000))
    return f"{hours:02d}:{minutes:02d}:{whole_secs:02d}.{millis:03d}"


def words_to_vtt(words: list[dict]) -> str:
    """Group word-level timestamps into caption cues and return WebVTT text.

    Each word dict must have keys: text (str), start (float|None),
    end (float|None), type (str).

    Words with type 'spacing' or 'audio_event' are excluded from caption
    text but their timing is respected.
    """
    # Filter to only actual words (skip spacing and audio_event)
    caption_words: list[dict] = [
        w for w in words if w["type"] == "word"
    ]

    if not caption_words:
        return "WEBVTT\n"

    cues: list[tuple[float, float, str]] = []
    cue_start: Optional[float] = None
    cue_end: float = 0.0
    cue_texts: list[str] = []

    for word in caption_words:
        w_start = word.get("start") or 0.0
        w_end = word.get("end") or w_start
        w_text = word["text"]

        # Start a new cue if this is the first word
        if cue_start is None:
            cue_start = w_start
            cue_end = w_end
            cue_texts = [w_text]
            continue

        duration = w_end - cue_start
        word_count = len(cue_texts)

        # Check if adding this word would exceed limits
        if duration > MAX_CUE_SECONDS or word_count >= MAX_CUE_WORDS:
            # Finalize current cue
            cues.append((cue_start, cue_end, " ".join(cue_texts)))
            # Start new cue with this word
            cue_start = w_start
            cue_end = w_end
            cue_texts = [w_text]
        else:
            cue_end = w_end
            cue_texts.append(w_text)

    # Don't forget the last cue
    if cue_texts and cue_start is not None:
        cues.append((cue_start, cue_end, " ".join(cue_texts)))

    # Build VTT output
    lines = ["WEBVTT", ""]
    for i, (start, end, text) in enumerate(cues, 1):
        lines.append(str(i))
        lines.append(f"{format_timestamp(start)} --> {format_timestamp(end)}")
        lines.append(text)
        lines.append("")

    return "\n".join(lines)


def transcribe_video(video_path: Path) -> Optional[str]:
    """Transcribe a video file via ElevenLabs Scribe v2 and return VTT text.

    Returns None if the API call fails.
    """
    from elevenlabs import ElevenLabs

    client = ElevenLabs(api_key=os.environ["ELEVENLABS_API_KEY"])

    with open(video_path, "rb") as f:
        response = client.speech_to_text.convert(
            file=f,
            model_id="scribe_v2",
            language_code="eng",
        )

    # Convert response words to plain dicts
    raw_words: list[dict] = []
    for w in response.words:
        raw_words.append({
            "text": w.text,
            "start": w.start,
            "end": w.end,
            "type": w.type,
        })

    return words_to_vtt(raw_words)


def check_track_tags(lesson_dir: Path, vtt_files: list[Path]) -> list[str]:
    """Check if index.html has <track kind='captions'> for each VTT file.

    Returns a list of warning strings for missing track tags.
    """
    index_html = lesson_dir / "index.html"
    if not index_html.exists():
        return [f"  WARNING: {index_html} not found — cannot verify track tags"]

    html_content = index_html.read_text(encoding="utf-8")
    warnings: list[str] = []

    for vtt_path in vtt_files:
        relative_src = f"videos/{vtt_path.name}"
        if relative_src not in html_content:
            warnings.append(
                f"  WARNING: No <track> tag found for {relative_src} in {index_html.name}"
            )

    return warnings


def process_lesson(lesson_name: str) -> None:
    """Process all MP4 files in a lesson's videos/ directory."""
    lesson_dir = PROJECT_ROOT / lesson_name
    videos_dir = lesson_dir / "videos"

    if not videos_dir.exists():
        print(f"WARNING: {videos_dir} does not exist — skipping")
        return

    mp4_files = sorted(videos_dir.glob("*.mp4"))
    if not mp4_files:
        print(f"No MP4 files found in {videos_dir}")
        return

    total = len(mp4_files)
    print(f"\n{'=' * 60}")
    print(f"Processing {lesson_name} ({total} video{'s' if total != 1 else ''})")
    print(f"{'=' * 60}")

    generated_vtts: list[Path] = []

    for i, mp4_path in enumerate(mp4_files, 1):
        vtt_path = mp4_path.with_suffix(".vtt")
        print(f"[{i}/{total}] Transcribing {mp4_path.name}...", end=" ", flush=True)

        try:
            vtt_content = transcribe_video(mp4_path)
        except Exception as exc:
            print("FAILED")
            print(f"  Error: {exc}")
            continue

        if vtt_content is None:
            print("FAILED (no content returned)")
            continue

        vtt_path.write_text(vtt_content, encoding="utf-8")
        generated_vtts.append(vtt_path)

        # Count cues for reporting
        cue_count = vtt_content.count(" --> ")
        print(f"OK ({cue_count} cues)")

    # Check for track tags in HTML
    if generated_vtts:
        warnings = check_track_tags(lesson_dir, generated_vtts)
        if warnings:
            print()
            for w in warnings:
                print(w)


def process_single_file(file_path: str) -> None:
    """Process a single MP4 file."""
    mp4_path = Path(file_path).resolve()

    if not mp4_path.exists():
        print(f"ERROR: File not found: {mp4_path}")
        sys.exit(1)

    if mp4_path.suffix.lower() != ".mp4":
        print(f"ERROR: Not an MP4 file: {mp4_path}")
        sys.exit(1)

    vtt_path = mp4_path.with_suffix(".vtt")
    print(f"[1/1] Transcribing {mp4_path.name}...", end=" ", flush=True)

    try:
        vtt_content = transcribe_video(mp4_path)
    except Exception as exc:
        print("FAILED")
        print(f"  Error: {exc}")
        sys.exit(1)

    if vtt_content is None:
        print("FAILED (no content returned)")
        sys.exit(1)

    vtt_path.write_text(vtt_content, encoding="utf-8")
    cue_count = vtt_content.count(" --> ")
    print(f"OK ({cue_count} cues)")

    # Try to find the lesson directory and check track tags
    lesson_dir = mp4_path.parent.parent
    if (lesson_dir / "index.html").exists():
        warnings = check_track_tags(lesson_dir, [vtt_path])
        if warnings:
            print()
            for w in warnings:
                print(w)


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Generate WebVTT captions from MP4 videos using ElevenLabs Scribe v2."
    )
    parser.add_argument(
        "lesson",
        nargs="?",
        help="Lesson directory name (e.g. lesson-interview-skills)",
    )
    parser.add_argument(
        "--all",
        action="store_true",
        help="Process all lessons that have videos",
    )
    parser.add_argument(
        "--file",
        type=str,
        help="Path to a single MP4 file to transcribe",
    )

    args = parser.parse_args()

    # Validate environment
    if not os.environ.get("ELEVENLABS_API_KEY"):
        print("ERROR: ELEVENLABS_API_KEY environment variable is not set.")
        sys.exit(1)

    # Determine what to process
    if args.file:
        process_single_file(args.file)
    elif args.all:
        for lesson in ALL_LESSONS_WITH_VIDEOS:
            process_lesson(lesson)
    elif args.lesson:
        process_lesson(args.lesson)
    else:
        parser.print_help()
        sys.exit(1)

    print("\nDone.")


if __name__ == "__main__":
    main()
