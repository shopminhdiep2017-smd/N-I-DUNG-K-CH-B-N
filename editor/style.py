"""Design tokens for the talking-head explainer style (see STYLE_GUIDE.md).

Everything visual (colors, zones, font sizes) lives here so the look can be
tuned in one place without touching the renderer.
"""
from pathlib import Path

W, H = 1080, 1920
FPS = 30

FONT_DIR = Path(__file__).parent / "assets" / "fonts"
FONT_BLACK = str(FONT_DIR / "BeVietnamPro-Black.ttf")
FONT_XBOLD = str(FONT_DIR / "BeVietnamPro-ExtraBold.ttf")
FONT_BOLD = str(FONT_DIR / "BeVietnamPro-Bold.ttf")
FONT_SEMI = str(FONT_DIR / "BeVietnamPro-SemiBold.ttf")

# Functional colour system (section 7 of the style guide).
COLORS = {
    "white": (255, 255, 255),
    "green": (34, 197, 94),
    "red": (239, 68, 68),
    "yellow": (250, 204, 21),
    "cyan": (34, 211, 238),
    "blue": (59, 130, 246),
    "dim": (148, 163, 184),
}
PANEL = (10, 14, 22, 190)       # dark translucent card behind graphics
STROKE = (0, 0, 0)

# Safe zones as fractions of frame height (section 17).
HEADLINE_ZONE = (0.12, 0.42)    # graphics must stay inside this band
HEADLINE_CENTER = 0.275         # default vertical centre for headlines
SUBTITLE_ZONE = (0.62, 0.82)
SUBTITLE_CENTER = 0.715
SIDE_MARGIN = 70                # px kept clear left/right
# TikTok UI: right-hand button rail and bottom-left caption block.
RIGHT_RAIL = (W - 150, int(H * 0.45), W, int(H * 0.88))
BOTTOM_LEFT = (0, int(H * 0.84), int(W * 0.75), H)

HEALTH_BANNED = [
    "chữa khỏi", "điều trị khỏi", "cam kết khỏi", "khỏi hẳn", "hết bệnh",
    "khỏi bệnh", "thay thế thuốc", "chắc chắn hiệu quả", "100%", "dứt điểm",
    "trị tận gốc", "đặc trị",
]

FILLERS = {"ờ", "à", "ừ", "ừm", "ờm", "ơ", "ừa", "hừm", "um", "uh", "ah", "ehm"}


def color(name_or_rgb):
    if isinstance(name_or_rgb, (list, tuple)):
        return tuple(name_or_rgb[:3])
    if isinstance(name_or_rgb, str) and name_or_rgb.startswith("#"):
        h = name_or_rgb.lstrip("#")
        return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))
    return COLORS.get(name_or_rgb or "white", COLORS["white"])
