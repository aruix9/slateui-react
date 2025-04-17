import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from "axios";
import { display_notification } from '../../../global/notification'; 
import {
    ComposedChart,
    Bar,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from "recharts";

import "./optimazationResult.css"
import { LdIcon,LdLoading, LdTypo, LdTabs, LdTablist, LdTab, LdTabpanellist, LdTabpanel, LdTable, LdTableHead, LdTableHeader, LdTableRow, LdTableBody, LdTableCell } from "@emdgroup-liquid/liquid/dist/react";
import SimulationResultSummary  from './SimulationResultSummary';
const apiUrl = process.env.REACT_APP_API_URL;

interface SimulationResultProp {
    SimulationID: string;
    Lines: string[];
    SimulationStatus : string;
}

interface DistributionGraphData {
    capacity: {
        [key: string]: {
            DATE?: string[]; // Optional structure for capacity
            PLANNED_CAPACITY_HOURS?: number[];
            ACTUAL_CAPACITY_SHIFTS?: number[];
        };
    };
    optimal_shifts: {
        dates: string[]; // Array of date strings
        opt_shifts: any; // Define as needed based on actual structure
    };
    shifts_distribution: {
        dates: string[]; // Array of date strings
        labels: string[]; // Array of labels
        values: number[]; // Array of values
    };
}

interface DistributionGraphTableData {
    [key: string]: {
        dates: string[];
        diff_First_Shift_per_Weekday: number[];
        diff_Second_Shift_per_Weekday: number[];
        diff_Third_Shift_per_Weekday: number[];
        diff_First_Shift_per_Saturday: number[];
        diff_First_Shift_per_Sunday: number[];
        diff_Second_Shift_per_Saturday: number[];
        diff_Second_Shift_per_Sunday: number[];
        diff_Third_Shift_per_Saturday: number[];
        diff_Third_Shift_per_Sunday: number[];
        values_act: number[];  // Changed to number[] to reflect actual data type
        values_opt: number[];  // Changed to number[] to reflect actual data type
        colors_act: string[];
        colors_opt: string[];
        [key: string]: any; // Allow other properties for flexibility
    };
}

const monthTickFormatter = (tick: number) => {
    const date = new Date(tick);
    const month = date.getMonth();
    const monthNames = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];
    return monthNames[month];
};


const renderQuarterTick = (tick: any) => {
    const { x, y, payload } = tick;
    const date = new Date(payload.value);
    const month = date.getMonth();
    const year = date.getFullYear();

    // Render the year text and stroke line for January (month === 0)
    if (month === 0) {
        return (
            <>
                <text x={x} y={y + 15} textAnchor="middle" alignmentBaseline="central">{year}</text>
                <path d={`M${x + 0.5},${y - 4}v-35`} stroke="red" />
            </>
        );
    }

    // Render the quarter text for other months
    if (month === 1 || month === 4 || month === 7 || month === 10) {
        return <text x={x} y={y + 15} textAnchor="middle" alignmentBaseline="central">{year}</text>;
    }

    return null; // Return null for other months
};

interface ShiftDistribution {
    numWeekdays: number;
    numSaturdays: number;
    numSundays: number;
}

interface OptimalShifts {
    [key: string]: number[]; // Adjust the key type based on your actual keys
}

const initialfilterDistributionGraph = {
    Date: [],
    "Total Shifts": [],
    "Total Weekday Shifts": [],
    "Week Days": [],
    "Shifts per WeekDay": [],
    "Total Saturday Shifts": [],
    "Saturdays": [],
    "Shifts per Saturday": [],
    "Total Sunday Shifts": [],
    "Shifts per Sunday": [],
    "Ad-hoc Shifts": [],
};

const SimulationResult: React.FC<SimulationResultProp> = ({ SimulationStatus, SimulationID, Lines }) => {
    const [distributionGraphData, setDistributionGraphData] = useState<DistributionGraphData | null>(null);
    const [distributionGraphTableData, setDistributionTableData] = useState<DistributionGraphTableData>({})
    const [loading, setLoading] = useState<boolean>(false);
    const [activeTab, setActiveTab] = useState('table'); // Default active tab

    const getDistributionTable = useCallback(async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${apiUrl}/simulation/${SimulationID}/distributionTable?simulation_id=${SimulationID}`);
            if (res && res.data) {
                setDistributionTableData(res.data);
            } else {
                // display_notification('alert', 'An error occurred while fetching Graph data');
            }
        } catch (err) {
            // display_notification('alert', 'An error occurred while fetching Graph data');
        } finally {
            setLoading(false);
        }
    }, []);

    const getDistributionGraph = useCallback(async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${apiUrl}/simulation/${SimulationID}/distributionGraph?simulation_id=${SimulationID}`);
            if (res && res.data) {
                setDistributionGraphData(res.data);
            } else {
                // display_notification('alert', 'An error occurred while fetching Graph data');
            }
        } catch (err) {
            // display_notification('alert', 'An error occurred while fetching Graph data');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        getDistributionTable();
        getDistributionGraph();
    },[SimulationID,SimulationStatus]);

    const getDaysDistribution = (dates: string[]) => {
        const getDatesDistr = (dateStr: string) => {
            let numWeekdays = 0;
            let numSaturdays = 0;
            let numSundays = 0;
            let date = new Date(dateStr);
            const month = date.getMonth();
            let day = 1;
            const year = date.getFullYear();
    
            while (date.getMonth() === month) {
                if (date.getDay() === 6) {
                    numSundays += 1;
                } else if (date.getDay() === 5) {
                    numSaturdays += 1;
                } else {
                    numWeekdays += 1;
                }
                day += 1;
                date = new Date(year, month, day);
            }
    
            return {
                numWeekdays,
                numSaturdays,
                numSundays,
            };
        };
        return dates.map(date => getDatesDistr(date));
    };

    const filterDistributionGraph = useMemo(() => {
        const lineObjKey = Lines[0];
        
        // Check if Lines is defined and has at least one element
        if (!lineObjKey) {
            return initialfilterDistributionGraph;
        }
    
        const optimalShifts = distributionGraphData?.optimal_shifts?.opt_shifts?.[lineObjKey];
    
        // Check if distributionGraphData and optimalShifts are defined
        if (!distributionGraphData || SimulationStatus !== "SUCCESS" || !optimalShifts 
            || !optimalShifts["OPT_CAPACITY_SHIFTS"] || optimalShifts["OPT_CAPACITY_SHIFTS"].length === 0
        ) {
            return initialfilterDistributionGraph;
        }
    
        const dates = distributionGraphData.optimal_shifts.dates;
        const shifts_distribution = getDaysDistribution(dates);
    
        const opt_shifts = optimalShifts["OPT_CAPACITY_SHIFTS"];
    
        const weekdays = shifts_distribution.map((x: ShiftDistribution) => x.numWeekdays);
        const shift_per_weekday = opt_shifts.map((opt: number, idx: number) => 
            Math.min(Math.floor(opt / weekdays[idx]), 3)
        );
        const total_weekday_shifts = weekdays.map((x: number, idx: number) => 
            x * shift_per_weekday[idx]
        );
    
        const saturdays = shifts_distribution.map((x: ShiftDistribution) => x.numSaturdays);
        const shift_per_saturday = saturdays.map((saturdaysCount: number, idx: number) => 
            shift_per_weekday[idx] === 3 
                ? Math.min(Math.floor((opt_shifts[idx] - total_weekday_shifts[idx]) / saturdaysCount), 3) 
                : 0
        );
        const total_saturday_shifts = saturdays.map((x: number, idx: number) => 
            x * shift_per_saturday[idx]
        );
    
        const sundays = shifts_distribution.map((x: ShiftDistribution) => x.numSundays);
        const shift_per_sunday = sundays.map((sundaysCount: number, idx: number) => 
            shift_per_weekday[idx] === 3 
                ? Math.min(Math.floor((opt_shifts[idx] - total_weekday_shifts[idx] - total_saturday_shifts[idx]) / sundaysCount), 3) 
                : 0
        );
        const total_sunday_shifts = sundays.map((x: number, idx: number) => 
            x * shift_per_sunday[idx]
        );
    
        const ad_hoc_shifts = opt_shifts.map((x: number, idx: number) => 
            x - total_weekday_shifts[idx] - total_saturday_shifts[idx] - total_sunday_shifts[idx]
        );
    
        const data = {
            "Date": dates,
            "Total Shifts": opt_shifts,
            "Total Weekday Shifts": total_weekday_shifts,
            "Week Days": weekdays,
            "Shifts per WeekDay": shift_per_weekday,
            "Total Saturday Shifts": total_saturday_shifts,
            "Saturdays": saturdays,
            "Shifts per Saturday": shift_per_saturday,
            "Total Sunday Shifts": total_sunday_shifts,
            "Sundays": sundays,
            "Shifts per Sunday": shift_per_sunday,
            "Ad-hoc Shifts": ad_hoc_shifts
        };
    
        return data;
    }, [distributionGraphData, Lines, SimulationStatus]);
    

    const filterDistributionTable = useMemo(() => {
        // Early return if Lines is empty or distributionGraphTableData is empty
        if (!Lines.length || !Object.keys(distributionGraphTableData).length) {
            return {};
        }
    
        return Object.keys(distributionGraphTableData).reduce((obj, key) => {
            if (Lines.includes(key)) {
                obj[key] = distributionGraphTableData[key];
            }
            return obj;
        }, {} as DistributionGraphTableData);
    }, [distributionGraphTableData, Lines]);

    const filterShiftgraph = useMemo(() => {

        if (!distributionGraphData || !distributionGraphData.shifts_distribution) {
            return {};
        }
    
        const shiftsData = distributionGraphData.shifts_distribution;

        console.log(Lines);
        console.log(shiftsData);

    }, [distributionGraphData, Lines]);


    // // Prepare data for the chart
    // const chartData = useMemo(() => {
    //     const data: any[] = []; // Use any[] for flexibility, or define a specific type
    //     for (const line of Lines) {
    //         const lineData = filterDistributionGraph[line];
    //         if (lineData) {
    //             const dates = lineData.dates || [];
    //             dates.forEach((date, index) => {
    //                 data.push({
    //                     DATE: date,
    //                     TOTAL_WEEKDAY_SHIFTS: lineData.diff_First_Shift_per_Weekday[index] || 0,
    //                     TOTAL_SECOND_SHIFT: lineData.diff_Second_Shift_per_Weekday[index] || 0,
    //                     TOTAL_THIRD_SHIFT: lineData.diff_Third_Shift_per_Weekday[index] || 0,
    //                     TOTAL_FIRST_SATURDAY: lineData.diff_First_Shift_per_Saturday[index] || 0,
    //                     TOTAL_FIRST_SUNDAY: lineData.diff_First_Shift_per_Sunday[index] || 0,
    //                     TOTAL_SECOND_SATURDAY: lineData.diff_Second_Shift_per_Saturday[index] || 0,
    //                     TOTAL_SECOND_SUNDAY: lineData.diff_Second_Shift_per_Sunday[index] || 0,
    //                     TOTAL_THIRD_SATURDAY: lineData.diff_Third_Shift_per_Saturday[index] || 0,
    //                     TOTAL_THIRD_SUNDAY: lineData.diff_Third_Shift_per_Sunday[index] || 0,
    //                 });
    //             });
    //         }
    //     }
    //     return data;
    // }, [distributionGraphData, Lines]); 

    // const getChartFilterData = useMemo(() => {
    //     if(Object.key(distributionGraphData.shifts_distribution).length > 0){
            
    //     }

    // },[getDistributionTable,distributionGraphData,Lines])

    return (
        <div className="w-full">           
            {loading ? (
                <div className="text-center mt-4">
                    <LdLoading /> <LdTypo>Loading Simulation Result</LdTypo>
                </div>
            ) : (
                <div className="mt-4 w-full">
                    <LdTabs style={{ width: '100%' }}>
                        {SimulationStatus=== "SUCCESS" && filterDistributionGraph &&  Object.keys(filterDistributionGraph).length > 0 ? (
                            <div className="p-2 mt-2">
                                <span>The following table displays the optimal shifts distribution for this line outputed by the algorithm.</span>
                            </div>                            
                        ) : ( 
                            <div className="rounded-[5px] mt-2 p-1 mb-4 flex items-center h-8" style={{ backgroundColor: '#FBB360' }}>
                                <LdIcon name='cross' className="mr-2" />
                                <span>No Capacity Optimization ran for this line yet, so no results available to display</span>
                            </div>
                        )}   
                        <LdTablist mode="ghost">
                            <LdTab onClick={() => setActiveTab('table')} style={{ fontWeight: activeTab === 'table' ? 'bold' : 'normal' }}>Table</LdTab>
                            <LdTab onClick={() => setActiveTab('graph')} style={{ fontWeight: activeTab === 'graph' ? 'bold' : 'normal' }}>Graph</LdTab>
                        </LdTablist>
                        <LdTabpanellist>                           
                            <LdTabpanel style={{ display: activeTab === 'table' ? 'block' : 'none' }}>
                            <div className='optmazationResult'>
                            {filterDistributionGraph &&  Object.keys(filterDistributionGraph).length > 0 ? (
                                <LdTable className="mt-4 optmazationTabTable">
                                    <LdTableHead>
                                        <LdTableRow>
                                            <LdTableHeader>Date</LdTableHeader>
                                            <LdTableHeader>Total Shifts</LdTableHeader>
                                            <LdTableHeader>Total Weekday Shifts</LdTableHeader>
                                            <LdTableHeader>Week Days</LdTableHeader>
                                            <LdTableHeader>Shifts per WeekDay</LdTableHeader>
                                            <LdTableHeader>Total Saturday Shifts</LdTableHeader>
                                            <LdTableHeader>Saturdays</LdTableHeader>
                                            <LdTableHeader>Shifts per Saturday</LdTableHeader>
                                            <LdTableHeader>Total Sunday Shifts</LdTableHeader>
                                            <LdTableHeader>Shifts per Sunday</LdTableHeader>
                                            <LdTableHeader>Ad-hoc Shifts</LdTableHeader>
                                        </LdTableRow>
                                    </LdTableHead>
                                    <LdTableBody>
                                        {filterDistributionGraph.Date.map((date, index) => (
                                            <LdTableRow key={index}>
                                                <LdTableCell>{date}</LdTableCell>
                                                <LdTableCell>{filterDistributionGraph["Total Shifts"][index] || 0}</LdTableCell>
                                                <LdTableCell>{filterDistributionGraph["Total Weekday Shifts"][index] || 0}</LdTableCell>
                                                <LdTableCell>{filterDistributionGraph["Week Days"][index] || 0}</LdTableCell>
                                                <LdTableCell>{filterDistributionGraph["Shifts per WeekDay"][index] || 0}</LdTableCell>
                                                <LdTableCell>{filterDistributionGraph["Total Saturday Shifts"][index] || 0}</LdTableCell>
                                                <LdTableCell>{filterDistributionGraph["Saturdays"][index] || 0}</LdTableCell>
                                                <LdTableCell>{filterDistributionGraph["Shifts per Saturday"][index] || 0}</LdTableCell>
                                                <LdTableCell>{filterDistributionGraph["Total Sunday Shifts"][index] || 0}</LdTableCell>
                                                <LdTableCell>{filterDistributionGraph["Shifts per Sunday"][index] || 0}</LdTableCell>
                                                <LdTableCell>{filterDistributionGraph["Ad-hoc Shifts"][index] || 0}</LdTableCell>
                                            </LdTableRow>
                                        ))}
                                    </LdTableBody>
                                </LdTable>
                            ) : ( <h6>No data</h6> )}
                            </div>                                
                            </LdTabpanel>
                            <LdTabpanel style={{ display: activeTab === 'graph' ? 'block' : 'none' }}>
                                <div className='w-full optmazationResult'>                                    
                                    {/* <ResponsiveContainer width="100%" height={400}>
                                        <ComposedChart
                                            data={chartData}
                                            margin={{ top: 50, right: 30, left: 20, bottom: 30 }} // Adjust margin as needed
                                        >
                                            <CartesianGrid vertical={false} horizontal={false} strokeDasharray="0" />
                                            <XAxis tickLine={false} padding={{ left: 20 }} dataKey="DATE" tickFormatter={monthTickFormatter} />
                                            
                                            <YAxis axisLine={false} tickLine={false} />
                                            <Tooltip />
                                            <Legend 
                                                layout="horizontal" 
                                                verticalAlign="top" 
                                                align="right"                                                
                                                wrapperStyle={{
                                                    margin : '20px',
                                                    padding: '20px',
                                                    fontSize: '11px', // Set font size
                                                    color: 'black', // Set font color
                                                    textAlign: 'right' // Align text to the left
                                                }}
                                            />
                                            {/* Bar components for the specified data keys */}
                                            {/* <Bar legendType="circle" name="First Shift per Weekday" dataKey="TOTAL_WEEKDAY_SHIFTS" stackId="a" fill="#72CA9B"  />
                                            <Bar legendType="circle" name="Second Shift per Weekday" dataKey="TOTAL_SECOND_SHIFT" stackId="a" fill="#32A467" />
                                            <Bar legendType="circle" name="Third Shift per Weekday" dataKey="TOTAL_THIRD_SHIFT" stackId="a" fill="#238551" />
                                            <Bar legendType="circle" name="First Shift per Saturday" dataKey="TOTAL_FIRST_SATURDAY" stackId="a" fill="#FA999C" />
                                            <Bar legendType="circle" name="First Shift per Sunday" dataKey="TOTAL_FIRST_SUNDAY" stackId="a" fill="#E76A6E" />
                                            <Bar legendType="circle" name="Second Shift per Saturday" dataKey="TOTAL_SECOND_SATURDAY" stackId="a" fill="#CD4246" />
                                            <Bar legendType="circle" name="Second Shift per Sunday" dataKey="TOTAL_SECOND_SUNDAY" stackId="a" fill="#AC2F33" />
                                            <Bar legendType="circle" name="Third Shift per Saturday" dataKey="TOTAL_THIRD_SATURDAY" stackId="a" fill="#8E292C" />
                                            <Bar legendType="circle" name="Third Shift per Sunday" dataKey="TOTAL_THIRD_SUNDAY" stackId="a" fill="#731E21" />
                                            {/* Area component if needed */}
                                            {/* <Area type="monotone" legendType="circle" name="Actual Shift" dataKey="TOTAL_WEEKDAY_SHIFTS" stroke="#000000" fill="rgba(191, 191, 191, 0.5)" dot={false} />
                                        </ComposedChart>
                                    </ResponsiveContainer>  */}
                                </div>
                                <div className='w-full optmazationResult'>
                                    {filterDistributionTable && Object.keys(filterDistributionTable).length > 0 &&
                                        <SimulationResultSummary distributionGraphData={filterDistributionTable} />
                                    }
                                </div>
                            </LdTabpanel>
                        </LdTabpanellist>
                    </LdTabs> 
                </div>
            )}
        </div>
    );
};

export default SimulationResult;



