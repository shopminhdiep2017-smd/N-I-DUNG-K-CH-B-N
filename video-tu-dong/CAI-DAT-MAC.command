#!/usr/bin/env bash
# Bộ cài video-use tự động cho macOS (cũng chạy được trên Linux: bash CAI-DAT-MAC.command)
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
REPO="$HOME/.claude/skills/video-use"
export PATH="$HOME/.local/bin:/opt/homebrew/bin:/usr/local/bin:$PATH"

if [ "$(uname)" = "Darwin" ]; then
  DESKTOP="$HOME/Desktop"
elif command -v xdg-user-dir >/dev/null 2>&1; then
  DESKTOP="$(xdg-user-dir DESKTOP)"
else
  DESKTOP="$HOME/Desktop"
fi
ROOT="$DESKTOP/VIDEO-TU-DONG"

echo "== 1/6 Cài công cụ nền (git, ffmpeg, uv)"
if [ "$(uname)" = "Darwin" ]; then
  if ! command -v brew >/dev/null 2>&1; then
    echo "Cài Homebrew (có thể hỏi mật khẩu máy Mac của bạn)..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    eval "$(/opt/homebrew/bin/brew shellenv 2>/dev/null || /usr/local/bin/brew shellenv)"
  fi
  for pkg in git ffmpeg uv; do
    command -v "$pkg" >/dev/null 2>&1 || brew install "$pkg"
  done
else
  if ! command -v ffmpeg >/dev/null 2>&1 || ! command -v git >/dev/null 2>&1; then
    sudo apt-get update && sudo apt-get install -y git ffmpeg curl
  fi
  command -v uv >/dev/null 2>&1 || curl -LsSf https://astral.sh/uv/install.sh | sh
fi

echo "== 2/6 Cài Claude Code"
command -v claude >/dev/null 2>&1 || curl -fsSL https://claude.ai/install.sh | bash

echo "== 3/6 Tải video-use về $REPO"
mkdir -p "$(dirname "$REPO")"
if [ -d "$REPO/.git" ]; then git -C "$REPO" pull --ff-only; else git clone https://github.com/browser-use/video-use "$REPO"; fi
(cd "$REPO" && uv sync)

echo "== 4/6 Khóa API ElevenLabs (dùng để nhận dạng giọng nói)"
if grep -q '^ELEVENLABS_API_KEY=..' "$REPO/.env" 2>/dev/null; then
  echo "Đã có khóa, bỏ qua."
else
  echo "Lấy khóa tại: https://elevenlabs.io/app/settings/api-keys"
  read -rsp "Dán khóa vào đây rồi nhấn Enter (chữ sẽ không hiện ra): " KEY; echo
  printf 'ELEVENLABS_API_KEY=%s\n' "$KEY" > "$REPO/.env"
  chmod 600 "$REPO/.env"
fi

echo "== 5/6 Tạo thư mục trên Desktop: $ROOT"
mkdir -p "$ROOT/_he-thong" "$ROOT/1-THA-VIDEO-VAO-DAY" "$ROOT/2-VIDEO-HOAN-CHINH"
cp "$HERE/watcher.py" "$ROOT/_he-thong/watcher.py"
[ -f "$ROOT/yeu-cau.txt" ] || cp "$HERE/yeu-cau.txt" "$ROOT/yeu-cau.txt"
cat > "$ROOT/BAT-DAU.command" <<LAUNCH
#!/usr/bin/env bash
export PATH="\$HOME/.local/bin:/opt/homebrew/bin:/usr/local/bin:\$PATH"
cd "\$(dirname "\$0")"
uv run --project "$REPO" python _he-thong/watcher.py --root "\$(pwd)" --repo "$REPO"
LAUNCH
chmod +x "$ROOT/BAT-DAU.command"

echo "== 6/6 Đăng nhập Claude"
echo "Cửa sổ Claude sẽ mở. Đăng nhập tài khoản Claude, xong gõ /exit rồi Enter."
read -rp "Nhấn Enter để tiếp tục..." _
claude || true

echo
echo "HOÀN TẤT! Mở thư mục VIDEO-TU-DONG trên Desktop, bấm đúp BAT-DAU.command,"
echo "rồi thả video vào 1-THA-VIDEO-VAO-DAY. Video xong sẽ nằm trong 2-VIDEO-HOAN-CHINH."
open "$ROOT" 2>/dev/null || true
