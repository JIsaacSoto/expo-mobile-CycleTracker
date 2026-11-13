import { useEffect, useState, type ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Circle, G, Path, Text as SvgText } from "react-native-svg";
import type { CycleLayout } from "@/types/cycle";
import { useAppTheme } from "@/theme";

interface Props {
  layout: CycleLayout;
  /** Today's cycle day (can exceed the length when the period is late). */
  cycleDay: number;
  size: number;
  animate?: boolean;
  /** Show the knob with today's day number. */
  showToday?: boolean;
  /** Content rendered in the middle of the ring. */
  children?: ReactNode;
  accessibilityLabel?: string;
}

const GAP_DEG = 1.2;

function polar(c: number, r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: c + r * Math.cos(rad), y: c + r * Math.sin(rad) };
}

function arcPath(c: number, r: number, startDeg: number, endDeg: number): string {
  const sweep = Math.min(endDeg - startDeg, 359.999);
  if (sweep <= 0) return "";
  const s = polar(c, r, startDeg);
  const e = polar(c, r, startDeg + sweep);
  const large = sweep > 180 ? 1 : 0;
  return `M ${s.x.toFixed(2)} ${s.y.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${e.x.toFixed(2)} ${e.y.toFixed(2)}`;
}

function useAnimatedDay(target: number, animate: boolean): number {
  const [value, setValue] = useState(animate ? 0.5 : target);
  useEffect(() => {
    if (!animate) {
      setValue(target);
      return;
    }
    let frame = 0;
    const from = 0.5;
    const start = Date.now();
    const duration = 900;
    const step = () => {
      const t = Math.min(1, (Date.now() - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(from + (target - from) * eased);
      if (t < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [target, animate]);
  return value;
}

/**
 * Circular cycle chart: one arc per phase (elapsed days solid, upcoming days faded),
 * an inner arc for the fertile window, the ovulation dot and today's marker.
 */
export default function CycleRing({
  layout,
  cycleDay,
  size,
  animate = true,
  showToday = true,
  children,
  accessibilityLabel,
}: Props) {
  const theme = useAppTheme();
  const { colors } = theme;
  const L = layout.cycleLength;
  const late = cycleDay > L;
  const day = useAnimatedDay(Math.min(cycleDay, L), animate);

  const c = size / 2;
  const stroke = Math.round(size * 0.085);
  const knob = Math.round(stroke * 0.72);
  const r = c - knob - 4;
  const innerR = r - stroke / 2 - 9;
  const degPerDay = 360 / L;
  const elapsedDeg = late ? 360 : day * degPerDay;

  const ovulationDeg = (layout.ovulationDay - 0.5) * degPerDay;
  const ovulationPos = polar(c, r, ovulationDeg);
  const todayDeg = late ? 360 - degPerDay / 2 : (day - 0.5) * degPerDay;
  const todayPos = polar(c, r, todayDeg);
  const knobLabel = late ? `+${Math.max(0, cycleDay - L - 1)}` : String(Math.max(1, Math.round(day)));
  const todayPhase =
    layout.phases.find((p) => Math.round(day) >= p.startDay && Math.round(day) <= p.endDay)?.phase ??
    "luteal";

  return (
    <View
      style={{ width: size, height: size }}
      accessible
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
    >
      <Svg width={size} height={size}>
        {/* Day ticks */}
        <G opacity={0.35}>
          {Array.from({ length: L }, (_, i) => {
            const p = polar(c, r - stroke / 2 - 2.5, (i + 0.5) * degPerDay);
            return <Circle key={i} cx={p.x} cy={p.y} r={0.9} fill={colors.onSurfaceVariant} />;
          })}
        </G>

        {layout.phases.map((segment) => {
          const start = (segment.startDay - 1) * degPerDay;
          const end = segment.endDay * degPerDay;
          const gap = end - start > GAP_DEG * 3 ? GAP_DEG : 0;
          const color = colors.phase[segment.phase].main;
          const elapsedEnd = Math.min(end, elapsedDeg);
          return (
            <G key={segment.phase}>
              <Path
                d={arcPath(c, r, start + gap, end - gap)}
                stroke={color}
                strokeOpacity={0.25}
                strokeWidth={stroke}
                fill="none"
              />
              {elapsedEnd > start + gap ? (
                <Path
                  d={arcPath(c, r, start + gap, Math.min(elapsedEnd, end - gap))}
                  stroke={color}
                  strokeWidth={stroke}
                  fill="none"
                />
              ) : null}
            </G>
          );
        })}

        {/* Fertile window */}
        <Path
          d={arcPath(
            c,
            innerR,
            (layout.fertileStartDay - 1) * degPerDay + 1,
            layout.fertileEndDay * degPerDay - 1
          )}
          stroke={colors.phase.fertile.main}
          strokeWidth={5}
          strokeLinecap="round"
          fill="none"
        />

        {/* Ovulation */}
        <Circle
          cx={ovulationPos.x}
          cy={ovulationPos.y}
          r={stroke * 0.24}
          fill={colors.surface}
          stroke={colors.phase.ovulation.main}
          strokeWidth={2.5}
        />

        {showToday ? (
          <G>
            <Circle
              cx={todayPos.x}
              cy={todayPos.y}
              r={knob + 2}
              fill={colors.background}
              opacity={0.9}
            />
            <Circle
              cx={todayPos.x}
              cy={todayPos.y}
              r={knob}
              fill={colors.surface}
              stroke={late ? colors.warning : colors.phase[todayPhase].main}
              strokeWidth={3}
            />
            <SvgText
              x={todayPos.x}
              y={todayPos.y + knob * (knobLabel.length > 2 ? 0.28 : 0.36)}
              fontSize={knob * (knobLabel.length > 2 ? 0.72 : 0.95)}
              fontWeight="700"
              fontFamily="sans-serif"
              fill={colors.onSurface}
              textAnchor="middle"
            >
              {knobLabel}
            </SvgText>
          </G>
        ) : null}
      </Svg>
      {children ? (
        <View style={[StyleSheet.absoluteFill, styles.center]} pointerEvents="box-none">
          <View style={{ width: innerR * 1.55, alignItems: "center" }}>{children}</View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: "center", justifyContent: "center" },
});
