import { useState, useEffect } from "react";
import {
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Line,
  ResponsiveContainer
} from "recharts";

import { LdSlider,LdTabs,LdTablist,LdTab} from "@emdgroup-liquid/liquid/dist/react";

// Sample data from your JSON format
import SimulationResultData from "./SimulationChart.json";

import "./barChart.css";

// Format month for XAxis
const monthTickFormatter = (tick: number) => {
  const date = new Date(tick);
  const month = date.getMonth();
  const monthNames = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];
  return monthNames[month];
};

// Main App Component
export default function App() {
  const [yearRange, setYearRange] = useState<number[]>([2024, 2025]);
  const [filteredData, setFilteredData] = useState(SimulationResultData.capacityData);

  useEffect(() => {
    const startYear = yearRange[0];
    const endYear = yearRange[1];
    const filtered = SimulationResultData.capacityData.filter(item => {
      const date = new Date(item.DATE);
      const year = date.getFullYear();
      return year >= startYear && year <= endYear;
    });
    setFilteredData(filtered);
  }, [yearRange]);

  const handleSliderChange = (value: any) => {
    setYearRange(value.detail);
  };

  return (
    <div className="w-full">
        <div className="flex justify-between">
        <div className="p-2 chartMetric" style={{ width: '50%' }}>
            <div className="m-4">
            <LdTabs>
                <LdTablist size="sm" rounded="all">
                <LdTab selected>Hours</LdTab>
                <LdTab>Quantity</LdTab>
                <LdTab>Batches</LdTab>
                </LdTablist>
            </LdTabs>
            </div>
            <div className="m-4">
            <LdTabs>
                <LdTablist size="sm">
                <LdTab selected>Months</LdTab>
                <LdTab>Quarters</LdTab>
                <LdTab>Years</LdTab>
                </LdTablist>
            </LdTabs>
            </div>
        </div>
        <div className="p-2" style={{ width: '50%' }}>
            <LdSlider 
            width="35rem" 
            indicators 
            unit=" Year" 
            min={2023} 
            max={2027}  
            swappable 
            stops="2024,2025,2026" 
            value={`${yearRange[0]},${yearRange[1]}`} 
            onLdchange={(CustomEvent) => handleSliderChange(CustomEvent)}
            />
        </div>
        </div>
        <div className="w-full charResponsive">
        <ResponsiveContainer width="100%" height={300}>
            <ComposedChart
            data={filteredData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
            <CartesianGrid vertical={false} horizontal={false} strokeDasharray="0" />
            <XAxis tickLine={false} padding={{ left: 20 }} dataKey="DATE" tickFormatter={monthTickFormatter} />
            <YAxis label={{ value: "HOURS", angle: -90, position: 'insideLeft' }} axisLine={false} ticks={[100, 300, 500, 700]} tickLine={false} />
            <Tooltip />
            <Legend 
                layout="horizontal" 
                verticalAlign="top" 
                align="right" 
                wrapperStyle={{ paddingTop: '10px' }} 
            />
            {/* Bar components */}
            <Bar legendType="circle" name="Extra Hours" dataKey="EXTRA_HOURS" stackId="a" fill="#1d7c2b" />
            <Bar legendType="circle" name="Load" dataKey="LOAD" stackId="a" fill="#3bab4b" />
            {/* Line components */}
            <Line legendType="circle" name="Actual Capacity" dataKey="ACTUAL_CAPACITY" stroke="#f71906" dot={false} />
            <Line legendType="circle" name="Optimal Capacity" dataKey="OPTIMAL_CAPACITY" stroke="#a4449e" strokeDasharray="5 5" dot={false} />
            <Line legendType="circle" name="Min Capacity" dataKey="MIN_CAPACITY" stroke="#020003" dot={false} />
            <Line legendType="circle" name="Max Capacity" dataKey="MAX_CAPACITY" stroke="#7f7e81" dot={false} />
            </ComposedChart>
        </ResponsiveContainer>
        </div>
    </div>
  );
}


