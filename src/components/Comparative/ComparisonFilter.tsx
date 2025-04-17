import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import axios from "axios";

import { display_notification } from '../../global/notification'; 

import ComparisonTable from './ComparsionTable';

import RangeSlider from '../SimulationView/Chart/RangeSlider';

import {
    LdCard,
    LdButton,
    LdIcon,
    LdTypo,
    LdBadge,
    LdTablist, LdTab,LdTabs,LdModal,LdCheckbox
    } from "@emdgroup-liquid/liquid/dist/react";

const apiUrl = process.env.REACT_APP_API_URL;

interface TableData {
    [key: string]: (string | number | undefined)[];
}

const simulationMinMaxDate = (minDates: string[], maxDates: string[]) => {
    // Convert string dates to timestamps for comparison
    const minDate = new Date(Math.min(...minDates.map((date: string) => new Date(date).getTime())));
    const maxDate = new Date(Math.max(...maxDates.map((date: string) => new Date(date).getTime())));

    // Format the dates back to string if needed
    const formattedMinDate = minDate.toISOString().split('T')[0]; // 'YYYY-MM-DD' format
    const formattedMaxDate = maxDate.toISOString().split('T')[0]; // 'YYYY-MM-DD' format

    return {
        lowestMinDate: formattedMinDate,
        highestMaxDate: formattedMaxDate
    };
};

const ComparisonFilter = React.memo(({ results }: { results: any }) => {
    
    const { lowestMinDate, highestMaxDate } = simulationMinMaxDate(
        results.comparision_simulation_ids.min_dates,
        results.comparision_simulation_ids.max_dates
    );

    const simulationDetails = {init_date: lowestMinDate, end_date: highestMaxDate }

    const compareSimulationDetails = results.comparision_simulation_ids;

    const modalRef = useRef<any>(null);
    const [selectDemandUnit, setSelectDemandUnit] = useState('hours'); 
    const [selectAggregation, setSelectAggregation] = useState('Years'); 
    const [simultaionLines, setSimulationLines] = useState<string[]>([]);
    const [compareSelectedLines, setcompareSelectedLines] = useState<string[]>([]);
    const [sliderSelectedMinDate, setSliderSelectedMinDate] = useState<string>(lowestMinDate);
    const [sliderSelectedMaxDate, setSliderSelectedMaxDate] = useState<string>(highestMaxDate);

    const getSimulationLines = useCallback((PlantID:string) => {
        axios
            .get(`${apiUrl}/plant/${PlantID}/lines`)
            .then((res) => {
                if (res.data){
                    setSimulationLines(res.data);
                    if (res.data.length > 0) {
                        setcompareSelectedLines([res.data[0]]); // Set it as an array
                    } else {
                        setcompareSelectedLines([]); 
                    }
                }
                else{
                    display_notification('warn','No simulation master Lines data returned');
                }
            })
            .catch((err) => {
                display_notification('alert','An error ocurred while simulation master Lines data');
            })
    }, [results]);

    const get_dates = useCallback(() => {
        // Convert date strings to Date objects
        const start = new Date(sliderSelectedMinDate);
        const end = new Date(sliderSelectedMaxDate);

        end.setUTCHours(12); // Set the hours to UTC 12 for the end date
    
        const dates = [];
        while (start <= end) {
            // Compensate for zero-based months in display
            const displayMonth = start.getUTCMonth() + 1;
            dates.push([
                start.getUTCFullYear(),
                // Months are zero-based, ensure leading zero
                displayMonth.toString().padStart(2, '0'),
                // Always display the first of the month
                '01',
            ].join('-'));
    
            // Progress the start date by one month
            start.setUTCMonth(start.getUTCMonth() + 1); // Increment by one month
        }
        return dates;
    }, [sliderSelectedMinDate, sliderSelectedMaxDate]);

    const get_dates_groups = useCallback(() => {
        const filtered_dates = get_dates();
        const final_data: { [key: string]: string[] } = {}; // Define final_data with an index signature
    
        function get_quarter(month: any) {
            if (parseInt(month) <= 3) {
                return "Q1";
            } else if (parseInt(month) <= 6) {
                return "Q2";
            } else if (parseInt(month) <= 9) {
                return "Q3";
            } else {
                return "Q4";
            }
        }
    
        if (selectAggregation === "Quarters") {
            for (const date of filtered_dates) {
                let [year, month] = date.split("-");
                const quarter = `${year}-${get_quarter(month)}`;
                if (quarter in final_data) {
                    final_data[quarter].push(date);
                } else {
                    final_data[quarter] = [date];
                }
            }
        } else if (selectAggregation === "Years") {
            for (const date of filtered_dates) {
                let [year] = date.split("-");
                const year_str = `Year ${year}`;
                if (year_str in final_data) {
                    final_data[year_str].push(date);
                } else {
                    final_data[year_str] = [date];
                }
            }
        } else {
            for (const date of filtered_dates) {
                final_data[date] = [date];
            }
        }
    
        return final_data;
    }, [sliderSelectedMinDate, sliderSelectedMaxDate,selectAggregation]);

    useEffect(() => {
        if(results && results.comparision_simulation_ids)  {
            const plant = results.comparision_simulation_ids.plant;
            getSimulationLines(plant);
        }
    }, [results]);

    const tableFilterData = useMemo(() => {
        if (!compareSelectedLines || !results || !results.comparision_simulation_ids) {
            return [];
        }
    
        const data = results.data;
        
        if ((data.load && Object.keys(data.load).length > 0) || (data.capacity && Object.keys(data.capacity).length > 0)) {

            const comparision_simulation_ids = results.comparision_simulation_ids;
            const simulations = comparision_simulation_ids.simulation_ids; 
            const simulations_names = comparision_simulation_ids.simulation_names;
            const by_scenarios = comparision_simulation_ids.by_scenarios.map((x: string) => x.replaceAll(" ", "_"));
            const all_sims = by_scenarios.concat(simulations);
            const all_sims_names = by_scenarios.concat(simulations_names);

            let selected_lines = compareSelectedLines;
        
            const dates = get_dates();
        
            const projections = {
                "LOAD RATIO": ["load", "hours"],
                [`DEMAND (${selectDemandUnit.toUpperCase()})`]: ["load", selectDemandUnit],
                "DEMAND (HOURS)": ["load", "hours"],
                "ABSORPTION": ["load", "absorption"],
                "CAPACITY (SHIFTS)": ["capacity", "capacity_shifts"],
                "CAPACITY (HOURS)": ["capacity", "capacity_hours"]
            };
        
            const table_data: TableData = {
                "PROJECTION": [],
                "EXERCISE": [],
                "TOTALS": []
            };
        
            dates.forEach(date => { table_data[date] = []; });
        
            const load_hours: TableData = {};
            dates.forEach(date => { load_hours[date] = []; });
        
            for (const proj of Object.keys(projections)) {
                let sim_index = 0;
                for (const sim of all_sims) {
                    if (proj === "LOAD RATIO") {
                        for (const date of dates) {
                            const proj_data = data[projections[proj][0]];
                            const all_values = proj_data[projections[proj][1]].filter((_:any, idx: number) => 
                                selected_lines.includes(proj_data["line"][idx]) && 
                                (proj_data["date"][idx] === date) && 
                                (proj_data["simulation_id"][idx] === sim)
                            );
        
                            const metric_value = all_values.reduce((acc: number, val: number) => acc + Math.round(val || 0), 0);
                            load_hours[date].push(metric_value || 0); // Ensure a default value of 0
                        }
                    } else {
                        table_data["PROJECTION"].push(proj);
                        table_data["EXERCISE"].push(all_sims_names[sim_index]);
                        let total = 0;
        
                        for (const date of dates) {
                            const proj_data = data[projections[proj][0]];
                            const all_values = proj_data[projections[proj][1]].filter((_:any, idx: number) => 
                                selected_lines.includes(proj_data["line"][idx]) && 
                                (proj_data["date"][idx] === date) && 
                                (proj_data["simulation_id"][idx] === sim)
                            );
        
                            const metric_value = all_values.reduce((acc: number, val: number) => acc + Math.round(val || 0), 0);
                            table_data[date].push(metric_value || 0); // Ensure a default value of 0
                            total += metric_value;
                        }
                        table_data["TOTALS"].push(total);
                    }
                    sim_index += 1;
                }
            }
        
            let i = 0;
            const num_sims = all_sims.length;
            for (const sim of all_sims) {
                table_data["PROJECTION"].push("D/C RATIO");
                table_data["EXERCISE"].push(all_sims_names[i]);
                let total_demand = 0;
                let total_capacity = 0;
        
                for (const date of dates) {
                    const jump_num = selectDemandUnit === "hours" ? 3 : 4;

                    // Ensure the value passed to parseInt is a string
                    const demand = parseInt(String(load_hours[date][i]) || '0', 10);
                    const capacity = parseInt(String(table_data[date][i + jump_num * num_sims]) || '0', 10);

                    if (!demand || !capacity) {
                        table_data[date].push(0);
                    } else {
                        table_data[date].push(Math.round(capacity === 0 ? 0 : (demand / capacity) * 100));
                    }
                    total_demand += demand;
                    total_capacity += capacity;
                }
                table_data["TOTALS"].push(Math.round(total_capacity === 0 ? 0 : (total_demand / total_capacity) * 100));
                i += 1;
            }
        
            let rows: TableData = table_data;
        
            if (selectAggregation !== "Months") {
                const date_groups = get_dates_groups();
                const new_rows: TableData = {
                    "PROJECTION": rows["PROJECTION"],
                    "EXERCISE": rows["EXERCISE"],
                    "TOTALS": rows["TOTALS"]
                };
        
                const dc_ratio_indexes = rows["PROJECTION"].map((x, idx) => x === "D/C RATIO" ? idx : -1).filter(x => x !== -1);
                const demand_hours_indexes = rows["PROJECTION"].map((x, idx) => x === "DEMAND (HOURS)" ? idx : -1).filter(x => x !== -1);
                const capacity_hours_indexes = rows["PROJECTION"].map((x, idx) => x === "CAPACITY (HOURS)" ? idx : -1).filter(x => x !== -1);
        
                for (const [group, months] of Object.entries(date_groups)) {
                    new_rows[group] = Array(new_rows["PROJECTION"].length).fill(0);
                    for (const month of months) {
                        new_rows[group] = new_rows[group].map((x, idx) => {
                            // Ensure both x and rows[month][idx] are treated as numbers
                            const currentValue = Number(x); // Convert x to number
                            const monthValue = Number(rows[month][idx]) || 0; // Convert rows[month][idx] to number, default to 0 if NaN
                    
                            return currentValue + monthValue; // Now you can safely add them
                        });
                    }
                    dc_ratio_indexes.forEach((index, pos) => {
                        const capacityValue: number = Number(new_rows[group][capacity_hours_indexes[pos]]) || 0; // Convert to number
                        const demandValue: number = Number(new_rows[group][demand_hours_indexes[pos]]) || 0; // Convert to number

                        new_rows[group][index] = Math.round(capacityValue === 0 ? 0 : (demandValue / capacityValue) * 100);
                    });
                }
                rows = new_rows;
            }
        
            if (selectDemandUnit !== "hours") {
                const demand_hours_indexes = rows["PROJECTION"].map((x, idx) => x === "DEMAND (HOURS)" ? idx : -1).filter(x => x !== -1);
                for (const key of Object.keys(rows)) {
                    rows[key] = rows[key].filter((_, idx) => !demand_hours_indexes.includes(idx));
                }
            }
            
            rows['by_scenarios'] = by_scenarios;

            return rows;
        }
    
        return [];
    }, [compareSelectedLines, sliderSelectedMinDate, sliderSelectedMaxDate, selectDemandUnit, selectAggregation, results]);

    const demandUnitHandleClick = (value:string) => {
        setSelectDemandUnit(value);
    }

    const aggregationHandleClick = (value:string) => {
        setSelectAggregation(value);
    }

    const CompareToggleLineSelection = (line: string) => {
        setcompareSelectedLines(prevSelectedLines => {
            // Check if the line is already selected
            if (prevSelectedLines.includes(line)) {
                // If it is selected, remove it from the selection
                return prevSelectedLines.filter(selectedLine => selectedLine !== line);
            } else {
                // If it is not selected, add it to the selection
                return [...prevSelectedLines, line];
            }
        });
    };

    const handleSliderChange = (value: string[]) => {

        const formatDate = (date: string) => {
            const [month, year] = date.split('/'); 
            return `${year}-${month}-01`; 
        };
    
        const minDate = formatDate(value[0]); 
        const maxDate = formatDate(value[1]); 
    
        setSliderSelectedMinDate(minDate); 
        setSliderSelectedMaxDate(maxDate);
    };  

    const selectedLineModal = () => {
        modalRef.current?.showModal();
    }

    return (
        <div className='w-full'>
            <div className="p-6">  
                <LdCard className='w-full'>
                    <div className="flex w-full">
                        <LdTypo variant="h5" className="flex-1"> Simulation Comparison for {compareSimulationDetails.simulation_names.join(' and ')} </LdTypo> 
                    </div>
                    <div className="flex w-full">
                        <div className="flex-1 p-2">
                            <div className="flex flex-col w-full mt-2">
                                <div className="flex justify-between items-center">
                                    <LdTypo variant='label-s' className="flex-1">LINES SELECTOR</LdTypo>
                                    <LdButton onClick={() => selectedLineModal()} size="sm" className="ld-theme-tea w-35">
                                        <LdIcon name="settings" size="sm" /> Select Lines
                                    </LdButton>
                                </div>
                                <div className="w-full h-[200px] p-2 sim-line-container overflow-y-scroll hide-scrollbar mt-2">
                                    {compareSelectedLines.length === 0 ? (
                                        <LdTypo>No lines selected.</LdTypo>
                                    ) : (
                                        compareSelectedLines.map((line) => (
                                            <LdBadge key={line} className='mr-2'>{line}</LdBadge>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="flex-1 p-2">
                            <div className="flex flex-col w-full mt-2">
                                <div className="flex">
                                    <LdTypo variant='label-s' className="flex-1">DATES SELECTOR</LdTypo>
                                </div>
                                <div className="ml-4">
                                    <RangeSlider simulationData={simulationDetails} handleSliderChange={handleSliderChange} />
                                </div>
                                <div className="m-1 chartMetric">
                                    <LdTypo variant='label-s' className="flex-1 mb-2">DEMAND UNIT</LdTypo>
                                    <LdTabs>
                                        <LdTablist size="sm" rounded="all">
                                            <LdTab 
                                                selected={selectDemandUnit === 'hours'} 
                                                onClick={() => demandUnitHandleClick('hours')}
                                            >
                                                Hours
                                            </LdTab>
                                            <LdTab 
                                                selected={selectDemandUnit === 'qty'} 
                                                onClick={() => demandUnitHandleClick('qty')}
                                            >
                                                Qty
                                            </LdTab>
                                            <LdTab 
                                                selected={selectDemandUnit === 'batches'} 
                                                onClick={() => demandUnitHandleClick('batches')}
                                            >
                                                Batches
                                            </LdTab>
                                            <LdTab 
                                                selected={selectDemandUnit === 'pallets'} 
                                                onClick={() => demandUnitHandleClick('pallets')}
                                            >
                                                Pallets
                                            </LdTab>
                                        </LdTablist>
                                    </LdTabs>
                                </div>
                                <div className="m-1 compareSimTab">
                                    <LdTypo variant='label-s' className="flex-1 mt-2 mb-2 ">TIME AGGREGATION</LdTypo>
                                    <LdTabs className="mt-2">
                                        <LdTablist size="sm">
                                            <LdTab 
                                                selected={selectAggregation === 'Months'} 
                                                onClick={() => aggregationHandleClick('Months')}
                                            >
                                                Months
                                            </LdTab>
                                            <LdTab 
                                                selected={selectAggregation === 'Quarters'} 
                                                onClick={() => aggregationHandleClick('Quarters')}
                                            >
                                                Quarters
                                            </LdTab>
                                            <LdTab 
                                                selected={selectAggregation === 'Years'} 
                                                onClick={() => aggregationHandleClick('Years')}
                                            >
                                                Years
                                            </LdTab>
                                        </LdTablist>
                                    </LdTabs>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="flex w-full comparsionTable overflow-y-scroll hide-scrollbar">
                        <ComparisonTable inputData={tableFilterData} />
                    </div>
                </LdCard>
            </div>
            {/* ------------------------ Select line modal-------------------- */}
            <LdModal blurryBackdrop cancelable={true} ref={modalRef}>
                <LdTypo slot="header">Select Lines</LdTypo>
                <div className="max-h-[300px] overflow-y-scroll hide-scrollbar">
                    {simultaionLines.map((line) => (
                        <div key={line} className="flex items-center mb-2">
                            <LdCheckbox 
                                checked={compareSelectedLines.includes(line)} 
                                onLdchange={() => CompareToggleLineSelection(line)} 
                            />
                            <LdTypo className="ml-2">{line}</LdTypo>
                        </div>
                    ))}
                </div>
            </LdModal>
            {/* ------------------------ end Select line modal-------------------- */}
        </div>
    );
});

export default ComparisonFilter;
