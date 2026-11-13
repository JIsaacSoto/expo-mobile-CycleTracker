export interface ChartSection {
  x: number;
  y: number;
  l: string;
  fill: string;
}

export interface CycleChartData {
  sections: ChartSection[];

  currentDayAngle: number;
  ovulationAngle: number;

  ovulationDay: number;
  follicularLength: number;
}

export function getCycleChartData(
  cycleLength: number,
  periodLength: number,
  currentDay: number
): CycleChartData {

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

  const ovulationDay =
    cycleLength - lutealLength - Math.floor(fertileWindow / 2);

  const follicularLength =
    ovulationDay -
    fertileWindow -
    periodLength;

  const currentDayAngle = (currentDay / cycleLength) * 360;
  const ovulationAngle = ((ovulationDay - 0.5) / cycleLength) * 360;

  const toPercent = (days: number) =>
    (days / cycleLength) * 100;

  const sections = [
    {
      x: 1,
      y: toPercent(periodLength),
      l: "Menstruation",
      fill: "#e3622a",
    },
    {
      x: 2,
      y: toPercent(follicularLength),
      l: "Proliferative Phase (Follicular)",
      fill: "#9cdee2",
    },
    {
      x: 3,
      y: toPercent(fertileWindow),
      l: "Ovulation",
      fill: "#9ef66c",
    },
    {
      x: 4,
      y: toPercent(lutealLength),
      l: "Secretory Phase (Luteal)",
      fill: "#e8a7ae",
    },
  ];

  return {
    sections,
    currentDayAngle,
    ovulationAngle,
    ovulationDay,
    follicularLength
  };
}