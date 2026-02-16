import React from "react";
import Chart from "react-apexcharts";
import type { ApexOptions } from "apexcharts";

type BarSeries = {
  name: string;
  data: number[];
};

type BarChartProps = {
  categories: string[];
  series: BarSeries[];
  height?: number;
};

const BarChart: React.FC<BarChartProps> = ({
  categories,
  series,
  height = 280,
}) => {
  const options: ApexOptions = {
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "bar",
      toolbar: { show: false },
      height,
    },
    plotOptions: {
      bar: { borderRadius: 6, columnWidth: "45%" },
    },
    dataLabels: { enabled: false },
    colors: ["#7A5AF8", "#0BA5EC"],
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
  };

  return (
    <div className="max-w-full overflow-x-auto custom-scrollbar">
      <div className="min-w-[600px]">
        <Chart options={options} series={series} type="bar" height={height} />
      </div>
    </div>
  );
};

export default BarChart;
