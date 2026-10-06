import Anthropic from "@anthropic-ai/sdk";

/**
 * Gọi Claude qua API cho tầng 2/3 của Model Router.
 * Tên model do router truyền vào (lấy từ biến môi trường), không ghi cứng trong code.
 * API key đọc từ ANTHROPIC_API_KEY (môi trường máy hoặc .env.local) — không lưu trong source.
 */
export async function callModel(model: string, system: string, user: string): Promise<string> {
  const client = new Anthropic();
  const response = await client.messages.create({
    model,
    max_tokens: 16000,
    system,
    messages: [{ role: "user", content: user }],
  });
  if (response.stop_reason === "refusal") {
    return "[Mô hình từ chối yêu cầu này. Hãy làm thủ công bằng Manual Claude Task.]";
  }
  const text = response.content.map((b) => (b.type === "text" ? b.text : "")).join("").trim();
  if (response.stop_reason === "max_tokens") return `${text}\n\n[Bản nháp bị cắt do giới hạn độ dài — cần làm lại hoặc rút gọn yêu cầu.]`;
  return text;
}
