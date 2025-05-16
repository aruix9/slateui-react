/* eslint-disable react/prop-types */
// @ts-nocheck

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
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
import './inputTables.css'
import { replace } from 'react-router-dom'

const apiUrl = process.env.REACT_APP_API_URL
interface DemandInputTableProps {
  SimulationID: string
  Lines: string[]
  demandInputLoadAggData: any
  demandInputsData: any
  filterDemandInputsDataRef: any
  simulationLines: any
  onDemandSave: any
  editedInputDataRef: any
  getPlanDetailsLoadAgg: (SimulationID: string) => void
}

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

const aggregateData = (data, Lines) => {
  const aggregatedResultsCol = {}

  for (const [line, lineData] of Object.entries(data)) {
    if (Lines.includes(line)) {
      for (const key in lineData) {
        const [date, month, day, unit, original] = key.split('_')
        const parts = key.split('_')
        const unit_type = parts.pop()
        const formattedDate = parts.join('-')

        if (
          ['HOURS', 'QTY', 'BATCHES', 'PALLETS', 'ABSORPTION'].includes(unit) &&
          original !== 'ORIGINAL'
        ) {
          if (!aggregatedResultsCol[formattedDate]) {
            aggregatedResultsCol[formattedDate] = {
              HOURS: 0,
              QTY: 0,
              BATCHES: 0,
              PALLETS: 0,
              ABSORPTION: 0,
            }
          }
          const values = lineData[key]
          const total = values.reduce((acc, value) => acc + value, 0)
          aggregatedResultsCol[formattedDate][unit] += Math.round(total)
        }
      }
    }
  }

  const sortedAggregatedResultsCol = Object.keys(aggregatedResultsCol)
    .sort((a, b) => new Date(a) - new Date(b))
    .reduce((acc, date) => {
      acc[date] = aggregatedResultsCol[date]
      return acc
    }, {})

  return sortedAggregatedResultsCol
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
const dropDownFields = [
  'IOP_BRAND',
  'IOP_PRODUCT',
  'LINES_NUMBER',
  'IOP_STRENGTH',
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
  editedInputDataRef,
  getPlanDetailsLoadAgg,
}) => {
  const duplicateRow = useRef<{
    lineKey: string
    line: string
    lineIndex: number
  } | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [updateInput, setUpdateInput] = useState<string[]>()
  const [filterColumns, setFilterColumns] =
    useState<string[]>(initialFilterColumns)
  const [isFilterColumModal, setIsFilterColumModal] = useState<boolean>(false)
  const [selectedNewSkuLine, setSelectedNewSkuLine] = useState<string>('')
  const [showDropdown, setShowDropdown] = useState<string | null>(null)
  const isAddNewSkuModal = useRef<any>(null)
  const showTableColumns = allRateUnitColums.filter((column) =>
    filterColumns.includes(column)
  )
  const showUnitsColumns = allUnitsColumns.filter((column) =>
    filterColumns.includes(column)
  )

  const { filterDemandInputsData, uniqueValues } = useMemo(() => {
    setLoading(true)

    const filteredData: DemandInputData = {}
    const uniqueData: Record<string, Set<string>> = {}

    dropDownFields.forEach((field) => {
      uniqueData[field] = new Set<string>()
    })

    const demandKeys = Object.keys(demandInputsData)

    for (let i = 0; i < demandKeys.length; i++) {
      const key = demandKeys[i]
      if (Lines.includes(key)) {
        if (!filteredData[key]) {
          filteredData[key] = {}
        }
        Object.assign(filteredData[key], demandInputsData[key])

        for (const field of dropDownFields) {
          const values = demandInputsData[key][field]
          if (values) {
            values.forEach((value: string) => uniqueData[field].add(value))
          }
        }
      }
    }

    const result: Record<string, string[]> = {}
    for (const field of dropDownFields) {
      result[field] = Array.from(uniqueData[field]).sort((a, b) => {
        const numA = Number(a)
        const numB = Number(b)
        if (!isNaN(numA) && !isNaN(numB)) {
          return numA - numB
        }
        // return a.localeCompare(b);
      })
    }

    setLoading(false)
    return { filterDemandInputsData: filteredData, uniqueValues: result }
  }, [demandInputsData, Lines])

  filterDemandInputsDataRef.current = {
    ...filterDemandInputsDataRef.current,
    ...filterDemandInputsData,
  }

  const simulationNewLine = Object.keys(demandInputsData)

  useEffect(() => {
    const loadData = async () => {
      filterDemandInputsDataRef.current = {
        ...filterDemandInputsDataRef.current,
        ...filterDemandInputsData,
      }
      const demandLoadAgg = aggregateData(
        filterDemandInputsDataRef.current,
        Lines
      )
      await new Promise((resolve) => setTimeout(resolve, 3000))
      setLoading(false)
    }
    loadData()
    setLoading(true)
  }, [demandInputsData, filterDemandInputsData, Lines])

  const demandLoadAgg = useMemo(
    () => aggregateData(filterDemandInputsDataRef.current, Lines),
    [Lines]
  )

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

      const rateValue = e.target.value.replace(/,/g, '.')

      if (currentData[linekey] && currentData[linekey][rate]) {
        currentData[linekey][rate][productIndex] = parseFloat(rateValue)
      }

      for (const key in inputData) {
        if (key.includes(target_unit) && !key.includes('ORIGINAL')) {
          const date = key.split('_').slice(0, 3).join('_')
          const unitKeyName = key.split('_').pop()

          let qty_value = currentData[linekey][`${date}_QTY`][productIndex]

          let unitValue
          if (multiply) {
            unitValue = qty_value * rateValue
          } else {
            unitValue = rateValue === 0 ? 0 : qty_value / rateValue
          }
          unitValue = parseFloatNoNull(
            round_two
              ? parseFloat(unitValue.toFixed(2))
              : ceil
              ? Math.ceil(unitValue)
              : Math.round(unitValue)
          )
          saveRateUnitsContent(
            linekey,
            inputData,
            productIndex,
            key,
            unitValue,
            rate,
            rateValue
          )

          if (currentData[linekey] && currentData[linekey][key]) {
            currentData[linekey][key][productIndex] = unitValue
          }

          if (showUnitsColumns.includes(target_unit)) {
            const unitInput = document.getElementById(
              `input-box-${key}-${linekey}-${productIndex}`
            )
            unitInput.value = Number(unitValue).toLocaleString('de-DE')

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
      const unitInputValue = e.target.value.replace(/,/g, '.')

      let qty_value

      switch (unit) {
        case 'HOURS':
          const prodRate = currentData[line].PRODRATE[key_index]
          qty_value = Math.round(unitInputValue * prodRate)
          break
        case 'QTY':
          qty_value = parseFloat(unitInputValue)
          break
        case 'BATCHES':
          const batchSize = currentData[line].BATCH_SIZE[key_index]
          qty_value = Math.round(unitInputValue * batchSize)
          break
        default:
          qty_value = 0
      }

      currentData[line][key][key_index] = parseFloat(unitInputValue)
      saveRateUnitsContent(
        line,
        inputData,
        key_index,
        key,
        parseFloat(unitInputValue),
        false,
        false
      )

      let unitBox = document.getElementById(
        `input-box-${date}_${unit}-${line}-${key_index}`
      )

      findRowTotalValue(
        `${date}_${unit}`,
        `input-box-${date}_${unit}`,
        `total-${key}`
      )

      let original_value_unit = inputData[`${date}_ORIGINAL_${unit}`][key_index]

      const cellColorUnit = getCellColor(unitInputValue, original_value_unit)
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
            const prodRate = currentData[line].PRODRATE[key_index]
            unitValue = parseIntNoNull(
              Math.round(prodRate === 0 ? 0 : qty_value / prodRate)
            )
            break
          case 'BATCHES':
            const batchSize = currentData[line].BATCH_SIZE[key_index]
            unitValue = parseFloatNoNull(
              parseFloat(
                (batchSize === 0 ? 0 : qty_value / batchSize).toFixed(2)
              )
            )
            break
          case 'PALLETS':
            const unit_per_pallet = currentData[line].UNIT_PER_PALLET[key_index]
            unitValue = parseIntNoNull(
              Math.ceil(unit_per_pallet === 0 ? 0 : qty_value / unit_per_pallet)
            )
            break
          case 'ABSORPTION':
            const overhead_cost_by_unit =
              currentData[line].OVERHEAD_COST_BY_UNIT[key_index]
            unitValue = parseIntNoNull(
              Math.round(qty_value * overhead_cost_by_unit)
            )
            break
          default:
            unitValue = 0
        }

        currentData[line][`${date}_${unit_adj}`][key_index] = unitValue
        saveRateUnitsContent(
          line,
          inputData,
          key_index,
          `${date}_${unit_adj}`,
          unitValue,
          false,
          false
        )

        if (showUnitsColumns.includes(unit_adj)) {
          let cell_color_unit_adj
          let unitBox = document.getElementById(
            `input-box-${date}_${unit_adj}-${line}-${key_index}`
          )

          let original_value_unit_adj =
            inputData[`${date}_ORIGINAL_${unit_adj}`][key_index]
          unitBox.value = Number(unitValue).toLocaleString('de-DE')
          const event = new Event('input', { bubbles: true })
          unitBox.dispatchEvent(event)
          cell_color_unit_adj = getCellColor(unitValue, original_value_unit_adj)

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
      const colors = { low: '#D33D17', high: '#29A634', equal: '' }
      if (original_value !== undefined && original_value !== null) {
        if (current_value < original_value) return colors.low
        else if (current_value > original_value) return colors.high
        else return colors.equal
      } else {
        return current_value !== 0 ? colors.high : colors.equal
      }
    }
  )

  const saveRateUnitsContent = (
    lineKey,
    lineData,
    productIndex,
    key_string,
    value,
    rate,
    rateValue
  ) => {
    if (rate) {
      rate = rate.toLowerCase()
    }
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

    const newEntry = {
      line: lineKey,
      iop_product: lineData.IOP_PRODUCT[productIndex],
      date: formattedDate,
    }

    if (!Array.isArray(editedInputDataRef.current)) {
      editedInputDataRef.current = []
    }

    const existingIndex = editedInputDataRef.current.findIndex(
      (entry) =>
        entry.line === newEntry.line &&
        entry.iop_product === newEntry.iop_product &&
        entry.date === newEntry.date
    )

    if (existingIndex !== -1) {
      editedInputDataRef.current[existingIndex] = {
        ...editedInputDataRef.current[existingIndex],
        [unit]: value,
      }

      if (rate) {
        editedInputDataRef.current[existingIndex][rate] = rateValue
      }
    } else {
      const newEntryData = {
        ...newEntry,
        [unit]: value,
      }

      if (rate) {
        newEntryData[rate] = rateValue
      }

      editedInputDataRef.current.push(newEntryData)
    }

    setTimeout(() => {
      document.getElementById('refreshChartbtn')?.click()
    }, 1000)
  }

  const saveRateContent = (
    lineKey,
    product,
    productIndex,
    key_string,
    value
  ) => {
    const newEntry = {
      line: lineKey,
      iop_product: product,
    }

    if (!Array.isArray(editedInputDataRef.current)) {
      editedInputDataRef.current = []
    }

    let entryUpdated = false
    editedInputDataRef.current.forEach((entry) => {
      if (
        entry.line === newEntry.line &&
        entry.iop_product === newEntry.iop_product
      ) {
        entry[key_string] = value
        entryUpdated = true
      }
    })

    if (!entryUpdated) {
      editedInputDataRef.current.push({
        ...newEntry,
        [key_string]: value,
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
      totalCell.textContent = formatWithCommas(total_unit_adj)
    } else {
      console.warn(`Total cell not found: ${totalRowID}`)
    }
  }

  function formatWithCommas(value: any) {
    if (value === null || value === undefined || value === '') return ''
    const stringValue = typeof value === 'string' ? value : String(value)
    const numValue = Number(stringValue.replace(/,/g, ''))

    if (numValue >= 1000000) {
      return (numValue / 1000000).toFixed(2) + 'M'
    }

    return numValue.toLocaleString('de-DE')
  }

  function formatWithValue(value: any) {
    if (value === null || value === undefined || value === '') return ''
    const stringValue = typeof value === 'string' ? value : String(value)
    const numValue = Number(stringValue.replace(/,/g, '.'))
    return numValue.toLocaleString('de-DE')
  }

  function parseFloatNoNull(x: any) {
    return parseFloat(x) ? parseFloat(x) : 0
  }

  function parseIntNoNull(x: any) {
    return parseInt(x) ? parseInt(x) : 0
  }

  const toggleDropdown = (dropdown) => {
    const allDropdowns = document.querySelectorAll('.filter-dropdown')
    allDropdowns.forEach((d) => {
      if (d !== dropdown) {
        d.classList.add('hidden')
      }
    })

    dropdown.classList.toggle('hidden')
  }

  const filterTable = (e) => {
    const selectedValue = e.target.value.toLowerCase() // Convert to lowercase for case-insensitive matching
    const thElement = e.target.closest('th')
    const columnIndex = Array.from(thElement.parentNode.children).indexOf(
      thElement
    )
    const table = document.getElementById('products-table')
    const rows = table.querySelectorAll('tbody tr')

    rows.forEach((row) => {
      const cell = row.cells[columnIndex]
      if (cell) {
        const cellValue = cell.querySelector('input')
          ? cell.querySelector('input').value
          : cell.textContent
        const cellValueLower = cellValue.toLowerCase() // Convert cell value to lowercase for case-insensitive matching

        // Check for empty selection or partial match
        if (selectedValue === '' || cellValueLower.includes(selectedValue)) {
          row.style.display = ''
        } else {
          row.style.display = 'none'
        }
      }
    })
  }

  const handleNewSkuselection = (value: string) => {
    setSelectedNewSkuLine(value)
  }

  const openAddnewSku = () => {
    setSelectedNewSkuLine(Lines[0])
    isAddNewSkuModal.current?.showModal()
  }

  const addNewSkuAPIcall = async () => {
    if (selectedNewSkuLine !== '') {
      isAddNewSkuModal.current?.close()
      display_notification('info', 'Adding New Row...')
      setLoading(true)

      try {
        const res = await axios.post(
          `${apiUrl}/simulation/${SimulationID}/planDetails/newSKU?simulation_id=${SimulationID}`,
          { line: selectedNewSkuLine }
        )
        if (res && Array.isArray(res.data) && res.data.length > 0) {
          display_notification(
            'info',
            'New SKU added successfully. The demand and projection summary tables are being updated. Please wait for the refresh.'
          )
          await new Promise((resolve) => setTimeout(resolve, 2000))
          await getPlanDetailsLoadAgg(SimulationID)
        }
      } catch (err) {
        console.error(err) // Log the error for debugging
        display_notification(
          'error',
          'An error occurred while adding the new SKU. Please try again.'
        )
      } finally {
        setLoading(false)
      }
    } else {
      display_notification(
        'alert',
        'Your request to add New SKU API. Please try again.'
      )
      return null
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

        // Display a notification about the duplication process
        display_notification('info', 'Duplicating selected row...')

        // Set loading to true before the API call
        setLoading(true)

        try {
          const res = await axios.post(
            `${apiUrl}/simulation/${SimulationID}/planDetails/duplicateSKU?simulation_id=${SimulationID}`,
            postData
          )
          if (res.data) {
            display_notification(
              'info',
              'Row duplicated successfully. The demand and projection summary tables are being updated. Please wait for the refresh.'
            )
            await new Promise((resolve) => setTimeout(resolve, 2000))
            await getPlanDetailsLoadAgg(SimulationID)
          }
        } catch (err) {
          display_notification(
            'alert',
            'Your request to add New SKU failed. Please try again.'
          )
        } finally {
          setLoading(false)
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
    setLoading(true)
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
          await new Promise((resolve) => setTimeout(resolve, 2000))
          await getPlanDetailsLoadAgg(SimulationID)
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
      } finally {
        setLoading(false)
      }
    } else {
      display_notification(
        'alert',
        'No data to save. Please modify unit value data before saving.'
      )
      setLoading(false)
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

  const handleFocusValue = (e) => {
    let value = e.target.value
    // Remove periods for parsing
    value = value.replace(/\./g, '')

    if (value.includes(',')) {
      e.target.type = 'text'
    } else {
      const numericValue = parseFloat(value)
      e.target.type = 'number'
      e.target.value = isNaN(numericValue) ? '' : numericValue
    }
  }

  const handleBlurValue = (e) => {
    let value = e.target.value
    e.target.type = 'text'
    value = value.replace(/\./g, '')
    const numValue = Number(value.replace(/,/g, '.'))
    e.target.value = isNaN(numValue) ? '' : numValue.toLocaleString('de-DE')
  }

  const rateEditInput = (identifier) => {
    const inputElement = document.getElementById(identifier)
    const spanElement = document.querySelector(`.${identifier}`)

    if (inputElement && spanElement) {
      inputElement.style.display = 'block'
      spanElement.style.display = 'none'
      inputElement.focus()
    }
  }

  const Row = useCallback(
    ({ lineKey, lineData }: { lineKey: string; lineData: RowData }) => {
      if (!lineData) return null
      return (
        <React.Fragment>
          {lineData.IOP_PRODUCT.map((product, productIndex) => (
            <tr key={`${lineKey}-${productIndex}`}>
              <td className='sticky_new first_cell'>
                <input
                  type='checkbox'
                  onChange={(e) =>
                    handleCheckboxChange(lineKey, lineData, productIndex, e)
                  }
                  value={lineKey}
                />
              </td>
              <td className='sticky_new line_cell'>{lineKey}</td>
              {showTableColumns.includes('IOP_BRAND') && (
                <td className='sticky_new IOP_BRAND'>
                  {lineData.IOP_BRAND[productIndex]}
                </td>
              )}
              {showTableColumns.includes('IOP_STRENGTH') && (
                <td className='sticky_new IOP_STRENGTH'>
                  {lineData.IOP_STRENGTH[productIndex]}
                </td>
              )}
              {showTableColumns.includes('IOP_PRODUCT') && (
                <td className='sticky_new IOP_PRODUCT'>{product}</td>
              )}
              {showTableColumns.includes('IOP_DESCR') && (
                <td className='sticky_new IOP_DESCR'>
                  {lineData.IOP_DESCR[productIndex]}
                </td>
              )}
              {showTableColumns.includes('LINES_NUMBER') && (
                <td className='sticky_new LINES_NUMBER'>
                  {lineData.LINES_NUMBER[productIndex]}
                </td>
              )}
              {showTableColumns.includes('UNIT_PER_PALLET') && (
                <td
                  className='sticky_new UNIT_PER_PALLET'
                  style={{ backgroundColor: 'white' }}
                >
                  <input
                    type='text'
                    className='readonly-input'
                    readOnly
                    contentEditable='false'
                    id={`input-unit-per-pallet-${lineKey}-${productIndex}`}
                    defaultValue={
                      formatWithValue(lineData.UNIT_PER_PALLET[productIndex]) ||
                      0
                    }
                    tabIndex='-1'
                  />
                </td>
              )}
              {showTableColumns.includes('OVERHEAD_COST_BY_UNIT') && (
                <td
                  className='sticky_new OVERHEAD_COST_BY_UNIT'
                  style={{ backgroundColor: 'white' }}
                >
                  <input
                    type='text'
                    readOnly
                    className='readonly-input'
                    id={`input-overhead-cost-${lineKey}-${productIndex}`}
                    defaultValue={
                      formatWithValue(
                        lineData.OVERHEAD_COST_BY_UNIT[productIndex]
                      ) || 0
                    }
                  />
                </td>
              )}
              {showTableColumns.includes('PRODRATE') &&
                (() => {
                  const identifier = `input-prodrate-${lineKey}-${productIndex}`
                  return (
                    <td
                      className='sticky_new PRODRATE'
                      key={identifier}
                      style={{ backgroundColor: 'white' }}
                    >
                      <input
                        type='text'
                        className='hidden'
                        id={identifier}
                        onFocus={(e) => handleFocusValue(e)}
                        onBlur={(e) => handleBlurValue(e)}
                        defaultValue={lineData.PRODRATE[productIndex]}
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
                      />
                      <span
                        className={identifier}
                        onClick={() => rateEditInput(identifier)}
                        style={{ cursor: 'text' }}
                      >
                        {formatWithValue(lineData.PRODRATE[productIndex])}
                      </span>
                    </td>
                  )
                })()}
              {showTableColumns.includes('BATCH_SIZE') &&
                (() => {
                  const identifier = `input-batch-size-${lineKey}-${productIndex}`
                  return (
                    <td
                      className='sticky_new BATCH_SIZE'
                      key={identifier}
                      style={{ backgroundColor: 'white' }}
                    >
                      <input
                        type='text'
                        className='hidden'
                        id={identifier}
                        onFocus={(e) => handleFocusValue(e)}
                        onBlur={(e) => handleBlurValue(e)}
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
                            true,
                            false
                          )
                        }
                      />
                      <span
                        className={identifier}
                        onClick={() => rateEditInput(identifier)}
                        style={{ cursor: 'text' }}
                      >
                        {formatWithValue(lineData.BATCH_SIZE[productIndex])}
                      </span>
                    </td>
                  )
                })()}
              {Object.keys(demandLoadAgg).map((date, dateIndex) => {
                const formattedDate = date.replace(/-/g, '_')
                const isEvenDate = dateIndex % 2 === 0
                const color = isEvenDate ? 'tbl_even' : 'tbl_odd'
                return (
                  <React.Fragment
                    key={`${lineKey}-${productIndex}-${dateIndex}`}
                  >
                    {['HOURS', 'QTY', 'BATCHES', 'PALLETS', 'ABSORPTION'].map(
                      (unit, unitIndex) =>
                        showUnitsColumns.includes(unit)
                          ? (() => {
                              const originalVal =
                                lineData[`${formattedDate}_ORIGINAL_${unit}`]?.[
                                  productIndex
                                ] ?? 0
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
                              const displayVal = formatWithValue(defaultVal)
                              const tableBgColor = getCellColor(
                                defaultVal,
                                originalVal
                              )
                              const isLastColumn =
                                unitIndex === showUnitsColumns.length - 1

                              return (
                                <td
                                  key={`${unit}-${lineKey}-${productIndex}-${dateIndex}`}
                                  style={{
                                    backgroundColor: tableBgColor,
                                    borderRight: isLastColumn
                                      ? '1px solid rgb(221, 221, 221)'
                                      : 'none',
                                  }}
                                  className={color}
                                >
                                  <input
                                    type='text'
                                    id={`input-box-${formattedDate}_${unit}-${lineKey}-${productIndex}`}
                                    data-original-val={originalVal}
                                    data-column={productIndex}
                                    style={{ backgroundColor: tableBgColor }}
                                    defaultValue={displayVal}
                                    onFocus={(e) => handleFocusValue(e)}
                                    onBlur={(e) => handleBlurValue(e)}
                                    readOnly={[
                                      'PALLETS',
                                      'ABSORPTION',
                                    ].includes(unit)}
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
                                  />
                                </td>
                              )
                            })()
                          : null
                    )}
                  </React.Fragment>
                )
              })}
            </tr>
          ))}
        </React.Fragment>
      )
    }
  )

  return (
    <div className='w-full'>
      <div className='mt-4 w-full'>
        {Object.keys(demandLoadAgg).length > 0 ? (
          <div className='w-full'>
            <div className='flex items-center w-full mt-2 space-x-2 justify-end'>
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
            <div className='mt-4 hide-scrollbar relative'>
              {loading && (
                <div className='absolute h-[36rem] inset-0 bg-wht bg-opacity-50 flex justify-center items-center z-50'>
                  <LdLoading label='Loading table data...' />
                </div>
              )}
              <div
                id='demandInputTbl'
                className='relative h-[36rem] overflow-y-scroll overflow-x-scroll'
              >
                <table id='products-table'>
                  <thead>
                    {/* First table tr start */}
                    {showUnitsColumns && showUnitsColumns.length > 0 ? (
                      <tr>
                        <th
                          colSpan={showTableColumns.length + 2}
                          className='sticky_new first_cell'
                        ></th>
                        {Object.keys(demandLoadAgg).map((date, dateIndex) => (
                          <th
                            className='dm-custom-th'
                            key={`date-header-${date}-${dateIndex}`}
                            colSpan={showUnitsColumns.length}
                          >
                            {date.replace(/_/g, '-')}
                          </th>
                        ))}
                      </tr>
                    ) : null}
                    {/* End First table tr start */}
                    {/*---------------- Dynamic tr with show columns table tr start------------------------- */}
                    <tr>
                      <th className='sticky_new first_cell'></th>
                      <th className='sticky_new line_cell'>
                        LINE{' '}
                        <span
                          onClick={(e) =>
                            toggleDropdown(e.currentTarget.nextElementSibling)
                          }
                          className='filter-icon'
                        >
                          ▼
                        </span>
                        <select
                          onChange={(e) => filterTable(e)}
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
                      </th>
                      {showTableColumns.map((col, index) => (
                        <th
                          key={`header-${col}-${index}`}
                          className={`sticky_new ${col}`}
                        >
                          {dropDownFields.includes(col) ? (
                            <>
                              {col
                                .replace(/IOP_/g, '')
                                .replace(/_/g, ' ')
                                .toUpperCase()}
                              <span
                                onClick={(e) =>
                                  toggleDropdown(
                                    e.currentTarget.nextElementSibling
                                  )
                                }
                                className='filter-icon'
                              >
                                ▼
                              </span>
                              <select
                                onChange={(e) => filterTable(e)}
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
                      {Object.keys(demandLoadAgg).map((date, dateIndex) => {
                        return (
                          <React.Fragment
                            key={`units-header-${date}-${dateIndex}`}
                          >
                            {allUnitsColumns.map((unit, unitIndex) => {
                              if (showUnitsColumns.includes(unit)) {
                                return (
                                  <th
                                    key={`${unit.toLocaleLowerCase()}-header-${date}`}
                                  >
                                    {unit}
                                    <input
                                      type='text'
                                      onChange={(e) => filterTable(e)}
                                    />
                                  </th>
                                )
                              }
                              return null
                            })}
                          </React.Fragment>
                        )
                      })}
                      {/* ------------------------------End Date based header start here--------------------  */}
                    </tr>
                    {/* --------------------------------- Totals -------------------------------------- */}
                    {showUnitsColumns && showUnitsColumns.length > 0 ? (
                      <tr>
                        <th
                          className='sticky_new first_cell'
                          colSpan={showTableColumns.length + 2}
                        ></th>
                        {Object.keys(demandLoadAgg).map((date, dateIndex) => {
                          const formattedDate = date.replace(/-/g, '_')
                          return (
                            <React.Fragment
                              key={`units-header-${formattedDate}-${dateIndex}`}
                            >
                              {showUnitsColumns.includes('HOURS') && (
                                <th key={`hours-total-header-${formattedDate}`}>
                                  <span
                                    datatotal={demandLoadAgg[date].HOURS}
                                    className='head_total'
                                    id={`total-${formattedDate}_HOURS`}
                                  >
                                    {formatWithCommas(
                                      demandLoadAgg[date].HOURS
                                    )}
                                  </span>
                                </th>
                              )}
                              {showUnitsColumns.includes('QTY') && (
                                <th key={`qty-total-header-${formattedDate}`}>
                                  <span
                                    datatotal={demandLoadAgg[date].QTY}
                                    className='head_total'
                                    id={`total-${formattedDate}_QTY`}
                                  >
                                    {formatWithCommas(demandLoadAgg[date].QTY)}
                                  </span>
                                </th>
                              )}
                              {showUnitsColumns.includes('BATCHES') && (
                                <th
                                  key={`batches-total-header-${formattedDate}`}
                                >
                                  <span
                                    datatotal={demandLoadAgg[date].BATCHES}
                                    className='head_total'
                                    id={`total-${formattedDate}_BATCHES`}
                                  >
                                    {formatWithCommas(
                                      demandLoadAgg[date].BATCHES
                                    )}
                                  </span>
                                </th>
                              )}
                              {showUnitsColumns.includes('PALLETS') && (
                                <th
                                  key={`pallets-total-header-${formattedDate}`}
                                >
                                  <span
                                    datatotal={demandLoadAgg[date].PALLETS}
                                    className='head_total'
                                    id={`total-${formattedDate}_PALLETS`}
                                  >
                                    {formatWithCommas(
                                      demandLoadAgg[date].PALLETS
                                    )}
                                  </span>
                                </th>
                              )}
                              {showUnitsColumns.includes('ABSORPTION') && (
                                <th
                                  key={`absorption-total-header-${formattedDate}`}
                                >
                                  <span
                                    datatotal={demandLoadAgg[date].ABSORPTION}
                                    className='head_total'
                                    id={`total-${formattedDate}_ABSORPTION`}
                                  >
                                    {formatWithCommas(
                                      demandLoadAgg[date].ABSORPTION
                                    )}
                                  </span>
                                </th>
                              )}
                            </React.Fragment>
                          )
                        })}
                      </tr>
                    ) : null}
                    {/* --------------------------------- End Totals -------------------------------------- */}
                  </thead>
                  <tbody>
                    {/* ------------------------------Dynamic tbody start ------------ */}
                    {Object.keys(filterDemandInputsData).map((lineKey) => {
                      const lineData = filterDemandInputsData[lineKey]
                      return (
                        <Row
                          key={lineKey}
                          lineKey={lineKey}
                          lineData={lineData}
                        />
                      )
                    })}
                    {/* ------------------------------Dynamic tbody end ------------ */}
                  </tbody>
                </table>
              </div>
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
                    <LdTypo className='ml-2'>
                      {column.replace(/_/g, ' ')}
                    </LdTypo>
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
          <div className='flex flex-col justify-center items-center h-full'>
            No Demand data available for selected Lines
          </div>
        )}
      </div>
    </div>
  )
}

export default DemandInputTable
