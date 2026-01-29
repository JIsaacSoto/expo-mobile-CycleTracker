import { VictoryPie } from "victory-native";

interface Props {
  text: string;
}

const CycleChart = ({ text }: Props) => (
  <VictoryPie
    standalone={true}
    data={[
      { x: 1, y: 17.85, l: "Menstruation", fill: "#e3622a" },
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
    radius={145}
    cornerRadius={20}
    startAngle={-6}
    innerRadius={120}
  />
);

export default CycleChart;
