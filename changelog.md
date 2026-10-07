# Changelog

## 2026-10-06 — Khởi tạo hệ thống, PART-01, PART-02, PART-03
### Khởi tạo
- Repo trước đó chỉ có `README.md`. Tạo `CLAUDE.md`, `system-status.yaml`, `decision-log.md`, `changelog.md`.

### PART-01 (tái tạo từ kết quả đã thống nhất trong phiên chat)
- brand/: `expert-profile.md`, `values-and-voice.md`, `market-segment.md`, `target-customer.md`, `customer-persona.md`
- products/: `rich-coenzyme-q10.md`, `dha-epa-sq.md`, `nattokinase-60000-fu.md`, `policosanol-10.md`, `product-need-evidence.md`, `missing-documents.md`
- compliance/: `claim-registry.md` (CLM-001..010, BAN-001..005, CLM-021..023), `claim-policy.md`, `human-review-list.md`
- sessions/PART-01/: `part-01-summary.md`, `brand-foundation-one-page.md`

### PART-02 (tái tạo từ kết quả đã thống nhất trong phiên chat)
- research/customer-language/`verbatims.md` (V-01..V-05); research/objections/`objections.md` (OBJ-01..03)
- strategy/: `customer-insights.md`, `positioning.md`, `value-proposition.md`, `big-idea.md`, `message-house.md`
- compliance/claim-registry.md: bổ sung CLM-011..020
- sessions/PART-02/: `part-02-summary.md`, `strategy-one-page.md`
- decision-log.md: C-01..C-12

### PART-03
- content/: `customer-journey.md`, `content-pillars.md`, `content-matrix.md`, `idea-bank.md`, `qa-checklist.md`
- content/templates/: `content-brief-template.md`, `script-short-template.md`, `script-value-template.md`, `script-sales-template.md`, `script-objection-template.md`, `vsl-template.md`
- sales/: `qualification.md`, `discovery-questions.md`, `objection-library.md`, `consultation-process.md`
- compliance/claim-registry.md: bổ sung CLM-024..026
- sessions/PART-03/: `part-03-summary.md`, `part-03-report.md`
- decision-log.md: D-011..D-019, C-13..C-24
- system-status.yaml: PART-03 deployed_with_review_constraints; PART-04 khóa (pending_review)

## 2026-10-06 — PART-04: MVP 3 Agent và quy trình vận hành
- Mới: `approval-policy.md`, `.gitignore` (private/)
- Mới: `agents/README.md`, `agents/agent-01-research-strategy.md`, `agents/agent-02-content-production.md`, `agents/agent-03-quality-sales.md`
- Mới: `.claude/agents/research-strategy.md`, `content-production.md`, `quality-sales.md`
- Mới: `.claude/commands/trang-thai.md`, `nghien-cuu.md`, `viet-kich-ban.md`, `kiem-duyet.md`, `chuan-bi-tu-van.md`
- Mới: `workflows/daily.md`, `weekly.md`, `video-production.md`, `review-approval.md`
- Mới: `templates/content-item.md`, `research-request.md`, `qa-report.md`, `consultation-prep.md`, `performance-log.md`
- Mới: `tools/check_content.py`; `tests/run_tests.py`; `tests/fixtures/` (dữ liệu giả lập)
- Mới: thư mục `content/items/`, `content/qa-reports/`, `research/reports/`
- Mới: `sessions/PART-04/part-04-report.md`, `sessions/PART-04/test-results/`
- Cập nhật: `README.md`, `CLAUDE.md` (bổ sung mục PART-04), `content/qa-checklist.md` (thêm liên kết PART-04), `decision-log.md` (D-020..D-025, C-25, C-26), `system-status.yaml`

## 2026-10-06 — PART-05: Dashboard local-first, Quality Gate, Model Router
- Mới: `package.json`, `package-lock.json`, `tsconfig.json`, `vite.config.ts`
- Mới: `app/shared/` (types, rules, lifecycle, frontmatter, markdown-table, script, compliance, quality, router, prompts)
- Mới: `app/server/` (repo, api, llm, vite-plugin); `app/cli/check.ts`
- Mới: `app/web/` (index.html, main.tsx, App.tsx, api.ts, styles.css, components/ui.tsx, 11 trang trong pages/)
- Mới: `app/tests/` (helpers, rules, quality, workflow — 37 test)
- Mới: `config/compliance-rules.json`, `config/model-router.json`
- Mới: `data/insights.json`, `data/data-sources.json`, `data/approvals.json`, `data/analytics.json`
- Mới: `workflows/optimization.md`, `sessions/PART-05/part-05-report.md`
- Cập nhật: `tools/check_content.py` (đọc luật chung, 13 trạng thái, chặn ngoài định vị và số liệu bịa), `tests/run_tests.py`
- Cập nhật: `approval-policy.md` (mục 7 vòng đời 13 trạng thái, mục 8 Quality Gate), `CLAUDE.md`, `README.md`, `.gitignore`
- Cập nhật: `agents/agent-02…`, `agents/agent-03…`, `templates/content-item.md`, `templates/qa-report.md`, `workflows/daily.md`, `workflows/review-approval.md`, `workflows/video-production.md`, `.claude/commands/kiem-duyet.md` (tên trạng thái mới)
- Cập nhật: `decision-log.md` (D-026..D-031, C-27, C-28), `system-status.yaml` (PART-05)
- Xóa khỏi git: `tools/__pycache__/` (file biên dịch Python bị commit nhầm ở PART-04)

## 2026-10-06 — Nghiên cứu insight RS-20261006-01
- Mới: `research/reports/RS-20261006-01.md` (5 insight đề xuất từ nghiên cứu thứ cấp, 16 nguồn)
- Cập nhật: `data/insights.json` thêm PINS-01..PINS-05 (HYPOTHESIS, chờ người duyệt)
- Cập nhật: `decision-log.md` thêm C-29, C-30

## 2026-10-07 — Kịch bản đầu tiên từ insight PINS-01
- Mới: `content/items/CI-20261007-01.md` (video giá trị, Appeal, P8, PINS-01) — Quality Gate kịch bản 100/100, brief 100/100, tuân thủ WARN (từ khóa "tê bì", không có tuyên bố sản phẩm). Trạng thái IDEA, chờ người duyệt brief.

## 2026-10-07 — Chốt độ tuổi 35–65, viết lại kịch bản CI-20261007-01
- `decision-log.md`: D-032 chốt độ tuổi 35–65 (giải quyết C-01)
- `brand/market-segment.md`, `brand/target-customer.md`: ghi chú cập nhật
- `content/items/CI-20261007-01.md`: viết lại cho nhóm 35–65 ("Lo cho cả nhà, còn sức khỏe của mình thì sao?"), xưng "anh chị", vẫn ở trạng thái IDEA

## 2026-10-07 — CI-20261007-01 bản v3
- Viết lại theo lối kể cảnh đời thường: tiêu đề "Lần cuối anh chị đi khám cho chính mình là khi nào?"; Quality Gate 100/100; vẫn IDEA

## 2026-10-07 — Kịch bản CI-20261007-02 (PINS-05, mất ngủ)
- Mới: `content/items/CI-20261007-02.md` — video giá trị, Aware, P6; Quality Gate 100/100; trạng thái IDEA

## 2026-10-07 — Kịch bản CI-20261007-03 (PINS-03, người tư vấn đáng tin)
- Mới: `content/items/CI-20261007-03.md` — video giá trị, Appeal, P3; Quality Gate 100/100; IDEA; có chỗ trống chứng chỉ (C-08) phải điền trước khi quay

## 2026-10-07 — Dựng video CI-20261007-01 (video-03)
- Mới: `content/video-edits/video-03/` (edl.json, transcript.json canh theo kịch bản + năng lượng giọng nói, script.txt, report.md). File video nằm ở `videos/` (không đưa lên git).
