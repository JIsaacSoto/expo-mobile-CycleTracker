import {
  VictoryChart,
  VictoryPie,
  VictoryScatter,
  VictoryTheme,
  VictoryAxis,
} from "victory-native";
import { useCycle } from "@/hooks/useCycle";

interface Props {
  text: string;
}

const CycleChart = ({ text }: Props) => {
  const { cycle } = useCycle();

  const periodLength = cycle.periodLength;
  const cycleLength = cycle.cycleLength;

  const currentDay = 15; // Placeholder for current day

  const lutealLength =
    Math.round(
      10 +
      ((cycleLength - 21) / (44 - 21)) * 4
    );

  const fertileWindow =
  Math.max(
    3,
    6 - Math.floor(periodLength / 3)
  );

  const fertileEnd =
    cycleLength - lutealLength;

  const ovulationDay =
    fertileEnd - (fertileWindow - 1) / 2;

  const follicularLength =
    ovulationDay -
    fertileWindow -
    periodLength;

  const currentDayAngle = (currentDay / cycleLength) * 360;
  const ovulationAngle = ((ovulationDay - 0.5) / cycleLength) * 360;

  const toPercent = (days: number) =>
    (days / cycleLength) * 100;

  return (
    <VictoryChart
      polar
      theme={VictoryTheme.material}
      domain={{ x: [360, 0] }}
      startAngle={105}
      endAngle={460}
      height={365}
    >
      <VictoryAxis
        style={{
          axis: { stroke: "none" },
          ticks: { stroke: "none" },
          tickLabels: { fill: "none" },
          grid: { stroke: "none" },
        }}
      />
      <VictoryPie
        data={[
          { x: 1, y: toPercent(periodLength), l: "Menstruation", fill: "#e3622a" },
          { x: 2, y: toPercent(follicularLength), l: "Proliferative Phase (Follicular)", fill: "#9cdee2" },
          { x: 3, y: toPercent(fertileWindow), l: "Ovulation", fill: "#9ef66c" },
          { x: 4, y: toPercent(lutealLength), l: "Secretory Phase (Luteal)", fill: "#e8a7ae" },
        ]}
        style={{
          data: {
            fill: ({ datum }) => datum.fill,
            opacity: 1,
            stroke: "transparent",
          },
          labels: {
            fill: "#000",
            fontSize: 12,
          },
        }}
        labels={({ datum }) => datum.l}
        labelPlacement="perpendicular"
        labelRadius={160}
        radius={145}
        cornerRadius={20}
        startAngle={-5}
        innerRadius={120}
      />
      <VictoryScatter
        polar
        data={[
          { x: ovulationAngle, y: 180, fill: "#5dcc70" }, // ovulation indicator
          { x: currentDayAngle, y: 180, fill: "#2D7FF9" }, // current day indicator
        ]}
        size={18}
        style={{
          data: {
            fill: ({ datum }) => datum.fill,
          },
        }}
      />
    </VictoryChart>
  );
};

export default CycleChart;
