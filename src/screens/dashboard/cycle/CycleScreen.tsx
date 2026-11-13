import { useState } from "react";
import { ScrollView, View } from "react-native";
import { Snackbar, Text } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import ScreenHeader from "@/components/ui/ScreenHeader";
import SectionCard from "@/components/ui/SectionCard";
import SystemThemeBanner from "@/components/ui/SystemThemeBanner";
import ThemeToggle from "@/components/ui/ThemeToggle";
import Button from "@/components/ui/Button";
import StatusRingCard from "@/components/cycle/StatusRingCard";
import PendingPeriodCard from "@/components/cycle/PendingPeriodCard";
import FertilityCard from "@/components/cycle/FertilityCard";
import PhaseInfoCard from "@/components/cycle/PhaseInfoCard";
import UpcomingCard from "@/components/cycle/UpcomingCard";
import StatsCard from "@/components/cycle/StatsCard";
import PeriodDialog from "@/components/cycle/PeriodDialog";
import LogSummary from "@/components/log/LogSummary";
import LoadingScreen from "@/components/ui/LoadingScreen";
import { useCycle } from "@/hooks/useCycle";
import { useI18n } from "@/i18n";
import { useAppTheme } from "@/theme";
import { styles } from "./CycleScreen.styles";

export default function CycleScreen() {
  const theme = useAppTheme();
  const { t, formatDate } = useI18n();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { status, today, data, addPeriod } = useCycle();
  const [logPeriodOpen, setLogPeriodOpen] = useState(false);
  const [snack, setSnack] = useState<string | null>(null);

  if (!status) return <LoadingScreen />;

  const todayLog = data.logs[today];
  const openToday = () => router.push({ pathname: "/log/[date]", params: { date: today } });

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 8 }]}>
        <ScreenHeader
          subtitle={t("cycle.todayDate", { date: formatDate(today, "long") })}
          title={t("stats.title")}
          right={<ThemeToggle />}
        />
        <SystemThemeBanner />

        <PendingPeriodCard status={status} onLogPeriod={() => setLogPeriodOpen(true)} />

        <StatusRingCard
          status={status}
          hasTodayLog={!!todayLog}
          onLogPeriod={() => setLogPeriodOpen(true)}
          onLogToday={openToday}
        />

        <FertilityCard status={status} />
        <PhaseInfoCard status={status} />
        <UpcomingCard status={status} />

        <SectionCard title={t("todayLog.title")} icon="notebook-outline" iconColor={theme.colors.primary}>
          {todayLog ? (
            <LogSummary log={todayLog} />
          ) : (
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              {t("todayLog.empty")}
            </Text>
          )}
          <Button
            mode="contained-tonal"
            icon="notebook-edit-outline"
            text={todayLog ? t("cycle.editToday") : t("cycle.logToday")}
            onPress={openToday}
          />
        </SectionCard>

        <StatsCard stats={status.stats} />

        <Text variant="bodySmall" style={[styles.disclaimer, { color: theme.colors.onSurfaceVariant }]}>
          {t("disclaimer.short")}
        </Text>
      </ScrollView>

      <PeriodDialog
        visible={logPeriodOpen}
        showLength={false}
        onDismiss={() => setLogPeriodOpen(false)}
        onSubmit={(date) => {
          addPeriod(date);
          setLogPeriodOpen(false);
          setSnack(t("logPeriod.saved", { date: formatDate(date, "medium") }));
        }}
      />
      <Snackbar visible={!!snack} onDismiss={() => setSnack(null)} duration={2500}>
        {snack ?? ""}
      </Snackbar>
    </View>
  );
}
