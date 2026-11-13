import { StyleSheet, View } from "react-native";
import { Icon, Text } from "react-native-paper";
import SectionCard from "@/components/ui/SectionCard";
import { capitalize, useI18n } from "@/i18n";
import type { CycleStatus, UpcomingEvent, UpcomingEventType } from "@/types/cycle";
import { useAppTheme, type PhaseColorKey } from "@/theme";

const META: Partial<Record<UpcomingEventType, { icon: string; color: PhaseColorKey }>> = {
  periodStart: { icon: "water", color: "menstrual" },
  fertileStart: { icon: "flower-outline", color: "fertile" },
  ovulation: { icon: "egg-outline", color: "ovulation" },
  follicularStart: { icon: "sprout-outline", color: "follicular" },
  lutealStart: { icon: "moon-waning-crescent", color: "luteal" },
};

const KEY_EVENTS: UpcomingEventType[] = ["periodStart", "fertileStart", "ovulation"];
const PHASE_EVENTS: UpcomingEventType[] = ["follicularStart", "lutealStart"];

/**
 * Next period, fertile window and ovulation are always listed; the next phase
 * change completes the list. Sorted by date.
 */
export function pickUpcoming(events: UpcomingEvent[]): UpcomingEvent[] {
  const out: UpcomingEvent[] = [];
  for (const type of KEY_EVENTS) {
    const event = events.find((e) => e.type === type);
    if (event) out.push(event);
  }
  const phaseChange = events.find((e) => PHASE_EVENTS.includes(e.type));
  if (phaseChange) out.push(phaseChange);
  return out.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}

export default function UpcomingCard({ status }: { status: CycleStatus }) {
  const theme = useAppTheme();
  const { t, formatDate } = useI18n();
  const events = pickUpcoming(status.upcoming);

  return (
    <SectionCard title={t("upcoming.title")} icon="calendar-arrow-right" iconColor={theme.colors.primary}>
      {events.length === 0 ? (
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
          {t("upcoming.empty")}
        </Text>
      ) : (
        events.map((event) => {
          const meta = META[event.type]!;
          const color = theme.colors.phase[meta.color];
          const when =
            event.daysAway === 0
              ? t("common.today")
              : event.daysAway === 1
                ? t("common.tomorrow")
                : t("common.inDays", { count: event.daysAway });
          return (
            <View key={`${event.type}-${event.date}`} style={styles.row}>
              <View style={[styles.icon, { backgroundColor: color.container }]}>
                <Icon source={meta.icon} size={20} color={color.main} />
              </View>
              <View style={{ flex: 1 }}>
                <Text variant="titleSmall">{t(`upcoming.${event.type}`)}</Text>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  {capitalize(formatDate(event.date, "long"))}
                </Text>
              </View>
              <Text variant="labelLarge" style={{ color: theme.colors.primary }}>
                {capitalize(when)}
              </Text>
            </View>
          );
        })
      )}
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 4 },
  icon: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
});
