/** Đọc bảng markdown đơn giản: trả về các dòng (bỏ dòng tiêu đề và dòng ---). */
export function parseTableRows(section: string): string[][] {
  const rows: string[][] = [];
  let headerSeen = false;
  for (const raw of section.split("\n")) {
    const line = raw.trim();
    if (!line.startsWith("|")) {
      headerSeen = false;
      continue;
    }
    const cells = line.replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim());
    if (cells.every((c) => /^:?-{2,}:?$/.test(c))) continue;
    if (!headerSeen) {
      headerSeen = true;
      continue;
    }
    rows.push(cells);
  }
  return rows;
}

/** Tách thân file theo tiêu đề cấp 1 "# ..." */
export function splitTopSections(body: string): { heading: string; content: string }[] {
  const parts: { heading: string; content: string }[] = [];
  let current = { heading: "", content: "" };
  for (const line of body.split("\n")) {
    if (/^# /.test(line)) {
      parts.push(current);
      current = { heading: line, content: "" };
    } else {
      current.content += line + "\n";
    }
  }
  parts.push(current);
  return parts.filter((p, i) => i > 0 || p.content.trim() !== "");
}

export function escapeCell(text: string): string {
  return text.replace(/\|/g, "/").replace(/\n+/g, " ").trim();
}
