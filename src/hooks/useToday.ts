import { useEffect, useState } from "react";
import { AppState } from "react-native";
import { todayISO, type ISODate } from "@/lib/dates";

/** Today's local date; updates at midnight and when the app returns to the foreground. */
export function useToday(): ISODate {
  const [today, setToday] = useState<ISODate>(() => todayISO());

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const schedule = () => {
      const now = new Date();
      const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 5);
      timer = setTimeout(() => {
        setToday(todayISO());
        schedule();
      }, nextMidnight.getTime() - now.getTime());
    };
    schedule();
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") setToday(todayISO());
    });
    return () => {
      clearTimeout(timer);
      subscription.remove();
    };
  }, []);

  return today;
}
