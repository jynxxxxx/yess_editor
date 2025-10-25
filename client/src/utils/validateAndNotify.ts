// utils/validateAndNotify.ts
import { validateInput } from "./validateInput";

export function validateAndNotify(text: string): boolean {
  const result = validateInput(text);

  if (!result.valid) {
    // Display the message to the user in a toast, alert, or inline UI
    // Here is a simple example using alert; replace with your preferred UI
    alert(result.message || "입력이 유효하지 않습니다.");
    return false;
  }

  return true;
}
