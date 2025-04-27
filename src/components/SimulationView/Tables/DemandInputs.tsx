/* eslint-disable react/prop-types */
// @ts-nocheck

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import './tables.css'
import axios from 'axios'
import { display_notification } from '../../../global/notification'
import {
  LdLoading,
  LdTypo,
  LdButton,
  LdModal,
  LdCheckbox,
  LdIcon,
} from '@emdgroup-liquid/liquid/dist/react'

const apiUrl = process.env.REACT_APP_API_URL

interface DemandInputTableProps {
  SimulationID: string
  Lines: string[]
  demandInputLoadAggData: any
  demandInputsData: any
  filterDemandInputsDataRef: any
  simulationLines: any
  onDemandSave: any
  getPlanDetailsLoadAgg: (SimulationID: string) => void
}

// Define the types for the state
interface DemandInputData {
  [key: string]: {
    IOP_BRAND: string[]
    IOP_PRODUCT: string[]
    LINES_NUMBER: string[]
    IOP_STRENGTH: string[]
    DATE: string[]
    [key: string]: any // for dynamic keys like date_HOURS
  }
}

interface RowData {
  IOP_BRAND: string[]
  IOP_PRODUCT: string[]
  LINES_NUMBER: string[]
  IOP_STRENGTH: string[]
  DATE: string[]
  [key: string]: any // Allow other keys with any type
}

interface EditedInputData {
  [line: string]: {
    [key: string]: any
  }
}

const allUnitsColumns = ['HOURS', 'QTY', 'BATCHES', 'PALLETS', 'ABSORPTION']
const allColumns = [
  'IOP_BRAND',
  'IOP_STRENGTH',
  'IOP_PRODUCT',
  'IOP_DESCR',
  'LINES_NUMBER',
  'UNIT_PER_PALLET',
  'OVERHEAD_COST_BY_UNIT',
  'PRODRATE',
  'BATCH_SIZE',
  'HOURS',
  'QTY',
  'BATCHES',
  'PALLETS',
  'ABSORPTION',
]
const initialFilterColumns = [
  'IOP_PRODUCT',
  'IOP_DESCR',
  'LINES_NUMBER',
  'PRODRATE',
  'BATCH_SIZE',
  'HOURS',
  'QTY',
  'BATCHES',
]
const allRateUnitColums = [
  'IOP_BRAND',
  'IOP_STRENGTH',
  'IOP_PRODUCT',
  'IOP_DESCR',
  'LINES_NUMBER',
  'UNIT_PER_PALLET',
  'OVERHEAD_COST_BY_UNIT',
  'PRODRATE',
  'BATCH_SIZE',
]

const DemandInputTable: React.FC<DemandInputTableProps> = ({
  demandInputsData,
  demandInputLoadAggData,
  SimulationID,
  Lines,
  filterDemandInputsDataRef,
  simulationLines,
  onDemandSave,
  getPlanDetailsLoadAgg,
}) => {
  const duplicateRow = useRef<{
    lineKey: string
    line: string
    lineIndex: number
  } | null>(null)
  // const [demandInputsData, setDemandInputsData] = useState<DemandInputData>({});
  // const [demandInputLoadAggData, setDemandInputLoadAggData] = useState<DemandInputData>({});
  const [loading, setLoading] = useState<boolean>(false)
  const [reloading, setReLoading] = useState<boolean>(false)
  const dropDownFields = [
    'IOP_BRAND',
    'IOP_PRODUCT',
    'LINES_NUMBER',
    'IOP_STRENGTH',
  ]
  const [updateInput, setUpdateInput] = useState<string[]>()
  const [filterColumns, setFilterColumns] =
    useState<string[]>(initialFilterColumns)
  const [isFilterColumModal, setIsFilterColumModal] = useState<boolean>(false)
  const [selectedNewSkuLine, setSelectedNewSkuLine] = useState<string>('')
  const [showDropdown, setShowDropdown] = useState<string | null>(null)
  const isAddNewSkuModal = useRef<any>(null)
  const editedInputDataRef = useRef([])
  const showTableColumns = allRateUnitColums.filter((column) =>
    filterColumns.includes(column)
  )
  const showUnitsColumns = allUnitsColumns.filter((column) =>
    filterColumns.includes(column)
  )

  const demandLoadAgg = useMemo(() => {
    const demandLoadAggData = demandInputLoadAggData
    // return {}
    return Object.keys(demandLoadAggData).reduce((obj, key) => {
      if (Lines.includes(key)) {
        obj[key] = demandLoadAggData[key]
      }
      return obj
    }, {} as DemandInputData)
  }, [demandInputLoadAggData, Lines])

  const { filterDemandInputsData, uniqueValues } = useMemo(() => {
    const filteredData: DemandInputData = {}
    const uniqueData: Record<string, Set<string>> = {}
    dropDownFields.forEach((field) => {
      uniqueData[field] = new Set<string>()
    })

    Object.keys(demandInputsData).forEach((key) => {
      if (Lines.includes(key)) {
        filteredData[key] = demandInputsData[key]
        dropDownFields.forEach((field) => {
          const values = demandInputsData[key][field]
          if (values) {
            values.forEach((value: string) => uniqueData[field].add(value))
          }
        })
      }
    })

    const result: Record<string, string[]> = Object.fromEntries(
      Object.entries(uniqueData).map(([field, values]) => [
        field,
        Array.from(values),
      ])
    )

    return { filterDemandInputsData: filteredData, uniqueValues: result }
  }, [demandInputsData, Lines])

  const simulationNewLine = Object.keys(demandInputsData)
  // const filterDemandInputsDataRef = useRef(filterDemandInputsData);

  // Effect to update the ref whenever the memoized values change
  useEffect(() => {
    filterDemandInputsDataRef.current = filterDemandInputsData // Update the ref with the latest filtered data
  }, [filterDemandInputsData])

  const rateEvent = useCallback(
    (
      linekey: string,
      productIndex: number,
      inputData: any,
      e: any,
      rate: string,
      target_unit: string,
      multiply = false,
      round_two = false,
      ceil = false
    ) => {
      const currentData = filterDemandInputsDataRef.current
      if (currentData[linekey] && currentData[linekey][rate]) {
        currentData[linekey][rate][productIndex] = parseFloat(e.target.value)
      }

      for (const key in inputData) {
        if (key.includes(target_unit) && !key.includes('ORIGINAL')) {
          const date = key.split('_').slice(0, 3).join('_')
          const unitKeyName = key.split('_').pop()

          // let qty_value = demandInputsData[linekey][`${date}_QTY`][productIndex];
          // const get_qty_value = document.getElementById(`input-box-${date}_QTY-${linekey}-${productIndex}`);
          // let qty_value = get_qty_value.value;
          // let qty_value = SlateFunctions.getState().input_output[`${date}_QTY`][index];
          let qty_value = currentData[linekey][`${date}_QTY`][productIndex]

          let unitValue
          if (multiply) {
            unitValue = qty_value * e.target.value
          } else {
            unitValue = e.target.value === 0 ? 0 : qty_value / e.target.value
          }
          unitValue = parseFloatNoNull(
            round_two
              ? parseFloat(unitValue.toFixed(2))
              : ceil
              ? Math.ceil(unitValue)
              : Math.round(unitValue)
          )
          saveRateUnitsContent(linekey, inputData, productIndex, key, unitValue)

          if (currentData[linekey] && currentData[linekey][key]) {
            currentData[linekey][key][productIndex] = unitValue
          }

          if (showUnitsColumns.includes(target_unit)) {
            const unitInput = document.getElementById(
              `input-box-${key}-${linekey}-${productIndex}`
            )
            unitInput.value = unitValue

            findRowTotalValue(key, `input-box-${key}`, `total-${key}`)
            let originalValueUnit =
              inputData[`${date}_ORIGINAL_${unitKeyName}`][productIndex]
            let cellColorUnit = getCellColor(unitValue, originalValueUnit)

            let unitCell = unitInput.parentElement
            unitInput.style.backgroundColor = cellColorUnit
            unitCell.style.backgroundColor = cellColorUnit
          }
        }
      }
    },
    []
  )

  const unitEvent = useCallback(
    (line: string, inputData: any, key: string, key_index: number, e: any) => {
      const date = key.split('_').slice(0, 3).join('_')
      const unit = key.split('_').pop()
      const currentData = filterDemandInputsDataRef.current
      let qty_value
      switch (unit) {
        case 'HOURS':
          // onst prodRate = SlateFunctions.getState().input_output.PRODRATE[index];
          // const prodRate = document.getElementById(`input-prodrate-${line}-${key_index}`).value;
          const prodRate = currentData[line].PRODRATE[key_index]
          qty_value = Math.round(e.target.value * prodRate)
          break
        case 'QTY':
          qty_value = parseFloat(e.target.value)
          break
        case 'BATCHES':
          // const batchSize = SlateFunctions.getState().input_output.BATCH_SIZE[index];
          // const batchSize = document.getElementById(`input-batch-size-${line}-${key_index}`).value;
          const batchSize = currentData[line].BATCH_SIZE[key_index]
          qty_value = Math.round(e.target.value * batchSize)
          break
        default:
          qty_value = 0
      }

      // SlateFunctions.setState(`input_output[${key}][${index}]`, e.target.value);
      currentData[line][key][key_index] = parseFloat(e.target.value)
      saveRateUnitsContent(
        line,
        inputData,
        key_index,
        key,
        parseFloat(e.target.value)
      )

      let unitBox = document.getElementById(
        `input-box-${date}_${unit}-${line}-${key_index}`
      )

      findRowTotalValue(
        `${date}_${unit}`,
        `input-box-${date}_${unit}`,
        `total-${key}`
      )

      // let original_value_unit = unitBox?.getAttribute('data-original-val'); lineData
      let original_value_unit = inputData[`${date}_ORIGINAL_${unit}`][key_index]

      const cellColorUnit = getCellColor(e.target.value, original_value_unit)
      const cellUnit = e.target.parentElement
      cellUnit.style.backgroundColor = cellColorUnit
      e.target.style.backgroundColor = cellColorUnit

      const units_to_adjust = [
        'HOURS',
        'QTY',
        'BATCHES',
        'PALLETS',
        'ABSORPTION',
      ].filter((x) => x !== unit)

      for (const unit_adj of units_to_adjust) {
        let unitValue
        switch (unit_adj) {
          case 'QTY':
            unitValue = qty_value
            break
          case 'HOURS':
            // const prodRate = SlateFunctions.getState().input_output.PRODRATE[index];
            // const prodRate = document.getElementById(`input-prodrate-${line}-${key_index}`).value
            const prodRate = currentData[line].PRODRATE[key_index]
            unitValue = parseIntNoNull(
              Math.round(prodRate === 0 ? 0 : qty_value / prodRate)
            )
            break
          case 'BATCHES':
            // const batchSize = SlateFunctions.getState().input_output.BATCH_SIZE[index];
            // const batchSize = document.getElementById(`input-batch-size-${line}-${key_index}`).value
            const batchSize = currentData[line].BATCH_SIZE[key_index]
            unitValue = parseFloatNoNull(
              parseFloat(
                (batchSize === 0 ? 0 : qty_value / batchSize).toFixed(2)
              )
            )
            break
          case 'PALLETS':
            // const unit_per_pallet = SlateFunctions.getState().input_output.UNIT_PER_PALLET[index];
            // const unit_per_pallet = document.getElementById(`input-unit-per-pallet-${line}-${key_index}`).value
            const unit_per_pallet = currentData[line].UNIT_PER_PALLET[key_index]
            unitValue = parseIntNoNull(
              Math.ceil(unit_per_pallet === 0 ? 0 : qty_value / unit_per_pallet)
            )
            break
          case 'ABSORPTION':
            // const overhead_cost_by_unit = SlateFunctions.getState().input_output.OVERHEAD_COST_BY_UNIT[index];
            // const overhead_cost_by_unit = document.getElementById(`input-overhead-cost-${line}-${key_index}`).value
            const overhead_cost_by_unit =
              currentData[line].OVERHEAD_COST_BY_UNIT[key_index]
            unitValue = parseIntNoNull(
              Math.round(qty_value * overhead_cost_by_unit)
            )
            break
          default:
            unitValue = 0
        }
        // SlateFunctions.setState(`input_output[${date}_${unit_adj}][${index}]`, unitValue);
        currentData[line][`${date}_${unit_adj}`][key_index] = unitValue
        saveRateUnitsContent(
          line,
          inputData,
          key_index,
          `${date}_${unit_adj}`,
          unitValue
        )

        // const get_total_val = document.getElementById(`total-${date}_${unit_adj}`)?.getAttribute('datatotal');
        // const total_unit_adj =  parseFloat(get_total_val) || 0 + unitValue;

        if (showUnitsColumns.includes(unit_adj)) {
          let cell_color_unit_adj
          let unitBox = document.getElementById(
            `input-box-${date}_${unit_adj}-${line}-${key_index}`
          )

          let original_value_unit_adj =
            inputData[`${date}_ORIGINAL_${unit_adj}`][key_index]
          unitBox.value = Number(unitValue)
          const event = new Event('input', { bubbles: true })
          unitBox.dispatchEvent(event) // Trigger the input event
          cell_color_unit_adj = getCellColor(unitValue, original_value_unit_adj)

          // Apply the background color to the parent cell and unitBox
          let unit_adj_cell = unitBox.parentElement
          unit_adj_cell.style.backgroundColor = cell_color_unit_adj
          unitBox.style.backgroundColor = cell_color_unit_adj

          findRowTotalValue(
            `${date}_${unit_adj}`,
            `input-box-${date}_${unit_adj}`,
            `total-${date}_${unit_adj}`
          )
        }
      }
    },
    []
  )

  const getCellColor = useCallback(
    (current_value: number, original_value: number) => {
      const colors = { low: '#D33D17', high: '#29A634', equal: 'white' }
      if (original_value !== undefined && original_value !== null) {
        if (current_value < original_value) return colors.low
        else if (current_value > original_value) return colors.high
        else return colors.equal
      } else {
        return current_value !== 0 ? colors.high : colors.equal
      }
    }
  )

  const saveEditedContent = (
    lineKey,
    lineData,
    productIndex,
    key_string,
    event
  ) => {
    // Extract date and unit from key_string
    const parts = key_string.split('_')
    const unit_type = parts.pop()
    const dateParts = parts.join('_').split('_')

    // Assuming dateParts is in the format [year, month, day]
    const formattedDate = `${dateParts[0]}-${dateParts[1].padStart(
      2,
      '0'
    )}-${dateParts[2].padStart(2, '0')}`
    const unit = unit_type.toLowerCase()
    // const prodRate = document.getElementById(`input-prodrate-${lineKey}-${productIndex}`).value;

    const newEntry = {
      line: lineKey,
      iop_product: lineData.IOP_PRODUCT[productIndex],
      date: formattedDate,
    }

    // Ensure current is an array before using findIndex
    if (!Array.isArray(editedInputDataRef.current)) {
      editedInputDataRef.current = [] // Reset to an empty array if it's not
    }

    // Check if the entry already exists
    const existingIndex = editedInputDataRef.current.findIndex(
      (entry) =>
        entry.line === newEntry.line &&
        entry.iop_product === newEntry.iop_product &&
        entry.date === newEntry.date
    )

    if (existingIndex !== -1) {
      // Update the existing entry
      editedInputDataRef.current[existingIndex] = {
        ...editedInputDataRef.current[existingIndex],
        [unit]: event.target.value, // Update the dynamic key
      }
    } else {
      // Add a new entry
      editedInputDataRef.current.push({
        ...newEntry,
        [unit]: event.target.value, // Set the dynamic key
      })
    }
    console.log(editedInputDataRef.current)
  }

  const saveRateUnitsContent = (
    lineKey,
    lineData,
    productIndex,
    key_string,
    value
  ) => {
    // Extract date and unit from key_string
    const parts = key_string.split('_')
    const unit_type = parts.pop()
    const dateParts = parts.join('_').split('_')

    // Assuming dateParts is in the format [year, month, day]
    const formattedDate = `${dateParts[0]}-${dateParts[1].padStart(
      2,
      '0'
    )}-${dateParts[2].padStart(2, '0')}`
    const unit = unit_type.toLowerCase()
    // const prodRate = document.getElementById(`input-prodrate-${lineKey}-${productIndex}`).value;

    const newEntry = {
      line: lineKey,
      iop_product: lineData.IOP_PRODUCT[productIndex],
      date: formattedDate,
    }

    // Ensure current is an array before using findIndex
    if (!Array.isArray(editedInputDataRef.current)) {
      editedInputDataRef.current = [] // Reset to an empty array if it's not
    }

    // Check if the entry already exists
    const existingIndex = editedInputDataRef.current.findIndex(
      (entry) =>
        entry.line === newEntry.line &&
        entry.iop_product === newEntry.iop_product &&
        entry.date === newEntry.date
    )

    if (existingIndex !== -1) {
      // Update the existing entry
      editedInputDataRef.current[existingIndex] = {
        ...editedInputDataRef.current[existingIndex],
        [unit]: value, // Update the dynamic key
      }
    } else {
      // Add a new entry
      editedInputDataRef.current.push({
        ...newEntry,
        [unit]: value, // Set the dynamic key
      })
    }
  }

  const saveRateContent = (
    lineKey,
    product,
    productIndex,
    key_string,
    event
  ) => {
    const newEntry = {
      line: lineKey,
      iop_product: product,
    }

    if (!Array.isArray(editedInputDataRef.current)) {
      editedInputDataRef.current = [] // Reset to an empty array if it's not
    }

    const existingIndex = editedInputDataRef.current.findIndex(
      (entry) =>
        entry.line === newEntry.line &&
        entry.iop_product === newEntry.iop_product
    )

    if (existingIndex !== -1) {
      // Update the existing entry
      editedInputDataRef.current[existingIndex] = {
        ...editedInputDataRef.current[existingIndex],
        [key_string]: event.target.value, // Update the dynamic key
      }
    } else {
      // Add a new entry
      editedInputDataRef.current.push({
        ...newEntry,
        [key_string]: event.target.value, // Set the dynamic key
      })
    }
  }

  const findRowTotalValue = (unit_key, baseClassName, totalRowID) => {
    const selectedLines = Lines
    const totalValues = {} // Object to hold totals for each line key
    let total = 0
    // const total_unit_adj = parseFloatNoNull(SlateFunctions.getState()['input_output'][`${date}_${unit_adj}`].reduce((acc, value) => acc + parseFloatNoNull(value), 0));
    // Create a single batch of input values
    const currentData = filterDemandInputsDataRef.current
    const total_unit_adj = parseFloatNoNull(
      selectedLines.reduce((acc, lineKey) => {
        const lineValue = currentData[lineKey]?.[unit_key] // Access the unit_key for each lineKey
        if (Array.isArray(lineValue)) {
          return (
            acc +
            lineValue.reduce(
              (innerAcc, value) => innerAcc + parseFloatNoNull(value),
              0
            )
          ) // Sum the values for each lineKey
        }
        return acc // If lineValue is not an array, just return the accumulator
      }, 0) // Initialize accumulator to 0
    )

    // const inputValues = selectedNewSkuLine.reduce((acc, linekey) => {
    //     if (filterDemandInputsData[linekey]) {
    //         const rowCount = filterDemandInputsData[linekey].IOP_PRODUCT.length;

    //         for (let j = 0; j < rowCount; j++) {
    //             const inputField = document.getElementById(`${baseClassName}-${linekey}-${j}`);
    //             if (inputField) {
    //                 const value = parseFloat(inputField.value) || 0;
    //                 acc[linekey] = (acc[linekey] || 0) + value; // Sum values for each line key
    //                 total += value; // Aggregate total
    //             } else {
    //                 console.warn(`Input field not found: ${baseClassName}-${linekey}-${j}`);
    //             }
    //         }
    //     }
    //     return acc;
    // }, {});

    // Update the total cell
    const totalCell = document.getElementById(totalRowID)
    if (totalCell) {
      totalCell.textContent = Number(total_unit_adj).toLocaleString('en-us') // Update the total display
    } else {
      console.warn(`Total cell not found: ${totalRowID}`)
    }
  }

  const adjustSticky = () => {
    const table = document.getElementById('demandInputTbl') as HTMLTableElement // Get the table by ID
    if (!table) return // Exit if the table is not found

    const rows = Array.from(table.rows) // Convert NodeList to Array for easier manipulation

    // Find all sticky columns in each row
    rows.forEach((row: HTMLTableRowElement) => {
      const stickyColumns = row.querySelectorAll(
        'th.sticky, td.sticky'
      ) as NodeListOf<HTMLTableCellElement>

      // Calculate left positions for each sticky column
      let leftPositions: number[] = [] // Specify the type as number[]
      let cumulativeOffset = 0

      stickyColumns.forEach((cell: HTMLTableCellElement, index: number) => {
        let maxWidth = 0

        // Iterate through each row to find the maximum width of the current column
        rows.forEach((row: HTMLTableRowElement) => {
          const currentCell = row.cells[index]
          if (currentCell) {
            // Check if currentCell is defined
            const cellWidth = currentCell.getBoundingClientRect().width
            maxWidth = Math.max(maxWidth, cellWidth)
          }
        })

        // Store the cumulative offset for the current sticky column
        leftPositions.push(cumulativeOffset)
        cumulativeOffset += maxWidth
      })

      // Apply the left positions to each sticky column
      stickyColumns.forEach((cell: HTMLTableCellElement, index: number) => {
        const stickyCell = cell as HTMLElement // Type assertion to HTMLElement
        stickyCell.style.left = leftPositions[index] + 'px'
        stickyCell.classList.add('sticky-adjust')
      })
    })
  }

  function formatWithCommas(value: any) {
    if (value === null || value === undefined || value === '') return ''
    const stringValue = typeof value === 'string' ? value : String(value)
    return Number(stringValue.replace(/,/g, '')).toLocaleString('en-US')
  }

  function parseFloatNoNull(x: any) {
    return parseFloat(x) ? parseFloat(x) : 0
  }

  function parseIntNoNull(x: any) {
    return parseInt(x) ? parseInt(x) : 0
  }

  const toggleDropdown = useCallback((dropdown) => {
    const allDropdowns = document.querySelectorAll('.filter-dropdown')
    allDropdowns.forEach((d) => {
      if (d !== dropdown) {
        d.classList.add('hidden') // Add the 'hidden' class to hide other dropdowns
      }
    })

    dropdown.classList.toggle('hidden')
  }, [])

  const filterTable = useCallback((e, column) => {
    const selectedValue = e.target.value
    const columnIndex = showTableColumns.indexOf(column) + 2

    const table = document.getElementById('products-table')
    const rows = table.querySelectorAll('tbody tr')

    rows.forEach((row) => {
      const cell = row.cells[columnIndex]
      if (cell) {
        // Check if the cell's text matches the selected value or if "ALL" is selected
        if (selectedValue === '' || cell.textContent === selectedValue) {
          row.style.display = '' // Show the row
        } else {
          row.style.display = 'none' // Hide the row
        }
      }
    })
  }, [])

  const handleNewSkuselection = (value: string) => {
    setSelectedNewSkuLine(value)
  }

  const openAddnewSku = () => {
    setSelectedNewSkuLine(Lines[0])
    isAddNewSkuModal.current?.showModal()
  }

  const addNewSkuAPIcall = async () => {
    if (selectedNewSkuLine != '') {
      isAddNewSkuModal.current?.close()
      display_notification('info', 'Adding New Row...')
      try {
        const res = await axios.post(
          `${apiUrl}/simulation/${SimulationID}/planDetails/newSKU?simulation_id=${SimulationID}`,
          { line: selectedNewSkuLine }
        )

        // Check if the response data is an array and has a message
        if (res && Array.isArray(res.data) && res.data.length > 0) {
          getPlanDetailsLoadAgg(SimulationID)
        }
      } catch (err) {
        console.error(err) // Log the error for debugging
        display_notification(
          'error',
          'An error occurred while adding the new SKU. Please try again.'
        )
        return null // Return null on error
      }
    } else {
      display_notification(
        'alert',
        'Your request to add New SKU API. Please try again.'
      )
      return null // Return null if validation fails
    }
  }

  const duplicateRowApiCall = async () => {
    if (duplicateRow.current !== null && duplicateRow.current.line) {
      const lineData = duplicateRow.current.line
      if (lineData) {
        const postData = {
          line: duplicateRow.current.lineKey,
          iop_product: lineData.IOP_PRODUCT[duplicateRow.current.lineIndex],
          iop_brand: lineData.IOP_BRAND[duplicateRow.current.lineIndex],
          iop_strength: lineData.IOP_STRENGTH[duplicateRow.current.lineIndex],
          iop_descr: lineData.IOP_DESCR[duplicateRow.current.lineIndex],
          prodrate: lineData.PRODRATE[duplicateRow.current.lineIndex],
          batch_size: lineData.BATCH_SIZE[duplicateRow.current.lineIndex],
          unit_per_pallet:
            lineData.UNIT_PER_PALLET[duplicateRow.current.lineIndex],
          overhead_cost_by_unit:
            lineData.OVERHEAD_COST_BY_UNIT[duplicateRow.current.lineIndex],
        }

        // Assuming you want to create an array of duplicate objects based on the keys of lineData
        const duplicateObjects = Object.keys(lineData).map((key) => ({
          key: key,
          value: lineData[key][duplicateRow.current.lineIndex], // Extracting the value for the current line index
        }))

        // Assuming you have a function to set demand inputs data

        display_notification('info', 'Duplicating selected row...')
        try {
          const res = await axios.post(
            `${apiUrl}/simulation/${SimulationID}/planDetails/duplicateSKU?simulation_id=${SimulationID}`,
            postData
          )
          if (res.data) {
            getPlanDetailsLoadAgg(SimulationID)
          }
        } catch (err) {
          display_notification(
            'alert',
            'Your request to add New SKU failed. Please try again.'
          )
        }
      } else {
        display_notification('alert', 'Selected row data not found.')
      }
    } else {
      display_notification('alert', 'Please select checkbox to copy the row')
    }
  }

  function parseApiResponse(responseString) {
    // Convert the response string to a valid JSON string
    const jsonString = responseString
      .replace(/'/g, '"') // Replace single quotes with double quotes
      .replace(/([{,])\s*([^:]+)\s*:/g, '$1"$2":') // Add double quotes around keys
      .replace(/(\s*:\s*)(\d+)/g, '$1"$2"') // Ensure numeric values are treated as strings (optional)

    let jsonData
    try {
      jsonData = JSON.parse(jsonString)
      return jsonData // Return the parsed JSON object
    } catch (error) {
      console.error('Error parsing JSON:', error)
      return null // Return null on error
    }
  }

  const saveDemandInput = async () => {
    display_notification('info', 'Saving plan detail changes...')
    if (
      editedInputDataRef.current !== null &&
      editedInputDataRef.current.length > 0
    ) {
      try {
        const res = await axios.post(
          `${apiUrl}/simulation/${SimulationID}/planDetails/edits?simulation_id=${SimulationID}`,
          { payload: editedInputDataRef.current }
        )

        if (res && res.data) {
          display_notification('info', 'Demand details have been saved.')
          getPlanDetailsLoadAgg(SimulationID)
        } else {
          display_notification(
            'alert',
            'We are unable to process your request at this moment. Please refresh the page.'
          )
        }
      } catch (err) {
        display_notification(
          'alert',
          'We are unable to process your request at this moment. Please refresh the page.'
        )
      }
    } else {
      display_notification(
        'alert',
        'No data to save. Please modify unit value data before saving.'
      )
    }
  }

  const handleCheckboxChange = useCallback(
    (lineKey, lineData, productIndex, event) => {
      const currentCheckbox = event.target

      if (currentCheckbox.checked) {
        const selectedRow = {
          lineKey: lineKey,
          line: lineData,
          lineIndex: productIndex,
        }
        duplicateRow.current = selectedRow // Corrected assignment to use '='
        const checkboxes = document.querySelectorAll('input[type="checkbox"]')
        checkboxes.forEach((checkbox) => {
          if (checkbox !== currentCheckbox) {
            checkbox.checked = false
          }
        })
      } else {
        duplicateRow.current = null // Set to null when checkbox is unchecked
      }
    },
    []
  )

  const Row = useCallback(
    ({ lineKey, lineData }: { lineKey: string; lineData: RowData }) => {
      if (!lineData) return null
      return (
        <React.Fragment>
          {lineData.IOP_PRODUCT.map((product, productIndex) => (
            <tr key={`${lineKey}-${productIndex}`}>
              <td className='sticky first_cell'>
                <input
                  type='checkbox'
                  onChange={(e) =>
                    handleCheckboxChange(lineKey, lineData, productIndex, e)
                  }
                  value={lineKey}
                />
              </td>
              <td className='sticky line_cell'>{lineKey}</td>
              {showTableColumns.includes('IOP_BRAND') && (
                <td className='sticky IOP_BRAND'>
                  {lineData.IOP_BRAND[productIndex]}
                </td>
              )}
              {showTableColumns.includes('IOP_STRENGTH') && (
                <td className='sticky IOP_STRENGTH'>
                  {lineData.IOP_STRENGTH[productIndex]}
                </td>
              )}
              {showTableColumns.includes('IOP_PRODUCT') && (
                <td className='sticky IOP_PRODUCT'>{product}</td>
              )}
              {showTableColumns.includes('IOP_DESCR') && (
                <td className='sticky IOP_DESCR'>
                  {lineData.IOP_DESCR[productIndex]}
                </td>
              )}
              {showTableColumns.includes('LINES_NUMBER') && (
                <td className='sticky LINES_NUMBER'>
                  {lineData.LINES_NUMBER[productIndex]}
                </td>
              )}
              {showTableColumns.includes('UNIT_PER_PALLET') && (
                <td
                  className='sticky UNIT_PER_PALLET'
                  style={{ backgroundColor: 'white' }}
                >
                  <input
                    type='number'
                    className='readonly-input'
                    readOnly
                    contentEditable='false'
                    id={`input-unit-per-pallet-${lineKey}-${productIndex}`}
                    defaultValue={lineData.UNIT_PER_PALLET[productIndex] || 0}
                    tabIndex='-1'
                  />
                </td>
              )}
              {showTableColumns.includes('OVERHEAD_COST_BY_UNIT') && (
                <td
                  className='sticky OVERHEAD_COST_BY_UNIT'
                  style={{ backgroundColor: 'white' }}
                >
                  <input
                    type='number'
                    readOnly
                    className='readonly-input'
                    id={`input-overhead-cost-${lineKey}-${productIndex}`}
                    defaultValue={
                      lineData.OVERHEAD_COST_BY_UNIT[productIndex] || 0
                    }
                    tabIndex='-1'
                  />
                </td>
              )}
              {showTableColumns.includes('PRODRATE') && (
                <td
                  className='sticky PRODRATE'
                  style={{ backgroundColor: 'white' }}
                >
                  <input
                    type='number'
                    id={`input-prodrate-${lineKey}-${productIndex}`}
                    defaultValue={lineData.PRODRATE[productIndex] || 0} // Use state value
                    onChange={(e) =>
                      rateEvent(
                        lineKey,
                        productIndex,
                        lineData,
                        e,
                        'PRODRATE',
                        'HOURS',
                        false,
                        false,
                        false
                      )
                    }
                    onBlur={(e) =>
                      saveRateContent(
                        lineKey,
                        lineData['IOP_PRODUCT'][productIndex],
                        productIndex,
                        'prodrate',
                        e
                      )
                    }
                  />
                </td>
              )}
              {showTableColumns.includes('BATCH_SIZE') && (
                <td
                  className='sticky BATCH_SIZE'
                  style={{ backgroundColor: 'white' }}
                >
                  <input
                    type='number'
                    id={`input-batch-size-${lineKey}-${productIndex}`}
                    defaultValue={lineData.BATCH_SIZE[productIndex] || 0}
                    onChange={(e) =>
                      rateEvent(
                        lineKey,
                        productIndex,
                        lineData,
                        e,
                        'BATCH_SIZE',
                        'BATCHES',
                        false,
                        false,
                        false
                      )
                    }
                  />
                </td>
              )}
              {Object.keys(demandLoadAgg).map((agglineKey) => {
                const loadLineData = demandLoadAgg[agglineKey]
                return loadLineData.DATE.map((date, dateIndex) => {
                  const formattedDate = date.replace(/-/g, '_') // Change date format
                  return (
                    <React.Fragment
                      key={`${agglineKey}-${productIndex}-${dateIndex}`}
                    >
                      {['HOURS', 'QTY', 'BATCHES', 'PALLETS', 'ABSORPTION'].map(
                        (unit) =>
                          showUnitsColumns.includes(unit)
                            ? (() => {
                                const originalVal =
                                  lineData[
                                    `${formattedDate}_ORIGINAL_${unit}`
                                  ]?.[productIndex] ?? 0
                                const editValArray =
                                  filterDemandInputsDataRef.current[lineKey]?.[
                                    `${formattedDate}_${unit}`
                                  ] || []
                                const editVal = editValArray[productIndex]
                                const defaultVal =
                                  editVal ??
                                  lineData[`${formattedDate}_${unit}`]?.[
                                    productIndex
                                  ] ??
                                  0
                                return (
                                  <td
                                    key={`${unit}-${agglineKey}-${productIndex}-${dateIndex}`}
                                    style={{
                                      backgroundColor: getCellColor(
                                        defaultVal,
                                        originalVal
                                      ),
                                    }}
                                  >
                                    <input
                                      type='number'
                                      id={`input-box-${formattedDate}_${unit}-${lineKey}-${productIndex}`}
                                      data-original-val={originalVal}
                                      data-column={productIndex}
                                      style={{
                                        backgroundColor: getCellColor(
                                          defaultVal,
                                          originalVal
                                        ),
                                      }}
                                      defaultValue={defaultVal}
                                      readOnly={[
                                        'PALLETS',
                                        'ABSORPTION',
                                      ].includes(unit)} // Set readOnly for specific units
                                      onChange={
                                        ['PALLETS', 'ABSORPTION'].includes(unit)
                                          ? undefined
                                          : (e) =>
                                              unitEvent(
                                                lineKey,
                                                lineData,
                                                `${formattedDate}_${unit}`,
                                                productIndex,
                                                e
                                              )
                                      }
                                      // onBlur={["PALLETS", "ABSORPTION"].includes(unit) ? undefined : (e) => saveEditedContent(lineKey, lineData, productIndex, `${formattedDate}_${unit}`, e)}
                                    />
                                  </td>
                                )
                              })()
                            : null
                      )}
                    </React.Fragment>
                  )
                })
              })}
            </tr>
          ))}
        </React.Fragment>
      )
    }
  )

  if (!Object.keys(demandLoadAgg).length) {
    return (
      <div className='text-center mt-4'>
        <LdLoading /> <LdTypo>Loading Demand Input Data...</LdTypo>
      </div>
    )
  }

  return (
    <div className='mt-4'>
      {Object.keys(demandLoadAgg).length > 0 ? (
        <div className='overflow-hidden'>
          <div className='flex items-center mt-2 space-x-2 justify-end px-2'>
            <LdButton
              size='sm'
              onClick={onDemandSave}
              className='simulationView-header-button'
            >
              Update chart & Table
            </LdButton>
            <LdButton
              size='sm'
              onClick={openAddnewSku}
              className='simulationView-header-button'
            >
              Add New Row
            </LdButton>
            <LdButton
              mode='highlight'
              disabled
              size='sm'
              className='simulationView-header-button'
            >
              Reset Data
            </LdButton>
            <LdButton
              size='sm'
              onClick={saveDemandInput}
              className='simulationView-header-button'
            >
              Save Data
            </LdButton>
            <LdButton
              size='sm'
              onClick={duplicateRowApiCall}
              className='simulationView-header-button'
            >
              Duplicate Row
            </LdButton>
            <LdButton
              size='sm'
              onClick={() => setIsFilterColumModal(true)}
              className='ld-theme-tea simulationView-header-button'
            >
              Select Columns
            </LdButton>
          </div>
          <div id='demandInputTbl' className='mt-4 max-h-[32rem] overflow-auto'>
            <table id='products-table'>
              <thead>
                {/* First table tr start */}
                {showUnitsColumns && showUnitsColumns.length > 0 ? (
                  <tr>
                    <th
                      style={{ width: '40px' }}
                      colSpan={showTableColumns.length + 2}
                      className='sticky first_cell'
                    ></th>
                    {Object.keys(demandLoadAgg).map((lineKey, index) => {
                      const lineData = demandLoadAgg[lineKey]
                      return lineData.DATE.map((date, dateIndex) => (
                        <th
                          className='dm-custom-th'
                          key={`date-header-${date}-${dateIndex}`}
                          colSpan={showUnitsColumns.length}
                        >
                          {date.replace(/_/g, '-')}
                        </th>
                      ))
                    })}
                  </tr>
                ) : null}
                {/* End First table tr start */}
                {/*---------------- Dynamic tr with show columns table tr start------------------------- */}
                <tr>
                  <th
                    style={{ width: '40px' }}
                    className='sticky first_cell'
                  ></th>
                  <th className='sticky line_cell'>
                    LINE <span className='filter-icon'>▼</span>
                    <br />
                    <div>
                      <select
                        onChange={(e) => filterTable(e, 'LINE')}
                        className='flex-none filter-dropdown hidden'
                        placeholder='ALL'
                      >
                        <option key='' value=''>
                          ALL
                        </option>
                        {Lines.map((line) => (
                          <option key={`line-option-${line}`} value={line}>
                            {line}
                          </option>
                        ))}
                      </select>
                    </div>
                  </th>
                  {showTableColumns.map((col, index) => (
                    <th
                      key={`header-${col}-${index}`}
                      className={`sticky ${col}`}
                    >
                      {col === 'LINES_NUMBER' ||
                      col === 'IOP_BRAND' ||
                      col === 'IOP_PRODUCT' ||
                      col === 'IOP_STRENGTH' ? (
                        <>
                          {col
                            .replace(/IOP_/g, '')
                            .replace(/_/g, ' ')
                            .toUpperCase()}
                          <span
                            onClick={(e) =>
                              toggleDropdown(e.currentTarget.nextElementSibling)
                            }
                            className='filter-icon'
                          >
                            ▼
                          </span>
                          <select
                            onChange={(e) => filterTable(e, col)}
                            className='flex-none filter-dropdown hidden'
                            placeholder='ALL'
                          >
                            <option key='' value=''>
                              ALL
                            </option>
                            {uniqueValues[col].map((value) => (
                              <option
                                key={`value-option-${value}`}
                                value={value}
                              >
                                {value}
                              </option>
                            ))}
                          </select>
                        </>
                      ) : (
                        col
                          .replace(/IOP_/g, '')
                          .replace(/_/g, ' ')
                          .toUpperCase()
                      )}
                    </th>
                  ))}
                  {/* ------------------------------Date based header start here------------------------  */}
                  {Object.keys(demandLoadAgg).map((lineKey, index) => {
                    const lineData = demandLoadAgg[lineKey]
                    return lineData.DATE.map((date, dateIndex) => (
                      <React.Fragment key={`units-header-${date}-${dateIndex}`}>
                        {showUnitsColumns.includes('HOURS') && (
                          <th key={`hours-header-${date}`}>HOURS </th>
                        )}
                        {showUnitsColumns.includes('QTY') && (
                          <th key={`qty-header-${date}`}>QTY </th>
                        )}
                        {showUnitsColumns.includes('BATCHES') && (
                          <th key={`batches-header-${date}`}>BATCHES </th>
                        )}
                        {showUnitsColumns.includes('PALLETS') && (
                          <th key={`pallets-header-${date}`}>PALLETS </th>
                        )}
                        {showUnitsColumns.includes('ABSORPTION') && (
                          <th key={`absorption-header-${date}`}>ABSORPTION </th>
                        )}
                      </React.Fragment>
                    ))
                  })}
                  {/* ------------------------------End Date based header start here--------------------  */}
                </tr>
                {/* --------------------------------- Totals -------------------------------------- */}
                {showUnitsColumns && showUnitsColumns.length > 0 ? (
                  <tr>
                    <th
                      className='sticky dm-custom-total first_cell'
                      colSpan={showTableColumns.length + 2}
                    ></th>
                    {Object.keys(demandLoadAgg).map((lineKey, index) => {
                      const lineData = demandLoadAgg[lineKey]
                      return lineData.DATE.map((date, dateIndex) => {
                        const formattedDate = date.replace(/-/g, '_') // Change date format
                        return (
                          <React.Fragment
                            key={`units-header-${formattedDate}-${dateIndex}`}
                          >
                            {showUnitsColumns.includes('HOURS') && (
                              <th key={`hours-total-header-${formattedDate}`}>
                                <span
                                  datatotal={lineData.HOURS[dateIndex]}
                                  className='head_total'
                                  id={`total-${formattedDate}_HOURS`}
                                >
                                  {formatWithCommas(lineData.HOURS[dateIndex])}
                                </span>
                              </th>
                            )}
                            {showUnitsColumns.includes('QTY') && (
                              <th key={`qty-total-header-${formattedDate}`}>
                                <span
                                  datatotal={lineData.QTY[dateIndex]}
                                  className='head_total'
                                  id={`total-${formattedDate}_QTY`}
                                >
                                  {formatWithCommas(lineData.QTY[dateIndex])}
                                </span>
                              </th>
                            )}
                            {showUnitsColumns.includes('BATCHES') && (
                              <th key={`batches-total-header-${formattedDate}`}>
                                <span
                                  datatotal={lineData.BATCHES[dateIndex]}
                                  className='head_total'
                                  id={`total-${formattedDate}_BATCHES`}
                                >
                                  {formatWithCommas(
                                    lineData.BATCHES[dateIndex]
                                  )}
                                </span>
                              </th>
                            )}
                            {showUnitsColumns.includes('PALLETS') && (
                              <th key={`pallets-total-header-${formattedDate}`}>
                                <span
                                  datatotal={lineData.PALLETS[dateIndex]}
                                  className='head_total'
                                  id={`total-${formattedDate}_PALLETS`}
                                >
                                  {formatWithCommas(
                                    lineData.PALLETS[dateIndex]
                                  )}
                                </span>
                              </th>
                            )}
                            {showUnitsColumns.includes('ABSORPTION') && (
                              <th
                                key={`absorption-total-header-${formattedDate}`}
                              >
                                <span
                                  datatotal={lineData.ABSORPTION[dateIndex]}
                                  className='head_total'
                                  id={`total-${formattedDate}_ABSORPTION`}
                                >
                                  {formatWithCommas(
                                    lineData.ABSORPTION[dateIndex]
                                  )}
                                </span>
                              </th>
                            )}
                          </React.Fragment>
                        )
                      })
                    })}
                  </tr>
                ) : null}
                {/* --------------------------------- End Totals -------------------------------------- */}
              </thead>
              <tbody>
                {/* ------------------------------Dynamic tbody start ------------ */}
                {Object.keys(filterDemandInputsData).map((lineKey) => {
                  const lineData = filterDemandInputsData[lineKey] // Access lineData using lineKey
                  return (
                    <Row key={lineKey} lineKey={lineKey} lineData={lineData} />
                  )
                })}
                {/* ------------------------------Dynamic tbody end ------------ */}
              </tbody>
            </table>
          </div>
          {/*  Ldmodal display column  */}
          <LdModal
            blurryBackdrop
            open={isFilterColumModal}
            onLdmodalclosed={() => setIsFilterColumModal(false)}
            cancelable={true}
          >
            <LdTypo slot='header'>Columns to Display</LdTypo>
            <div className='max-h-[300px] overflow-y-scroll hide-scrollbar'>
              {allColumns.map((column) => (
                <div
                  key={`column-display-${column}`}
                  className='flex items-center mb-2'
                >
                  <LdCheckbox
                    checked={filterColumns.includes(column)}
                    onLdchange={() =>
                      setFilterColumns((prev) =>
                        prev.includes(column)
                          ? prev.filter((item) => item !== column)
                          : [...prev, column]
                      )
                    }
                  />
                  <LdTypo className='ml-2'>{column.replace(/_/g, ' ')}</LdTypo>
                </div>
              ))}
            </div>
          </LdModal>
          {/* End display column */}
          {/*  Ldmodal Add New SKU column  */}
          <LdModal blurryBackdrop cancelable={true} ref={isAddNewSkuModal}>
            <LdTypo slot='header'>Add new SKU</LdTypo>
            <div className='max-h-[200px] w-[400px]'>
              <div className='flex flex-col mb-2 '>
                <LdTypo variant='h6'>
                  Select the line you want to add the SKU to:
                </LdTypo>
                <select
                  className='flex-none w-full mt-4 mb-4 border addNewskuSelect'
                  onChange={(e) => handleNewSkuselection(e.target.value)}
                >
                  {Lines && Lines.length === 0 ? (
                    <option disabled>No matches found</option>
                  ) : (
                    Lines.map((line) => (
                      // !simulationNewLine.includes(line) && (
                      <option key={`line-select-${line}`} value={line}>
                        {line}
                      </option>
                      // )
                    ))
                  )}
                </select>
              </div>
            </div>
            <div className='flex justify-center mt-6'>
              <LdButton
                size='sm'
                className='ld-theme-tea w-full mx-auto '
                onClick={addNewSkuAPIcall}
              >
                <LdIcon size='sm' name='checkmark' /> Add New Row
              </LdButton>
            </div>
          </LdModal>
          {/* End new SKU column */}
        </div>
      ) : (
        <div>No Demand Input table Data Available for selected Lines</div>
      )}
    </div>
  )
}

export default DemandInputTable
