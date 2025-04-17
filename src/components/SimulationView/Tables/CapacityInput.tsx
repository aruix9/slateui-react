import React, { useEffect, useState } from 'react';
import {
    LdTable,
    LdButton,
    LdTableRow,
    LdTableHeader,
    LdTableBody,
    LdTableCell,
    LdTableHead,
    LdIcon,
} from "@emdgroup-liquid/liquid/dist/react";

import "./tables.css";
import { display_notification } from '../../../global/notification'; 
import axios from "axios";
const apiUrl = process.env.REACT_APP_API_URL;


// Define the CapacityData interface based on your API response structure
interface CapacityData {
    [key: string]: any; // Allows dynamic indexing
}

interface CapacityInputsProps {
    CapacityData: { [key: string]: CapacityData }; // Existing prop
    Lines: string[]; // Existing prop
    SimulationID: string; // Existing prop
    onCapacityModified: (modifiedData: any) => void; // Corrected prop
    reloadCapacityData: (SimulationID: string) => void; // Define the type for reloadCapacityData
}

type CapacityModifiedData = {
    line: string;
    date: string;
    oee: number;
    productive_capacity_hours: number;
    min_shifts: number;
    max_shifts: number;
    hours_per_shift: number;
};

const CapacityInputs: React.FC<CapacityInputsProps> = ({ CapacityData, Lines ,SimulationID,onCapacityModified,reloadCapacityData }) => {
    const [CapacityOutputData, setCapacityOutputData] = useState<CapacityData | null>(null);
    const [CapacityModifiedData, setCapacityModifiedOutputData] = useState<CapacityModifiedData[]>([]); // Initialize state

    useEffect(() => {        
        if (CapacityData && Lines.length > 0) {
            const filteredCapacity = Object.keys(CapacityData)
                .filter(key => Lines.includes(key)) // Filter keys based on Lines
                .reduce((obj, key) => {
                    obj[key] = CapacityData[key]; // Build a new object with filtered keys
                    return obj;
                }, {} as CapacityData);
                        
            setCapacityOutputData(filteredCapacity);
        }
    }, [CapacityData, Lines]);
    
    useEffect(() => {
        setCapacityModifiedOutputData([]);
    }, [CapacityOutputData]);

    const capacityInputChange = (capcityLines: string, index: number, field: string, value: number) => {
        if (CapacityOutputData && value !== undefined) { // Check if CapacityOutputData exists and value is defined
            // const newCapacityOutputData = { ...CapacityOutputData };
    
            if (Array.isArray(CapacityOutputData[capcityLines][field])) {
                let updateValue = value; // Initialize updateValue with the input value


                CapacityOutputData[capcityLines][field][index] = updateValue;

                const changedValue = {
                    "line": capcityLines,
                    "date": CapacityOutputData[capcityLines].DATE[index],
                    "oee": CapacityOutputData[capcityLines].OEE[index],
                    "productive_capacity_hours": CapacityOutputData[capcityLines].PRODUCTIVE_CAPACITY_HOURS[index],
                    "min_shifts": CapacityOutputData[capcityLines].MIN_SHIFTS[index],
                    "max_shifts": CapacityOutputData[capcityLines].MAX_SHIFTS[index],
                    "hours_per_shift": CapacityOutputData[capcityLines].HOURS_PER_SHIFT[index]
                };

                ModifiedCapacity(changedValue);

            }
            

        }
    };

    const ModifiedCapacity = (changedValue: CapacityModifiedData) => {
        // Find the index of the existing entry based on both line and date
        const existingIndex = CapacityModifiedData.findIndex(item => 
            item.line === changedValue.line && item.date === changedValue.date
        );

        if (existingIndex !== -1) {
            // If it exists, create a new array without the old entry
            const updatedData = [...CapacityModifiedData]; // Create a copy of the current state
            updatedData.splice(existingIndex, 1); // Remove the old entry
            
            // Add the new changed value
            updatedData.push(changedValue);
            setCapacityModifiedOutputData(updatedData); // Update the state with the new array
        } else {
            // If it doesn't exist, just add the new changed value
            setCapacityModifiedOutputData(prevData => [...prevData, changedValue]);
        }
        chartSaveCapacity();
    };

    const saveCapacity = async () => {
        display_notification('info', 'Saving capacity details...'); 
    
        if (CapacityModifiedData.length > 0) {
            try {
                const res = await axios.post(`${apiUrl}/simulation/${SimulationID}/capacityDetails/edits?simulation_id=${SimulationID}`, 
                    { 'payload': CapacityModifiedData }
                );
                
                if (res) { 
                    setCapacityModifiedOutputData([]);// empty modified data
                    reloadCapacityData(SimulationID);
                    display_notification('info', 'Capacity details have been saved. Please wait while we refresh the table and chart.');
                }
            } catch (err) {
                console.error(err); // Log the error for debugging
                display_notification('alert', 'Please try again.');
            }          
        } else {
            display_notification('alert', 'No data to save. Please modify capacity data before saving.');
        }
    };

    const chartSaveCapacity = () => {
        onCapacityModified(CapacityOutputData); // Ensure this matches the expected type
    };
    
    
    if (!CapacityOutputData) {
        return <div>No data available</div>; // Handle loading or empty state
    }

    return (
        <div className="w-full">
            <div className="capcityTableDivTitle flex justify-between items-center w-full mt-1 p-2">
                <div className="flex-grow">
                    {/* <LdButton onClick={chartSaveCapacity} disabled={CapacityModifiedData.length === 0} size="sm" className="simulationView-header-button">
                        <LdIcon name="documents-storage" size="sm" /> Update Capacity Chart
                    </LdButton> */}
                </div>
                    <LdButton onClick={saveCapacity} disabled={CapacityModifiedData.length === 0} size="sm" className="simulationView-header-button">
                        <LdIcon name="documents-storage" size="sm" /> Save Capacity
                    </LdButton>
            </div>
            <div className="mt-1">
                <LdTable className='capacitTabTable max-h-[24rem] '>
                    <LdTableHead style={{ textAlign: 'right' }}>
                        <LdTableRow style={{ textAlign: 'left' }}>
                            <LdTableHeader>LINE</LdTableHeader>
                            <LdTableHeader>DATE</LdTableHeader>
                            <LdTableHeader>PLANNED CAPACITY HOURS</LdTableHeader>
                            <LdTableHeader>OEE (%)</LdTableHeader>
                            <LdTableHeader>PRODUCTIVE CAPACITY HOURS</LdTableHeader>
                            <LdTableHeader>MIN SHIFTS</LdTableHeader>
                            <LdTableHeader>MAX SHIFTS</LdTableHeader>
                            <LdTableHeader>HOURS PER SHIFT</LdTableHeader>
                        </LdTableRow>
                    </LdTableHead>
                    <LdTableBody style={{ textAlign: 'center' }}>                        
                        {Object.keys(CapacityOutputData).map((Lines) => {
                            const lineData = CapacityOutputData[Lines];
                            return lineData.DATE.map((date: string) => {
                                // Find the index of the current date in the DATE array
                                const dateIndex = lineData.DATE.indexOf(date);
                                return (
                                    <LdTableRow key={dateIndex}>
                                        <LdTableCell style={{ textAlign: 'left' }}>{Lines}</LdTableCell>
                                        <LdTableCell>{date}</LdTableCell>
                                        <LdTableCell>{lineData ? Math.round(lineData.PLANNED_CAPACITY_HOURS[dateIndex]) : 0}</LdTableCell>
                                        <LdTableCell>                                     
                                        <input
                                            type="number"
                                            className='w-20'
                                            value={lineData && lineData.OEE && lineData.OEE[dateIndex] !== undefined ? Math.round(lineData.OEE[dateIndex] * 100) : 0}
                                            onChange={(e) => capacityInputChange(Lines, dateIndex, 'OEE', parseInt(e.target.value) / 100)}
                                            
                                        />                                         
                                        </LdTableCell>
                                        <LdTableCell>{lineData ? Math.round(lineData.PRODUCTIVE_CAPACITY_HOURS[dateIndex]) : 0}</LdTableCell>
                                        <LdTableCell>
                                            <input
                                                type="number" className='w-20'
                                                value={lineData ? lineData.MIN_SHIFTS[dateIndex] : 0}
                                                onChange={(e) => capacityInputChange(Lines, dateIndex, 'MIN_SHIFTS', parseInt(e.target.value))}
                                            />
                                        </LdTableCell>
                                        <LdTableCell>
                                            <input
                                                type="number" className='w-20'
                                                value={lineData ? lineData.MAX_SHIFTS[dateIndex] : 0}
                                                onChange={(e) => capacityInputChange(Lines, dateIndex, 'MAX_SHIFTS', parseInt(e.target.value))}
                                            />
                                        </LdTableCell>
                                        <LdTableCell>
                                            <input
                                                type="number" className='w-20'
                                                value={lineData ? lineData.HOURS_PER_SHIFT[dateIndex] : 0}
                                                onChange={(e) => capacityInputChange(Lines, dateIndex, 'HOURS_PER_SHIFT', parseInt(e.target.value))}
                                            />
                                        </LdTableCell>
                                    </LdTableRow>
                                );
                            });
                        })}
                    </LdTableBody>
                </LdTable>
            </div>
        </div>
    );
};

export default CapacityInputs;
