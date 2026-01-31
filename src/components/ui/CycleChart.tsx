import {
  VictoryChart,
  VictoryPie,
  VictoryScatter,
  VictoryTheme,
  VictoryAxis,
} from "victory-native";

interface Props {
  text: string;
}

const periodLength = 5;
const cycleLength = 28;
const currentDay = 1;

const angle = (currentDay / cycleLength) * 360;

const CycleChart = ({ text }: Props) => (
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
        { x: 1, y: (periodLength * 100 / cycleLength), l: "Menstruation", fill: "#e3622a" },
        { x: 2, y: 21.42, l: "Proliferative Phase", fill: "#9cdee2" },
        { x: 3, y: 17.85, l: "Ovulation", fill: "#9ef66c" },
        { x: 4, y: 42.84, l: "Secretory Phase", fill: "#e8a7ae" },
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
      labels={({ datum }) => `${datum.l}`}
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
        { x: 180, y: 180, fill: "#5dcc70" }, // ovulation indicator
        { x: angle, y: 180, fill: "#2D7FF9" }, // actual day indicator
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

export default CycleChart;
