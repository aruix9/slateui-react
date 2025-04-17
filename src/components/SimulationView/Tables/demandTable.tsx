import React, { useState, useEffect, useCallback, useMemo ,useRef } from 'react';
import "./tables.css";
import {
    LdTable,
    LdTableRow,
    LdTableHeader,
    LdTableBody,
    LdTableCell,
    LdTableHead,
    LdCheckbox,
    LdModal,
    LdTypo,
    LdLoading,
    LdButton,
    LdSelect,
    LdOption,LdIcon
} from "@emdgroup-liquid/liquid/dist/react";
import axios from "axios";
import { display_notification } from '../../../global/notification'; 
import { Line } from 'recharts';

const apiUrl = process.env.REACT_APP_API_URL;

const initialFilterColumns = ["IOP_PRODUCT", "IOP_DESCR", "LINES_NUMBER", "PRODRATE", "BATCH_SIZE","HOURS", "QTY", "BATCHES"];

// Define the types for the props
interface DemandInputTableProps {
    DemandInputData: DemandInputData;
    SimulationID : string;
    Lines: string[];
}

// Define the types for the state
interface DemandInputData {
    [key: string]: {
        IOP_BRAND: string[];
        IOP_PRODUCT: string[];
        LINES_NUMBER: string[];
        IOP_STRENGTH: string[];
        [key: string]: any; // for dynamic keys like date_HOURS
    };
}

// Define the types for your data
interface RowData {
    line: string; // Assuming 'line' is a string
    IOP_BRAND: string[];
    IOP_PRODUCT: string[];
    LINES_NUMBER: string[];
    IOP_STRENGTH: string[];
    [key: string]: any; // Allow other keys with any type
}

interface EditedInputData {
    [line: string]: {
        [key: string]: any;
    };
}

interface LineData {
    [key: string]: number[]; // Each key maps to an array of numbers
}


const DemandInputTable: React.FC<DemandInputTableProps> = ({ DemandInputData, Lines, SimulationID }) => {
    const [duplicateRow, setDuplicateRow] = useState<{ line: string; lineIndex: number } | null>(null);
    const [dropDownFilters, setDropDownFilters] = useState<Record<string, string | null>>({});
    const [unitColumnTotals, setUnitColumnTotals] = useState<Record<string, number>>({});
    const dropDownFields = ["IOP_BRAND", "IOP_PRODUCT", "LINES_NUMBER", "IOP_STRENGTH"];
    const [filterColumns, setFilterColumns] = useState<string[]>(initialFilterColumns);
    const [isFilterColumModal, setIsFilterColumModal] = useState<boolean>(false);
    const [editedInputData, setEditedInputData] = useState<EditedInputData>({});
    const [selectedNewSkuLine, setSelectedNewSkuLine] = useState<string>('');
    const [showDropdown, setShowDropdown] = useState<string | null>(null);
    const isAddNewSkuModal = useRef<any>(null);
    

    const uniqueValues = useMemo(() => {
        const uniqueData: Record<string, Set<string>> = {};
        dropDownFields.forEach(field => {
            const uniqueSet = new Set<string>();
            Object.values(DemandInputData).forEach(row => {
                if (row[field]) {
                    row[field].forEach((value: string) => uniqueSet.add(value));
                }
            });
            uniqueData[field] = uniqueSet;
        });
        
        // Convert Sets to arrays
        const result: Record<string, string[]> = {};
        for (const field in uniqueData) {
            result[field] = Array.from(uniqueData[field]);
        }
        
        return result;
    }, [DemandInputData, dropDownFields]);


    const uniqueDates = useMemo(() => {
        const dateSet = new Set<string>();
        Object.values(DemandInputData).forEach(row => {
            for (const key in row) {
                const match = key.match(/^(\d{4}_\d{2}_\d{2})/);
                if (match) {
                    dateSet.add(match[1]);
                }
            }
        });
        return Array.from(dateSet).sort(); // Sort by date
    }, [DemandInputData]);

    const filteredData = useMemo(() => {
        return Object.entries(DemandInputData)
            .filter(([_, row]) =>
                Object.entries(dropDownFilters).every(([field, value]) => !value || row[field] === value)
            )
            .map(([line, row]) => ({ line, ...row })) as RowData[]; // Assert type here
    }, [dropDownFilters,  DemandInputData]);

    useEffect(() => {
        const totals: Record<string, number> = {}; // Define the type for totals
        filteredData.forEach((row: RowData) => {
            uniqueDates.forEach(date => {
                ["QTY", "BATCHES", "HOURS"].forEach(type => {
                    let totalVal = 0;
                    const key = `${date}_${type}`;
                    const rowValue = row[key];
                    const editedValue = editedInputData[row.line]?.[key];
                    if (Array.isArray(rowValue)) {
                        totalVal = rowValue.reduce((prev, next) => prev + (next || 0), 0);
                    } else if (typeof rowValue === 'string') {
                        totalVal = rowValue.split(',').reduce((prev, next) => prev + (Number(next.trim()) || 0), 0);
                    } else {
                        totalVal = Number(rowValue) || 0;
                    }
                    totals[key] = (totals[key] || 0) + (editedValue ?? totalVal);
                });
            });

        });
        setUnitColumnTotals(totals);
    }, [editedInputData, filteredData, uniqueDates]);

    const handleEdit = (line: string, key: string, value: number) => {
        setEditedInputData(prev => ({
            ...prev,
            [line]: { 
                ...prev[line], 
                [key]: isNaN(value) ? value : Number(value) // Ensure value is converted to number if it's not NaN
            },
        }));
    };

    const handleFilterChange = (field: string, value: string | null) => {
        setDropDownFilters(prev => ({
            ...prev,
            [field]: value || null, // Set null for "All" option
        }));
    };

    const toggleDropdown = (column: string) => {
        setShowDropdown(prev => (prev === column ? null : column));
    };

    const getCellColor = (current_value: number, original_value: number) => {
        const colors = { low: "#D33D17", high: "#29A634", equal: "white" };
        if (original_value !== undefined && original_value !== null) {
            if (current_value < original_value) return colors.low;
            else if (current_value > original_value) return colors.high;
            else return colors.equal;
        } else {
            return current_value !== 0 ? colors.high : colors.equal;
        }
    };

    const allColumns = useMemo(() => {
        const allColumns = ["IOP_BRAND", "IOP_STRENGTH", "IOP_PRODUCT", "IOP_DESCR", "LINES_NUMBER", "UNIT_PER_PALLET", "OVERHEAD_COST_BY_UNIT", "PRODRATE", "BATCH_SIZE", "PALLETS", "ABSORPTION" ];
        return allColumns
    }, []);

    const showTableColumns = useMemo(() => {
        return allColumns.filter(column => filterColumns.includes(column));
    }, [filterColumns]);

    const showUnitsColumns = useMemo(() => {
        const showUnitsColumns = ["HOURS", "QTY", "BATCHES", "PALLETS", "ABSORPTION"];
        return showUnitsColumns;
    }, [filterColumns]);

    const handleNewSkuselection = (value:string) => {
        setSelectedNewSkuLine(value);
    };

    const openAddnewSku = () => {
        setSelectedNewSkuLine(Lines[0]);
        isAddNewSkuModal.current?.showModal();
    }

    const addNewSkuAPIcall = async () => {
        if (selectedNewSkuLine!="") {
            isAddNewSkuModal.current?.close();
            display_notification('info', 'Adding New row.');
            try {
                const res = await axios.post(`${apiUrl}/simulation/${SimulationID}/planDetails/newSKU?simulation_id=${SimulationID}`, {"line": selectedNewSkuLine});
                if(res.data) {
                    console.log(res.data);
                }
            } catch (err) {
                display_notification('alert', 'Your request to add New SKU failed. Please try again.');
                return null; // Return null on error
            }          
        } else {
            display_notification('alert', 'Your request to add New SKU failed. Please try again.');
            return null; // Return null if validation fails
        }
    }

    const duplicateRowApiCall = async () => {
        if (duplicateRow !== null && duplicateRow.line) {
            const lineData = filteredData.find(row => row.line === duplicateRow.line);
            if (lineData) {
                const postData = {
                    "line": duplicateRow.line,
                    "iop_product": lineData.IOP_PRODUCT[duplicateRow.lineIndex],
                    "iop_brand": lineData.IOP_BRAND[duplicateRow.lineIndex],
                    "iop_strength": lineData.IOP_STRENGTH[duplicateRow.lineIndex],
                    "iop_descr": lineData.IOP_DESCR[duplicateRow.lineIndex],
                    "prodrate": lineData.PRODRATE[duplicateRow.lineIndex],
                    "batch_size": lineData.BATCH_SIZE[duplicateRow.lineIndex], // Corrected to use BATCH_SIZE
                    "unit_per_pallet": lineData.UNIT_PER_PALLET[duplicateRow.lineIndex],
                    "overhead_cost_by_unit": lineData.OVERHEAD_COST_BY_UNIT[duplicateRow.lineIndex]
                };
                display_notification('info', 'Duplicating selected row...');
                try {
                    const res = await axios.post(`${apiUrl}/simulation/${SimulationID}/planDetails/duplicateSKU?simulation_id=${SimulationID}`, postData);
                    if (res.data) {
                        console.log(res.data);
                    }
                } catch (err) {
                    display_notification('alert', 'Your request to add New SKU failed. Please try again.');
                }
            } else {
                display_notification('alert', 'Selected row data not found.');
            }
        } else {
            display_notification('alert', 'Please select checkbox to copy the row');
        }
    };
    
    const selectLineRows = (lineData:string,indexValue:number) => {
        const selectedRow = { line: lineData, lineIndex: indexValue };
        setDuplicateRow(selectedRow);
    }
    
    const Row = ({ lineData }: { lineData: RowData }) => {
        if (!lineData) return null; 
        return (
            <React.Fragment>
                {lineData.IOP_PRODUCT.map((product, productIndex) => (
                    <tr key={`${lineData.line}-${productIndex}`}>
                        <td className='sticky sticky-adjust'>
                            <LdCheckbox tone="dark" 
                                checked={duplicateRow?.line === lineData.line && duplicateRow?.lineIndex === productIndex} 
                                onLdchange={(e) => selectLineRows(lineData.line, productIndex)} 
                                value={lineData.line} 
                            />
                        </td>
                        <td className='sticky sticky-adjust'>{lineData.line}</td>
                        {showTableColumns.includes("IOP_BRAND") && <td className='sticky sticky-adjust'>{lineData.IOP_BRAND[productIndex]}</td>}
                        {showTableColumns.includes("IOP_STRENGTH") && <td className='sticky sticky-adjust'>{lineData.IOP_STRENGTH[productIndex]}</td>}
                        {showTableColumns.includes("IOP_PRODUCT") && <td className='sticky sticky-adjust'>{product}</td>}
                        {showTableColumns.includes("IOP_DESCR") && <td className='sticky sticky-adjust'>{lineData.IOP_DESCR[productIndex]}</td>}
                        {showTableColumns.includes("LINES_NUMBER") && <td className='sticky sticky-adjust'>{lineData.LINES_NUMBER[productIndex]}</td>}
                        {showTableColumns.includes("PRODRATE") && (
                            <td style={{ backgroundColor: 'white' }} className='sticky sticky-adjust'>
                                <input 
                                    type="number" 
                                    // value={(editedInputData[lineData.line]?.PRODRATE?.[productIndex] ?? lineData.PRODRATE[productIndex]) || 0} 
                                    value={(editedInputData[lineData.line].PRODRATE[productIndex])} 
                                    onChange={(e) => handleEdit(lineData.line, 'PRODRATE', Number(e.target.value))}
                                />
                            </td>
                        )}
                        {showTableColumns.includes("BATCH_SIZE") && (
                            <td style={{ backgroundColor: 'white' }} className='sticky sticky-adjust'>
                                <input 
                                    type="number" 
                                    value={(editedInputData[lineData.line]?.BATCH_SIZE?.[productIndex] ?? lineData.BATCH_SIZE[productIndex]) || 0} 
                                    onChange={(e) => handleEdit(lineData.line, 'BATCH_SIZE', Number(e.target.value))}
                                />
                            </td>
                        )}
                        {uniqueDates.map((date, dateIndex) => (
                            <React.Fragment key={`${lineData.line}-${productIndex}-${dateIndex}`}>
                                {showUnitsColumns.includes("HOURS") && renderInputField("HOURS", lineData, editedInputData, productIndex, date, lineData[`${date}_ORIGINAL_HOURS`]?.[productIndex])}
                                {showUnitsColumns.includes("QTY") && renderInputField("QTY", lineData, editedInputData, productIndex, date, lineData[`${date}_ORIGINAL_QTY`]?.[productIndex])}
                                {showUnitsColumns.includes("BATCHES") && renderInputField("BATCHES", lineData, editedInputData, productIndex, date, lineData[`${date}_ORIGINAL_BATCHES`]?.[productIndex])}
                                {showUnitsColumns.includes("PALLETS") && (
                                    <td key={`pallets-${lineData.line}-${productIndex}-${date}`}>
                                        {lineData.UNIT_PER_PALLET 
                                            ? (() => {
                                                const value = Math.round(lineData[`${date}_QTY`]?.[productIndex] * lineData.UNIT_PER_PALLET[productIndex]);
                                                return (value === Infinity) ? <span style={{ fontSize: '1.5em' }}>&#x221E;</span> : (isNaN(value) ? 0 : value);
                                            })() 
                                            : 0}
                                    </td>
                                )}
                                {showUnitsColumns.includes("ABSORPTION") && (
                                    <td key={`absorption-${lineData.line}-${productIndex}-${date}`}>
                                        {lineData.OVERHEAD_COST_BY_UNIT 
                                            ? (() => {
                                                const value = Math.round(lineData[`${date}_QTY`]?.[productIndex] / lineData.OVERHEAD_COST_BY_UNIT[productIndex]);
                                                return (value === Infinity) ? <span style={{ fontSize: '1.5em' }}>&#x221E;</span> : (isNaN(value) ? 0 : value);
                                            })() 
                                            : 0}
                                    </td>
                                )}
                            </React.Fragment>                    
                        ))}
                    </tr>
                ))}
            </React.Fragment>
        );
    };

    const renderInputField = (
        unitType: string, // Type for unitType
        lineData: { line: string; [key: string]: any }, // Define a more specific type for lineData if possible
        editedInputData: { [key: string]: any }, // Define a more specific type for editedInputData if possible
        productIndex: number, // Type for productIndex
        date: string, // Type for date
        originalValue: number | undefined // Type for originalValue
    ) => {
        const currentValue = (editedInputData[lineData.line]?.[`${date}_${unitType}`])?.[productIndex] ?? lineData[`${date}_${unitType}`]?.[productIndex] ?? 0;
        const valueToPass = originalValue !== undefined ? originalValue : 0;
        const color = getCellColor(currentValue, valueToPass);
        return (
            <td key={`${unitType}-${lineData.line}-${productIndex}-${date}`} style={{ backgroundColor: color }}>
                <input 
                    type="number"
                    style={{ backgroundColor: color }}
                    onChange={(e) => handleEdit(lineData.line, `${date}_${unitType}`, Number(e.target.value))} 
                    value={currentValue} 
                />
            </td>
        );
    };
    
    return (
        <div>
            {/* Table action buttons */}
            <div className="flex items-center w-full mt-2 space-x-2 justify-end">
                <LdButton size="sm" disabled className="simulationView-header-button">Update Table</LdButton>
                <LdButton size="sm" onClick={openAddnewSku} className="simulationView-header-button">Add New Row</LdButton>
                <LdButton mode="highlight" disabled size="sm" className="simulationView-header-button">Reset Data</LdButton>
                <LdButton size="sm" className="simulationView-header-button">Save Data</LdButton>
                <LdButton size="sm" disabled={duplicateRow === null} onClick={() => duplicateRowApiCall()}  className="simulationView-header-button">Duplicate Row</LdButton>
                <LdButton size="sm" onClick={() => setIsFilterColumModal(true)} className="ld-theme-tea simulationView-header-button">Select Columns</LdButton>
            </div> 
            {/* End action Buttons */}
            <div id='demandInputTbl' className='mt-4'>  
                <table>
                    <thead>
                        {showUnitsColumns && showUnitsColumns.length > 0 ? (
                            <tr>
                                <th className='sticky sticky-adjust' colSpan={showTableColumns.length + 2}></th>
                                {uniqueDates.map((date, index) => ( 
                                    <th key={`date-header-${index}`} colSpan={showUnitsColumns.length}>
                                        {date.replace(/_/g, '-')} 
                                    </th>
                                ))}
                            </tr>                        
                        ) : null }
                        <tr>
                            <th className='sticky sticky-adjust'></th>
                            <th className='sticky sticky-adjust'>
                                LINE <span onClick={() => toggleDropdown('LINE')} className="filter-icon">▼</span><br />
                                <div className={showDropdown === 'LINE' ? '' : 'hidden filter-dropdown'}>
                                    <select
                                        onChange={(e) => handleFilterChange('LINES', e.target.value)} 
                                        className="flex-none"
                                    >
                                        <option key='' value=''>ALL</option>
                                        {Lines.map((line) => (
                                            <option key={`line-option-${line}`} value={line}>{line}</option>
                                        ))}
                                    </select>
                                </div>
                            </th>  
                            {showTableColumns.map((col, index) => (
                                <th className='sticky sticky-adjust' key={`header-${col}-${index}`}>
                                    {col === "LINES_NUMBER" || col === "IOP_BRAND" || col === "IOP_PRODUCT" || col === "IOP_STRENGTH" ? (
                                        <>
                                            {col.replace(/IOP_/g, "").replace(/_/g, " ").toUpperCase()} <span onClick={() => toggleDropdown(col)} className="filter-icon">▼</span><br />
                                            <div className={showDropdown === col ? '' : 'hidden'}>
                                                <select
                                                    onChange={(e) => handleFilterChange(col, e.target.value)} 
                                                    className="flex-none"
                                                >
                                                    <option key='' value=''>ALL</option>
                                                    {uniqueValues[col].map(value => (
                                                        <option key={`value-option-${value}`} value={value}>{value}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </>
                                    ) : (
                                        col.replace(/IOP_/g, "").replace(/_/g, " ").toUpperCase()
                                    )}
                                </th>
                            ))}
                            {showUnitsColumns && showUnitsColumns.length > 0 ? 
                                (uniqueDates.map((date, dateIndex) => (
                                    <React.Fragment key={`units-header-${date}-${dateIndex}`}>
                                        {showUnitsColumns.includes("HOURS") && ( 
                                            <th key={`hours-header-${date}`}>HOURS <br /> {unitColumnTotals[`${date}_HOURS`] ?? 0 }</th>
                                        )}
                                        {showUnitsColumns.includes("QTY") && (
                                            <th key={`qty-header-${date}`}>QTY <br /> {unitColumnTotals[`${date}_QTY`] ?? 0 }</th>
                                        )}
                                        {showUnitsColumns.includes("BATCHES") && (
                                            <th key={`batches-header-${date}`}>BATCHES <br /> {unitColumnTotals[`${date}_BATCHES`] ?? 0 }</th>
                                        )}
                                        {showUnitsColumns.includes("PALLETS") && (
                                            <th key={`pallets-header-${date}`}>PALLETS <br /> 0 </th>
                                        )}
                                        {showUnitsColumns.includes("ABSORPTION") && (
                                            <th key={`absorption-header-${date}`}>ABSORPTION <br /> 0 </th>
                                        )}
                                    </React.Fragment>
                                ))
                            ) : null }
                        </tr>
                    </thead>
                    <tbody>
                        {filteredData.map((lineData) => (
                            <Row key={lineData.line} lineData={lineData} />
                        ))}                   
                    </tbody>
                </table>
            </div>
            {/*  Ldmodal display column  */}
            <LdModal blurryBackdrop open={isFilterColumModal} onLdmodalclosed={() => setIsFilterColumModal(false)} cancelable={true}>
                <LdTypo slot="header">Columns to Display</LdTypo>
                <div className="max-h-[300px] overflow-y-scroll hide-scrollbar">
                    {allColumns.map(column => (
                        <div key={`column-display-${column}`} className="flex items-center mb-2">
                            <LdCheckbox 
                                checked={filterColumns.includes(column)} 
                                onLdchange={() => setFilterColumns(prev => 
                                    prev.includes(column) ? prev.filter(item => item !== column) : [...prev, column])} 
                            />
                            <LdTypo className="ml-2">{column.replace(/_/g, ' ')}</LdTypo>
                        </div>
                    ))}
                </div>
            </LdModal>
            {/* End display column */}
            {/*  Ldmodal Add New SKU column  */}
            <LdModal blurryBackdrop cancelable={true} ref={isAddNewSkuModal}>
                <LdTypo slot="header">Add new SKU</LdTypo>
                <div className="max-h-[200px] w-[400px]">
                    <div className="flex flex-col mb-2 "> 
                        <LdTypo variant='h6'>
                            Select the line you want to add the SKU to:
                        </LdTypo>
                        <select className="flex-none w-full mt-4 mb-4 border addNewskuSelect"
                            onChange={(e) => handleNewSkuselection(e.target.value)} 
                        >
                            {Lines.length === 0 ? (
                                <option disabled>No matches found</option>
                            ) : (
                                Lines.map((line) => (
                                    <option key={`line-select-${line}`} value={line}>{line}</option>
                                ))
                            )}
                        </select>
                    </div>
                </div>
                <div className="flex justify-center mt-6"> {/* Parent div */}
                    <LdButton                        
                        size="sm"
                        className="ld-theme-tea w-full mx-auto "
                        onClick={addNewSkuAPIcall}
                    >
                        <LdIcon size="sm" name="checkmark" /> Add New Row 
                    </LdButton>
                </div>
            </LdModal>
            {/* End new SKU column */}
        </div>
    );
    
};

export default DemandInputTable;
