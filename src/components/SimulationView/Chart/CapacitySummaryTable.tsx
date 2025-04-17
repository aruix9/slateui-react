import React, { useEffect } from 'react';
import "./barChart.css";

interface InputData {
    PROJECTION: string[];
    LINE: string[];
    [key: string]: any; // Allow additional dynamic keys
}

const CapacitySummaryTable: React.FC<{ inputData: InputData }> = ({ inputData }) => {
    useEffect(() => {
        createTableHeader(inputData);
        createTableRows(inputData);
        adjustSticky();
    }, [inputData]); // Run when inputData changes

    const createTableHeader = (inputData: InputData) => {
        const tableHeader = document.querySelector("#slider-summary-tables thead") as HTMLTableSectionElement;
        if (tableHeader) {
            tableHeader.innerHTML = "";
            const row = document.createElement("tr");
            for (const key in inputData) {
                const header = document.createElement("th");
                header.textContent = key;
                if (key === "PROJECTION" || key === "TOTALS" || key === "LINE") {
                    header.className = "sticky";
                    header.style.backgroundColor = "#8F99A8";
                }
                row.appendChild(header);
            }
            tableHeader.appendChild(row);
        }
    };

    const createTableRows = (inputData: InputData) => {
        const tableBody = document.querySelector("#slider-summary-tables tbody") as HTMLTableSectionElement;
        if (tableBody) {
            tableBody.innerHTML = "";
            const uniqueLines = Array.from(new Set(inputData.LINE)); // Get unique lines
            const first_line = uniqueLines[0]; // Get the first unique line
            const num_lines = uniqueLines.length; // Get the count of unique lines
            const metrics = inputData.PROJECTION;

            metrics.forEach((metric, index) => {
                if (num_lines !== 2 || inputData["LINE"][index] !== "TOTAL") {
                    const row = document.createElement("tr");
                    if (inputData.LINE[index] === "TOTAL") {
                        row.style.backgroundColor = "#C5CBD3";
                        row.style.borderBottom = "3px solid gray";
                    }
                    for (let key in inputData) {
                        const cell = document.createElement("td");
                        if (key === "PROJECTION") {
                            if (inputData.LINE[index] === first_line) {
                                cell.style.textAlign = "left";
                                cell.textContent = inputData[key][index] || ""; // Default to empty string if undefined
                                cell.style.border = "none";
                            } else {
                                cell.textContent = "";
                                cell.style.border = "none";
                            }
                            cell.style.borderRight = "solid 3px #ddd";
                        } else if (key === "LINE") {
                            cell.textContent = inputData[key][index] || ""; // Default to empty string
                            cell.style.textAlign = "left";
                        } else {
                            const value = inputData[key][index];
                            cell.textContent = value !== undefined 
                                ? (metric.includes("Ratio") 
                                    ? `${Math.round(value * 100).toLocaleString("en-us")} %` 
                                    : Math.round(value).toLocaleString("en-us")) 
                                : "0"; // Default to 0 if value is undefined
                        }
                        if (key === "PROJECTION" || key === "TOTALS" || key === "LINE") {
                            cell.className = "sticky";
                            if (inputData.LINE[index] === "TOTAL" && key !== "PROJECTION") {
                                cell.style.backgroundColor = "#ABB3BF";
                            }
                        }
                        // Conditional background colors for Added/Removed metrics
                        if (metric.includes("Removed") && inputData[key][index] > 0) {
                            cell.style.backgroundColor = inputData["LINE"][index] === "TOTAL" 
                                ? (key === "TOTALS" ? "#D33D17" : "#EB6847") 
                                : (key === "TOTALS" ? "#EB6847" : "#FF9980");
                        }
                        if (metric.includes("Added") && inputData[key][index] > 0) {
                            cell.style.backgroundColor = inputData["LINE"][index] === "TOTAL" 
                                ? (key === "TOTALS" ? "#29A634" : "#43BF4D") 
                                : (key === "TOTALS" ? "#43BF4D" : "#62D96B");
                        }
                        // Handling Ratios
                        if (metric.includes("Ratio") && key !== "PROJECTION" && key !== "LINE") {
                            const ratioColors = {
                                low: { totals_total: "#C87619", totals: "#EC9A3C", normal: "#FBB360" },
                                correct: { totals_total: "#238551", totals: "#32A467", normal: "#72CA9B" },
                                high: { totals_total: "#CD4246", totals: "#E76A6E", normal: "#FA999C" }
                            };
                            const level = inputData[key][index] < 0.7 ? "low" : (inputData[key][index] < 0.9 ? "correct" : "high");
                            const total_level = key === "TOTALS" ? (inputData["LINE"][index] === "TOTAL" ? "totals_total" : "totals") : (inputData["LINE"][index] === "TOTAL" ? "totals" : "normal");

                            cell.style.backgroundColor = ratioColors[level][total_level];
                        }
                        // Handling New Absorption (€)
                        if (metric === "New Absorption (€)" && key !== "PROJECTION" && key !== "LINE") {
                            let new_abs = inputData[key]?.[index]; // Use optional chaining
                            let initial_abs_indexes = inputData["PROJECTION"]?.map((elem, idx) => elem === "Initial Absorption (€)" ? idx : -1).filter(x => x !== -1) || [];
                            let initial_abs_index = initial_abs_indexes.map((elem) => inputData["LINE"]?.[elem] === inputData["LINE"]?.[index] ? elem : -1).filter(x => x !== -1)[0];
                            let init_abs = initial_abs_index !== undefined ? inputData[key]?.[initial_abs_index] : 0; // Ensure init_abs is defined

                            const arrowSpan = document.createElement("span");
                            if (new_abs !== undefined) {
                                arrowSpan.textContent = new_abs < init_abs ? "\u25BC" : "\u25B2";
                                arrowSpan.style.color = new_abs < init_abs ? "red" : "green";
                                const extraText = document.createTextNode(` ${new_abs.toLocaleString("en-us") || 0}`); // Use optional chaining

                                cell.textContent = "";
                                if (new_abs !== init_abs) cell.appendChild(arrowSpan);
                                cell.appendChild(extraText);
                            } else {
                                cell.textContent = "0"; // Default to 0 if new_abs is undefined
                            }
                        }
                        row.appendChild(cell);
                    }
                    if (num_lines === 2) {
                        row.style.borderBottom = "solid 1px #ddd";
                    }
                    tableBody.appendChild(row);
                }
            });
        }
    };

    const adjustSticky = () => {
        const table = document.querySelector("table") as HTMLTableElement;
        if (table) {
            const rows = Array.from(table.rows); // Convert NodeList to Array for easier manipulation

            rows.forEach(row => {
                const stickyColumns = row.querySelectorAll("th.sticky, td.sticky");
                let leftPositions: number[] = [];
                let cumulativeOffset = 0;

                stickyColumns.forEach((cell, index) => {
                    let maxWidth = 0;

                    rows.forEach(row => {
                        const currentCell = row.cells[index];
                        const cellWidth = currentCell.getBoundingClientRect().width;
                        maxWidth = Math.max(maxWidth, cellWidth);
                    });

                    leftPositions.push(cumulativeOffset);
                    cumulativeOffset += maxWidth;
                });

                stickyColumns.forEach((cell, index) => {
                    (cell as HTMLElement).style.left = leftPositions[index] + "px"; // Cast to HTMLElement
                    cell.classList.add("sticky-adjust");
                });
            });
        }
    };

    return (
        <div className='w-full chart-summary-table hide-scrollbar'>
            <table id="slider-summary-tables">
                <thead></thead>
                <tbody></tbody>
            </table>
        </div>
    );
};

export default CapacitySummaryTable;
