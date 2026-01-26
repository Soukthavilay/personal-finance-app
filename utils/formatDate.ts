import dayjs from "dayjs";
import "dayjs/locale/vi";

import type { DateFormat, Language } from "@/stores/settingsStore";

export function formatDate(
  date: string | Date,
  dateFormat: DateFormat,
  language: Language,
): string {
  dayjs.locale(language);
  return dayjs(date).format(dateFormat);
}
