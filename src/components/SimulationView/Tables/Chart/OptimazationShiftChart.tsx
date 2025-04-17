import React from 'react';
import {
    ComposedChart,
    Bar,
    Area,
    XAxis,
    YAxis,
    Tooltip,
    TooltipProps,
    Legend,
    CartesianGrid,
    ResponsiveContainer
} from 'recharts';

interface ShiftChartProps {
    data: Array<{
        date: string;
        first_shift_per_weekday: number;
        second_shift_per_weekday: number;
        third_shift_per_weekday: number;
        first_shift_per_saturday: number;
        first_shift_per_sunday: number;
        second_shift_per_saturday: number;
        second_shift_per_sunday: number;
        third_shift_per_saturday: number;
        third_shift_per_sunday: number;
        optimal_shift: number;
    }>;
}

interface CustomTooltipProps {
    active :any
    payload : any
    label : any
 }

const monthTickFormatter = (tick: any) => {
    const date = new Date(tick);
    const month = date.getMonth();
    const monthNames = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];
    return monthNames[month];
  };
  
const yearTickFormatter = (tick:any) => {
    const date = new Date(tick);
    return isNaN(date.getFullYear()) ? '0' : String(date.getFullYear());
};


const CustomTooltip: React.FC<TooltipProps<any, any>> = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div style={{
                backgroundColor: 'white',
                border: '1px solid #ccc',
                padding: '10px',
                borderRadius: '5px',
                zIndex: 1000, // Set z-index here
                position: 'relative' // Ensure it can respect z-index
            }}>
                <p>{label}</p>
                {payload.map((entry : any, index:number) => (
                    <p key={`item-${index}`} style={{ color: entry.color }}>
                        {entry.name}: {entry.value}
                    </p>
                ))}
            </div>
        );
    }

    return null;
};

const ShiftChart: React.FC<ShiftChartProps> = React.memo(({ data }) => {
    return (
        <ResponsiveContainer width="100%" height={400}>
            <ComposedChart
                data={data}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
                <CartesianGrid vertical={false} horizontal={false} strokeDasharray="0" />
                <XAxis 
                        padding={{ left: 20, right: 20 }} 
                        tickLine={false} 
                        dataKey='date' 
                        tickFormatter={monthTickFormatter} 
                        tick={{ fontSize: 11, fontWeight: 600 }} // Set font size and weight
                    />
                  
                  {/* X Axis for Years */}
                  <XAxis 
                      dataKey='date' 
                      tickLine={false} 
                      axisLine={{ stroke: '#808080' }} // Set the axis line color to gray
                      orientation="bottom" 
                      interval={0} // Adjust this based on your data
                      tickFormatter={yearTickFormatter} 
                      tick={{ fontSize: 11, fontWeight: 600 }}
                      xAxisId='year' // Ensure it's unique
                  />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                    layout='horizontal' 
                    verticalAlign='top'
                    align='center'
                    wrapperStyle={{                       
                        textAlign: 'center', // Center the text
                        width: '100%', 
                        paddingTop: '10px',
                        paddingBottom: '20px',
                        fontWeight:'500',
                    }} 
                />
                
                <Bar legendType="circle" name="First shift per weekday" dataKey="first_shift_per_weekday" stackId="a" fill="#72CA9B" />
                <Bar legendType="circle" name="Second shift per weekday" dataKey="second_shift_per_weekday" stackId="a" fill="#32A467" />
                <Bar legendType="circle" name="Third shift per weekday" dataKey="third_shift_per_weekday" stackId="a" fill="#238551" />
                <Bar legendType="circle" name="First shift per Saturday" dataKey="first_shift_per_saturday" stackId="a" fill="#FA999C" />
                <Bar legendType="circle" name="First shift per Sunday" dataKey="first_shift_per_sunday" stackId="a" fill="#E76A6E" />
                <Bar legendType="circle" name="Second shift per Saturday" dataKey="second_shift_per_saturday" stackId="a" fill="#CD4246" />
                <Bar legendType="circle" name="Second shift per Sunday" dataKey="second_shift_per_sunday" stackId="a" fill="#AC2F33" />
                <Bar legendType="circle" name="Third shift per Saturday" dataKey="third_shift_per_saturday" stackId="a" fill="#8E292C" />
                <Bar legendType="circle" name="Third shift per Sunday" dataKey="third_shift_per_sunday" stackId="a" fill="#731E21" />
                <Area legendType="circle" name="Optimal Shifts" dataKey="optimal_shift" stroke="black" fill="rgba(100, 100, 100, 0.5)" dot={false} strokeWidth={2} />
                <Area legendType="circle" name="Actual Shifts" dataKey="capacity_shift" stroke="#184A90" fill="rgba(191, 191, 191, 0.1)" dot={false} strokeWidth={2} />
            </ComposedChart>
        </ResponsiveContainer>
    );
});

// Optionally, you can define a custom comparison function if needed
// const areEqual = (prevProps: ShiftChartProps, nextProps: ShiftChartProps) => {
//     return JSON.stringify(prevProps.data) === JSON.stringify(nextProps.data);
// };

// const ShiftChart = React.memo(({ data }: ShiftChartProps) => { ... }, areEqual);

export default ShiftChart;
