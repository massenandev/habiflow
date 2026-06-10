import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { Habit } from "../domain/types";

export async function exportHabitPdf(habit: Habit, month: number, year: number): Promise<string> {
  const daysInMonth = new Date(year, month, 0).getDate();
  const cells = Array.from({ length: daysInMonth }, (_, index) => `<td>${index + 1}<br/><span class="box"></span></td>`).join("");
  const html = `
    <html>
      <head>
        <style>
          body { font-family: Helvetica, Arial, sans-serif; padding: 32px; color: #111827; }
          h1 { font-size: 28px; margin-bottom: 4px; }
          table { width: 100%; border-collapse: collapse; margin-top: 24px; }
          td { border: 1px solid #CBD5E1; width: 14%; height: 72px; text-align: center; vertical-align: middle; }
          .box { display: inline-block; width: 22px; height: 22px; border: 2px solid ${habit.color}; border-radius: 999px; margin-top: 8px; }
        </style>
      </head>
      <body>
        <h1>${habit.emoji || "✅"} ${escapeHtml(habit.name)}</h1>
        <div>${year}-${String(month).padStart(2, "0")} printable tracker</div>
        <table><tr>${cells}</tr></table>
      </body>
    </html>`;
  const result = await Print.printToFileAsync({ html });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(result.uri);
  }
  return result.uri;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char]!);
}
