#!/usr/bin/env python3
"""Build t3_medagent_demo_v3.mp4 from clean screenshots + existing VO audio."""

import subprocess, os, sys

DEMO = "/home/user/t3-medagent/demo"
CLEAN = "/home/user/t3-medagent/screenshots/clean"
OUT = f"{DEMO}/t3_medagent_demo_v3.mp4"
W, H = 1920, 1080

def run(cmd, **kw):
    print(f"  $ {' '.join(cmd) if isinstance(cmd, list) else cmd}")
    result = subprocess.run(cmd, capture_output=True, text=True, **kw)
    if result.returncode != 0:
        print(f"  STDERR: {result.stderr[-500:]}")
        raise RuntimeError(f"Command failed: {cmd}")
    return result

def make_clip(img_path, audio_path, out_path, extra_filters=""):
    """Create a video clip: image + audio, scaled to 1920x1080, with ken-burns zoom."""
    dur_result = subprocess.run(
        ["ffprobe", "-v", "quiet", "-show_entries", "format=duration",
         "-of", "csv=p=0", audio_path],
        capture_output=True, text=True
    )
    dur = float(dur_result.stdout.strip()) + 0.3  # small buffer

    # Scale image to fit 1920x1080, pad with dark background, subtle zoom
    vf = (
        f"scale={W}:{H}:force_original_aspect_ratio=decrease,"
        f"pad={W}:{H}:(ow-iw)/2:(oh-ih)/2:color=#0a0e1a,"
        f"zoompan=z='min(zoom+0.0003,1.05)':d={int(dur*25)}:s={W}x{H}:fps=25"
    )
    if extra_filters:
        vf += f",{extra_filters}"

    run([
        "ffmpeg", "-y",
        "-loop", "1", "-i", img_path,
        "-i", audio_path,
        "-vf", vf,
        "-c:v", "libx264", "-preset", "fast", "-crf", "20",
        "-c:a", "aac", "-b:a", "192k",
        "-shortest", "-pix_fmt", "yuv420p",
        "-t", str(dur),
        out_path
    ])
    print(f"  => {out_path} ({dur:.1f}s)")

# ── Clip definitions ─────────────────────────────────────────────────────────
# (image, audio, output)
clips = [
    # Section 1: Landing / Intro
    (f"{CLEAN}/01-landing.png",                f"{DEMO}/n01a.mp3", f"{DEMO}/v3_c01a.mp4"),
    (f"{CLEAN}/03-landing-17primitives.png",   f"{DEMO}/n01b.mp3", f"{DEMO}/v3_c01b.mp4"),
    # Section 2: Onboarding
    (f"{CLEAN}/04-onboard-step1.png",          f"{DEMO}/n02a.mp3", f"{DEMO}/v3_c02a.mp4"),
    (f"{CLEAN}/09-onboard-done.png",           f"{DEMO}/n02b.mp3", f"{DEMO}/v3_c02b.mp4"),
    (f"{CLEAN}/16-t3-otp-email.png",           f"{DEMO}/n02c.mp3", f"{DEMO}/v3_c02c.mp4"),
    # Section 3: Dashboard / Health Console
    (f"{CLEAN}/10-dashboard-active-chat.png",  f"{DEMO}/n03a.mp3", f"{DEMO}/v3_c03a.mp4"),
    (f"{CLEAN}/11-dashboard-hospitals.png",    f"{DEMO}/n03b.mp3", f"{DEMO}/v3_c03b.mp4"),
    # Section 4: SDK Sidebar
    (f"{CLEAN}/12-sdk-sidebar-zoom.png",       f"{DEMO}/n04.mp3",  f"{DEMO}/v3_c04.mp4"),
    # Section 5: Audit Log
    (f"{CLEAN}/13-audit-populated.png",        f"{DEMO}/n05a.mp3", f"{DEMO}/v3_c05a.mp4"),
    (f"{CLEAN}/14-audit-info-filter.png",      f"{DEMO}/n05b.mp3", f"{DEMO}/v3_c05b.mp4"),
    (f"{CLEAN}/15-audit-tee-events.png",       f"{DEMO}/n05c.mp3", f"{DEMO}/v3_c05c.mp4"),
    # Section 6: Delegation
    (f"{CLEAN}/07-delegation.png",             f"{DEMO}/n06.mp3",  f"{DEMO}/v3_c06.mp4"),
    # Section 7: Verify TEE
    (f"{CLEAN}/08-verify-tee.png",             f"{DEMO}/n07.mp3",  f"{DEMO}/v3_c07.mp4"),
    # Section 8: Outro
    (f"{CLEAN}/02-landing-sdk-coverage.png",   f"{DEMO}/n08.mp3",  f"{DEMO}/v3_c08.mp4"),
]

print("=== Building clips ===")
for img, audio, out in clips:
    label = os.path.basename(out)
    print(f"\n[{label}]  {os.path.basename(img)} + {os.path.basename(audio)}")
    make_clip(img, audio, out)

# ── Concat ───────────────────────────────────────────────────────────────────
concat_file = f"{DEMO}/v3_concat.txt"
with open(concat_file, "w") as f:
    for _, _, out in clips:
        f.write(f"file '{out}'\n")

print("\n=== Concatenating clips ===")
silent = f"{DEMO}/v3_silent.mp4"
run([
    "ffmpeg", "-y",
    "-f", "concat", "-safe", "0", "-i", concat_file,
    "-c:v", "libx264", "-preset", "fast", "-crf", "20",
    "-c:a", "aac", "-b:a", "192k",
    "-pix_fmt", "yuv420p",
    silent
])

# ── Mix background music ──────────────────────────────────────────────────────
print("\n=== Mixing background music ===")
bg = f"{DEMO}/bg_music.mp3"
run([
    "ffmpeg", "-y",
    "-i", silent,
    "-i", bg,
    "-filter_complex",
    "[1:a]volume=0.08,aloop=loop=-1:size=2e+09[bg];[0:a][bg]amix=inputs=2:duration=first:weights=1 0.08[aout]",
    "-map", "0:v", "-map", "[aout]",
    "-c:v", "copy", "-c:a", "aac", "-b:a", "192k",
    OUT
])

total = subprocess.run(
    ["ffprobe", "-v", "quiet", "-show_entries", "format=duration", "-of", "csv=p=0", OUT],
    capture_output=True, text=True
).stdout.strip()
print(f"\n=== DONE: {OUT} ({float(total):.1f}s) ===")
