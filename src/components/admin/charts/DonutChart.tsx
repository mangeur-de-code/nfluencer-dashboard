import React from "react";
import Chart from "react-apexcharts";
import type { ApexOptions } from "apexcharts";

type DonutChartProps = {
  labels: string[];
  series: number[];
  height?: number;
};

const DonutChart: React.FC<DonutChartProps> = ({
  labels,
  series,
  height = 280,
}) => {
  const options: ApexOptions = {
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "donut",
    },
    labels,
    legend: { position: "bottom" },
    colors: ["#465FFF", "#0BA5EC", "#F79009", "#12B76A"],
    dataLabels: { enabled: false },
    stroke: { width: 0 },
  };

  return <Chart options={options} series={series} type="donut" height={height} />;
};

export default DonutChart;
