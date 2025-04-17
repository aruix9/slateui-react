import React, { useState } from 'react';
import {
    LdTable,
    LdTableRow,
    LdTableHeader,
    LdTableBody,
    LdTableCell,
    LdTableHead,
} from "@emdgroup-liquid/liquid/dist/react";

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

import SimulationResultData from './SimulationResultData.json';

// Define the structure of your data
interface ShiftData {
    DATE: number;
    TOTAL_SHIFTS: number;
    TOTAL_WEEKDAY_SHIFTS: number;
    WEEK_DAYS: number;
    SHIFTS_PER_WEEKDAY: number;
    TOTAL_SATURDAY_SHIFTS: number;
    SATURDAYS: number;
    SHIFTS_PER_SATURDAY: number;
    TOTAL_SUNDAY_SHIFTS: number;
    SUNDAYS: number;
    SHIFTS_PER_SUNDAY: number;
}


const monthTickFormatters = (tick: string) => {
    const date = new Date(tick);
    const month = date.getMonth();
    const monthNames = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun", 
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];
    return monthNames[month];
};

const SimulationResultTable: React.FC = () => {
    const [data, setData] = useState<ShiftData[]>(SimulationResultData.shiftsData);
    const [editableCell, setEditableCell] = useState<{ row: number | null | string; column: keyof ShiftData | null }>({ row: null, column: null });

    const handleCellClick = (rowIndex: number, columnKey: keyof ShiftData) => {
        setEditableCell({ row: rowIndex, column: columnKey });
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>, rowIndex: number, columnKey: keyof ShiftData) => {
        const newData: ShiftData[] = [...data]; // Explicitly type newData
        const value = Number(e.target.value); // Convert value to number
    
        // Check if columnKey is one of the numeric fields
        if (typeof newData[rowIndex][columnKey] === 'number') {
            newData[rowIndex][columnKey] = value; // Allow insertion if columnKey is a number
        } else {
            console.warn(`Cannot assign value to ${columnKey} as it is not a numeric field.`);
        }
    
        setData(newData); // Update state, which will also update the chart
    };

    const handleBlur = () => {
        setEditableCell({ row: null, column: null });
    };

    return (
        <div className='simulationResultTable-container'>
            <div style={{ width: '100%', padding: '10px' }}>
                The following table displays the optimal shifts distribution for this line outputted by the algorithm.
            </div>
            <LdTable style={{ maxHeight: '26rem' }}>
                <LdTableHead style={{ textAlign: 'right' }}>
                    <LdTableRow style={{ textAlign: 'left' }}>
                        <LdTableHeader>DATE</LdTableHeader>
                        <LdTableHeader>TOTAL SHIFTS</LdTableHeader>
                        <LdTableHeader>TOTAL WEEKDAY SHIFTS</LdTableHeader>
                        <LdTableHeader>WEEK DAYS</LdTableHeader>
                        <LdTableHeader>SHIFTS PER WEEKDAY</LdTableHeader>
                        <LdTableHeader>TOTAL SATURDAY SHIFTS</LdTableHeader>
                        <LdTableHeader>SATURDAYS</LdTableHeader>
                        <LdTableHeader>SHIFTS PER SATURDAY</LdTableHeader>
                        <LdTableHeader>TOTAL SUNDAY SHIFTS</LdTableHeader>
                        <LdTableHeader>SUNDAYS</LdTableHeader>
                        <LdTableHeader>SHIFTS PER SUNDAY</LdTableHeader>
                    </LdTableRow>
                </LdTableHead>
                <LdTableBody style={{ textAlign: 'center' }}>
                    {data.map((item, rowIndex) => (
                        <LdTableRow key={item.DATE}>
                            <LdTableCell style={{ textAlign: 'left' }}>
                                {`${new Date(item.DATE).getDate().toString().padStart(2, '0')}-${(new Date(item.DATE).getMonth() + 1).toString().padStart(2, '0')}-${new Date(item.DATE).getFullYear()}`}
                            </LdTableCell>
                            {(['TOTAL_SHIFTS', 'TOTAL_WEEKDAY_SHIFTS', 'SHIFTS_PER_WEEKDAY', 'TOTAL_SATURDAY_SHIFTS', 'SHIFTS_PER_SATURDAY', 'TOTAL_SUNDAY_SHIFTS', 'SHIFTS_PER_SUNDAY', 'AD_HOC_SHIFTS'] as Array<keyof ShiftData>).map((columnKey) => (
                                <LdTableCell key={columnKey} onClick={() => handleCellClick(rowIndex, columnKey)}>
                                    {editableCell.row === rowIndex && editableCell.column === columnKey ? (
                                        <input
                                            type="number"
                                            value={item[columnKey]} // Accessing the value directly
                                            onChange={(e) => handleChange(e, rowIndex, columnKey)}
                                            onBlur={handleBlur}
                                            autoFocus
                                        />
                                    ) : (
                                        item[columnKey]
                                    )}
                                </LdTableCell>
                            ))}
                            <LdTableCell>{item.WEEK_DAYS}</LdTableCell>
                            <LdTableCell>{item.SATURDAYS}</LdTableCell>
                        </LdTableRow>
                    ))}
                </LdTableBody>
            </LdTable>
            <ResponsiveContainer width="100%" height={400}>
                <ComposedChart
                    width={500}
                    height={300}
                    data={data}
                    margin={{ top: 50, right: 30, left: 20, bottom: 30 }} // Adjust margin as needed
                >
                    <CartesianGrid vertical={false} horizontal={false} strokeDasharray="0" />
                    <XAxis tickLine = {false} padding={{ left: 20 }} dataKey="DATE" tickFormatter={monthTickFormatters} />
                    <YAxis axisLine={false} tickLine={false} />
                    <Tooltip />
                    <Legend 
                        layout="horizontal" 
                        verticalAlign="top" 
                        align="center" 
                        wrapperStyle={{ paddingTop: '10px' }} 
                    />
                    {/* Bar components */}
                    <Bar legendType="circle" name="TOTAL WEEKDAY SHIFTS" dataKey="TOTAL_WEEKDAY_SHIFTS" stackId="a" fill="#6bbe9b" />
                    <Bar legendType="circle" name="AD HOC SHIFTS" dataKey="AD_HOC_SHIFTS" stackId="a" fill="#299666" />
                    <Bar legendType="circle" name="TOTAL SHIFTS" dataKey="TOTAL_SHIFTS" stackId="a" fill="#1c7851" />
                    <Bar legendType="circle" name="TOTAL SATURDAY SHIFTS" dataKey="TOTAL_SATURDAY_SHIFTS" stackId="a" fill="#ffa09d" />
                    <Bar legendType="circle" name="SATURDAYS" dataKey="SATURDAYS" stackId="a" fill="#f1766e" />
                    <Bar legendType="circle" name="TOTAL SUNDAY SHIFTS" dataKey="TOTAL_SUNDAY_SHIFTS" stackId="a" fill="#db4f46" />
                    <Bar legendType="circle" name="SHIFTS PER WEEKDAY" dataKey="SHIFTS_PER_WEEKDAY" stackId="a" fill="#b83b2e" />
                    {/* Area component */}
                    <Area type="monotone" name="Total Shifts" dataKey="TOTAL_SHIFTS" stroke="#000000" fill="rgba(191, 191, 191, 0.5)" />
                </ComposedChart>
            </ResponsiveContainer>
        </div>
    );
};

export default SimulationResultTable;
