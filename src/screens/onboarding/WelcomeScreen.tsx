import { useRef, useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import { Checkbox, Icon, SegmentedButtons, Text } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { images } from "@/assets";
import Button from "@/components/ui/Button";
import CycleRing from "@/components/cycle/CycleRing";
import { usePreferences } from "@/hooks/usePreferences";
import { resolveLanguage, useI18n } from "@/i18n";
import { getCycleLayout } from "@/lib/cycle";
import { useAppTheme } from "@/theme";

const SAMPLE_LAYOUT = getCycleLayout(28, 5, 14);

export default function WelcomeScreen() {
  const theme = useAppTheme();
  const { t } = useI18n();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { preferences, updatePreferences } = usePreferences();
  const scrollRef = useRef<ScrollView>(null);
  const [index, setIndex] = useState(0);
  const [accepted, setAccepted] = useState(preferences.disclaimerAccepted);

  const slides = [
    {
      key: "welcome",
      title: t("onboarding.slides.welcomeTitle"),
      body: t("onboarding.slides.welcomeBody"),
      visual: <Image source={images.icon} style={styles.logo} resizeMode="contain" />,
    },
    {
      key: "accuracy",
      title: t("onboarding.slides.accuracyTitle"),
      body: t("onboarding.slides.accuracyBody"),
      visual: <CycleRing layout={SAMPLE_LAYOUT} cycleDay={12} size={Math.min(220, width * 0.6)} />,
    },
    {
      key: "privacy",
      title: t("onboarding.slides.privacyTitle"),
      body: t("onboarding.slides.privacyBody"),
      visual: (
        <View style={[styles.iconCircle, { backgroundColor: theme.colors.primaryContainer }]}>
          <Icon source="shield-lock-outline" size={84} color={theme.colors.primary} />
        </View>
      ),
    },
    {
      key: "disclaimer",
      title: t("onboarding.slides.disclaimerTitle"),
      body: t("disclaimer.full"),
      visual: (
        <View style={[styles.iconCircle, { backgroundColor: theme.colors.tertiaryContainer }]}>
          <Icon source="stethoscope" size={84} color={theme.colors.tertiary} />
        </View>
      ),
    },
  ];
  const last = slides.length - 1;

  const goTo = (i: number) => {
    scrollRef.current?.scrollTo({ x: i * width, animated: true });
    setIndex(i);
  };

  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    setIndex(Math.round(e.nativeEvent.contentOffset.x / width));
  };

  const start = () => {
    updatePreferences({ disclaimerAccepted: true });
    router.push("/onboarding/setup");
  };

  const language = resolveLanguage(preferences.language);

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.colors.background, paddingTop: insets.top + 8, paddingBottom: insets.bottom + 16 },
      ]}
    >
      <View style={styles.topBar}>
        <SegmentedButtons
          density="small"
          style={styles.language}
          value={language}
          onValueChange={(value) => updatePreferences({ language: value as "es" | "en" })}
          buttons={[
            { value: "es", label: "ES", accessibilityLabel: t("language.es") },
            { value: "en", label: "EN", accessibilityLabel: t("language.en") },
          ]}
        />
        {index < last ? (
          <Button mode="text" compact text={t("common.skip")} onPress={() => goTo(last)} />
        ) : (
          <View style={{ height: 40 }} />
        )}
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScrollEnd}
        onScroll={(e) => {
          const i = Math.round(e.nativeEvent.contentOffset.x / width);
          if (i !== index) setIndex(i);
        }}
        scrollEventThrottle={64}
        style={styles.pager}
      >
        {slides.map((slide, i) => (
          <ScrollView
            key={slide.key}
            style={{ width }}
            contentContainerStyle={styles.slide}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.visual}>{slide.visual}</View>
            <Text variant="headlineSmall" style={[styles.title, { color: theme.colors.onBackground }]}>
              {slide.title}
            </Text>
            <Text variant="bodyLarge" style={[styles.body, { color: theme.colors.onSurfaceVariant }]}>
              {slide.body}
            </Text>
            {i === last ? (
              <View style={[styles.accept, { backgroundColor: theme.colors.elevation.level2 }]}>
                <Checkbox.Item
                  label={t("onboarding.slides.disclaimerAccept")}
                  status={accepted ? "checked" : "unchecked"}
                  onPress={() => setAccepted((v) => !v)}
                  position="leading"
                  labelVariant="bodyMedium"
                  labelStyle={styles.acceptLabel}
                  style={styles.acceptItem}
                />
              </View>
            ) : null}
          </ScrollView>
        ))}
      </ScrollView>

      <View style={styles.dots} accessibilityRole="progressbar">
        {slides.map((s, i) => (
          <View
            key={s.key}
            style={[
              styles.dot,
              {
                width: i === index ? 22 : 8,
                backgroundColor: i === index ? theme.colors.primary : theme.colors.outlineVariant,
              },
            ]}
          />
        ))}
      </View>

      <View style={styles.footer}>
        {index < last ? (
          <Button text={t("common.next")} icon="arrow-right" onPress={() => goTo(index + 1)} />
        ) : (
          <Button text={t("onboarding.start")} disabled={!accepted} onPress={start} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  language: { width: 132 },
  pager: { flex: 1 },
  slide: { flexGrow: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 28, paddingVertical: 16 },
  visual: { minHeight: 230, alignItems: "center", justifyContent: "center", marginBottom: 24 },
  logo: { width: 220, height: 220 },
  iconCircle: { width: 168, height: 168, borderRadius: 84, alignItems: "center", justifyContent: "center" },
  title: { textAlign: "center", fontWeight: "700", marginBottom: 12 },
  body: { textAlign: "center", lineHeight: 24, maxWidth: 420 },
  accept: { marginTop: 24, borderRadius: 16, alignSelf: "stretch" },
  acceptItem: { paddingVertical: 10 },
  acceptLabel: { textAlign: "left" },
  dots: { flexDirection: "row", justifyContent: "center", gap: 6, marginVertical: 16 },
  dot: { height: 8, borderRadius: 4 },
  footer: { paddingHorizontal: 24 },
});
