export interface TierConfig {
  name: string;
  enabled: boolean;
  modelEnv?: string;
}

export interface RouterConfig {
  tiers: Record<string, TierConfig>;
  tasks: Record<string, number>;
  humanOnlyTasks: string[];
}

export interface RouteDecision {
  task: string;
  tier: 0 | 1 | 2 | 3 | null;
  model?: string;
  reason: string;
}

/**
 * Model Router: Tầng 0 (logic) → Tầng 1 (Manual Claude Task) → Tầng 2/3 (API).
 * - Không bao giờ giao việc phê duyệt cho AI (humanOnlyTasks → tier null).
 * - Tầng 2/3 chỉ dùng khi bật trong config VÀ có tên model trong biến môi trường VÀ có API key.
 *   Nếu thiếu, rơi về Tầng 1 (copy prompt vào Claude Code).
 * - Tên model không ghi trong code.
 */
export function route(task: string, cfg: RouterConfig, env: Record<string, string | undefined>): RouteDecision {
  if (cfg.humanOnlyTasks.includes(task)) {
    return { task, tier: null, reason: "Việc chỉ con người được làm (Human-in-the-loop)" };
  }
  const preferred = cfg.tasks[task];
  if (preferred === undefined) return { task, tier: 1, reason: "Việc chưa khai báo trong router → mặc định Manual Claude Task" };
  if (preferred === 0) return { task, tier: 0, reason: "Xử lý bằng logic (không gọi AI)" };
  if (preferred === 1) return { task, tier: 1, reason: "Manual Claude Task theo cấu hình" };
  const tryTier = (t: 2 | 3): RouteDecision | null => {
    const tc = cfg.tiers[String(t)];
    if (!tc?.enabled) return null;
    const model = tc.modelEnv ? env[tc.modelEnv]?.trim() : undefined;
    if (!model) return null;
    if (!env.ANTHROPIC_API_KEY?.trim()) return null;
    return { task, tier: t, model, reason: `Gọi API tầng ${t} (model từ biến ${tc.modelEnv})` };
  };
  const order: (2 | 3)[] = preferred === 3 ? [3, 2] : [2, 3];
  for (const t of order) {
    const d = tryTier(t);
    if (d) return d;
  }
  return { task, tier: 1, reason: `Tầng ${preferred} chưa bật hoặc thiếu tên model/API key → dùng Manual Claude Task` };
}

/** Trạng thái cấu hình từng tầng — không bao giờ trả về giá trị API key. */
export function routerStatus(cfg: RouterConfig, env: Record<string, string | undefined>) {
  return Object.entries(cfg.tiers).map(([tier, tc]) => {
    const modelSet = tc.modelEnv ? !!env[tc.modelEnv]?.trim() : undefined;
    const keySet = !!env.ANTHROPIC_API_KEY?.trim();
    const usable = tier === "0" || tier === "1" ? tc.enabled : tc.enabled && !!modelSet && keySet;
    return { tier: Number(tier), name: tc.name, enabled: tc.enabled, modelEnv: tc.modelEnv, modelSet, keySet: tier >= "2" ? keySet : undefined, usable };
  });
}
