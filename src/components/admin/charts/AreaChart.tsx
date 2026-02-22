import React from "react";
import Chart from "react-apexcharts";
import type { ApexOptions } from "apexcharts";

type AreaChartSeries = {
  name: string;
  data: number[];
};

type AreaChartProps = {
  categories: string[];
  series: AreaChartSeries[];
  height?: number;
};

const AreaChart: React.FC<AreaChartProps> = ({
  categories,
  series,
  height = 280,
}) => {
  const options: ApexOptions = {
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "area",
      toolbar: { show: false },
      height,
    },
    stroke: { curve: "smooth", width: 2 },
    dataLabels: { enabled: false },
    colors: ["#465FFF", "#9CB9FF", "#F79009"],
    xaxis: {
      categories,
      labels: {
        style: { colors: "#6B7280", fontSize: "12px" },
      },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      labels: {
        style: { colors: "#6B7280", fontSize: "12px" },
      },
    },
    grid: {
      strokeDashArray: 4,
      borderColor: "#E5E7EB",
    },
    tooltip: { shared: true, intersect: false },
    fill: {
      type: "gradient",
      gradient: {
        opacityFrom: 0.35,
        opacityTo: 0,
      },
    },
  };

  return (
    <div className="max-w-full overflow-x-auto custom-scrollbar">
      <div className="min-w-[600px]">
        <Chart options={options} series={series} type="area" height={height} />
      </div>
    </div>
  );
};

export default AreaChart;
