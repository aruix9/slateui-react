import React, { useState, useEffect, useCallback, useMemo } from 'react'
import axios from 'axios'
import { display_notification } from '../../../global/notification'

import './optimazationResult.css'
import {
  LdIcon,
  LdLoading,
  LdTypo,
  LdTabs,
  LdTablist,
  LdTab,
  LdTabpanellist,
  LdTabpanel,
} from '@emdgroup-liquid/liquid/dist/react'
import SimulationResultSummary from './SimulationResultSummary'
import OptimazationChart from './Chart/OptimazationShiftChart'
import OptimizationTable from './OptimazationShiftTable'

const apiUrl = process.env.REACT_APP_API_URL1

interface SimulationResultProp {
  SimulationID: string
  Lines: string[]
  SimulationStatus: string
}

interface DistributionGraphData {
  capacity: {
    [key: string]: {
      DATE?: string[] // Optional structure for capacity
      PLANNED_CAPACITY_HOURS?: number[]
      ACTUAL_CAPACITY_SHIFTS?: number[]
    }
  }
  optimal_shifts: {
    [key: string]: any
  }
  shifts_distribution: {
    [key: string]: any
  }
}

interface DistributionGraphTableData {
  [key: string]: {
    dates: string[]
    diff_First_Shift_per_Weekday: number[]
    diff_Second_Shift_per_Weekday: number[]
    diff_Third_Shift_per_Weekday: number[]
    diff_First_Shift_per_Saturday: number[]
    diff_First_Shift_per_Sunday: number[]
    diff_Second_Shift_per_Saturday: number[]
    diff_Second_Shift_per_Sunday: number[]
    diff_Third_Shift_per_Saturday: number[]
    diff_Third_Shift_per_Sunday: number[]
    values_act: number[] // Changed to number[] to reflect actual data type
    values_opt: number[] // Changed to number[] to reflect actual data type
    colors_act: string[]
    colors_opt: string[]
    [key: string]: any // Allow other properties for flexibility
  }
}

interface ShiftDistribution {
  numWeekdays: number
  numSaturdays: number
  numSundays: number
}

interface Entry {
  date: string
  first_shift_per_saturday: number
  first_shift_per_sunday: number
  first_shift_per_weekday: number
  second_shift_per_saturday: number
  second_shift_per_sunday: number
  second_shift_per_weekday: number
  third_shift_per_saturday: number
  third_shift_per_sunday: number
  third_shift_per_weekday: number
  optimal_shift: number
  capacity_shift: number
}

interface CombinedData {
  date: string
  opt_shift: number
}

function filterByLineKeys(
  data: Record<string, Entry[]>,
  lineKeys: string[]
): Entry[] {
  const newlinkeys = lineKeys[0]
  const filteredResults: Entry[] = [] // Initialize an empty array
  lineKeys.forEach((lineKey) => {
    if (data[lineKey]) {
      const lineData = data[lineKey].map((entry: any) => {
        return {
          date: entry.date,
          first_shift_per_saturday: entry['First shift per Saturday'],
          first_shift_per_sunday: entry['First shift per Sunday'],
          first_shift_per_weekday: entry['First shift per weekday'],
          second_shift_per_saturday: entry['Second shift per Saturday'],
          second_shift_per_sunday: entry['Second shift per Sunday'],
          second_shift_per_weekday: entry['Second shift per weekday'],
          third_shift_per_saturday: entry['Third shift per Saturday'],
          third_shift_per_sunday: entry['Third shift per Sunday'],
          third_shift_per_weekday: entry['Third shift per weekday'],
          optimal_shift: entry['optimal shift'],
          capacity_shift: entry['capacity shift'],
        }
      })

      filteredResults.push(...lineData)
    }
  })

  return filteredResults // Return a single array containing all entries
}

const initialfilterDistributionGraph = {
  Date: [],
  'Total Shifts': [],
  'Total Weekday Shifts': [],
  'Week Days': [],
  'Shifts per WeekDay': [],
  'Total Saturday Shifts': [],
  Saturdays: [],
  'Shifts per Saturday': [],
  'Total Sunday Shifts': [],
  Sundays: [],
  'Shifts per Sunday': [],
  'Ad-hoc Shifts': [],
}

const SimulationResult: React.FC<SimulationResultProp> = ({
  SimulationStatus,
  SimulationID,
  Lines,
}) => {
  const [distributionGraphData, setDistributionGraphData] =
    useState<DistributionGraphData | null>(null)
  const [distributionGraphTableData, setDistributionTableData] =
    useState<DistributionGraphTableData>({})
  const [loading, setLoading] = useState<boolean>(false)
  const [activeTab, setActiveTab] = useState('table') // Default active tab

  const getDistributionTable = useCallback(async () => {
    try {
      setLoading(true)
      const res = await axios.get(`${apiUrl}/distributionTable`)
      if (res && res.data) {
        setDistributionTableData(res.data)
      } else {
        display_notification(
          'alert',
          'An error occurred while fetching Graph data'
        )
      }
    } catch (err) {
      display_notification(
        'alert',
        'An error occurred while fetching Graph data'
      )
    } finally {
      setLoading(false)
    }
  }, [SimulationID, SimulationStatus])

  const getDistributionGraph = useCallback(async () => {
    try {
      setLoading(true)
      const res = await axios.get(`${apiUrl}/distributionGraph`)
      if (res && res.data) {
        setDistributionGraphData(res.data)
      } else {
        // display_notification('alert', 'An error occurred while fetching Graph data');
      }
    } catch (err) {
      // display_notification('alert', 'An error occurred while fetching Graph data');
    } finally {
      setLoading(false)
    }
  }, [SimulationID, SimulationStatus])

  useEffect(() => {
    getDistributionTable()
    getDistributionGraph()
  }, [SimulationID, SimulationStatus])

  const getDaysDistribution = (dates: string[]) => {
    const getDatesDistributionForMonth = (dateStr: string) => {
      let numWeekdays = 0
      let numSaturdays = 0
      let numSundays = 0

      const date = new Date(dateStr)
      const month = date.getMonth()
      const year = date.getFullYear()
      let day = 1

      // Loop through the days of the month
      while (date.getMonth() === month) {
        switch (date.getDay()) {
          case 0: // Sunday
            numSundays++
            break
          case 6: // Saturday
            numSaturdays++
            break
          default: // Weekday (Monday to Friday)
            numWeekdays++
            break
        }
        day++
        date.setDate(day) // Move to the next day
      }

      return {
        numWeekdays,
        numSaturdays,
        numSundays,
      }
    }

    const sortedDates = dates.sort(
      (a, b) => new Date(a).getTime() - new Date(b).getTime()
    )

    return sortedDates.map((date) => getDatesDistributionForMonth(date))
  }

  const filterDistributionGraphTable = useMemo(() => {
    if (distributionGraphData && distributionGraphData.optimal_shifts) {
      if (
        SimulationStatus !== 'SUCCESS' &&
        Object.keys(distributionGraphData.optimal_shifts).length > 0
      ) {
        const lineObjKey = Lines[0]
        const filterGraphData = distributionGraphData.optimal_shifts[lineObjKey]

        const dates = filterGraphData?.DATE
        const opt_shifts = filterGraphData['OPT_CAPACITY_SHIFTS']

        // Create an array of objects to keep dates and shifts together
        const combinedData: CombinedData[] = dates.map(
          (date: string, index: number) => ({
            date,
            opt_shift: opt_shifts[index],
          })
        )

        // Sort combined data by date
        combinedData.sort(
          (a: CombinedData, b: CombinedData) =>
            new Date(a.date).getTime() - new Date(b.date).getTime()
        )

        // Extract the sorted dates and shifts back into separate arrays
        const sortedDates = combinedData.map((item) => item.date)
        const sortedOptShifts = combinedData.map((item) => item.opt_shift)

        const shifts_distribution = getDaysDistribution(sortedDates)

        const weekdays = shifts_distribution.map(
          (x: ShiftDistribution) => x.numWeekdays
        )
        const shift_per_weekday = sortedOptShifts.map(
          (opt: number, idx: number) =>
            Math.min(Math.floor(opt / weekdays[idx]), 3)
        )
        const total_weekday_shifts = weekdays.map(
          (x: number, idx: number) => x * shift_per_weekday[idx]
        )

        const saturdays = shifts_distribution.map(
          (x: ShiftDistribution) => x.numSaturdays
        )
        const shift_per_saturday = saturdays.map(
          (saturdaysCount: number, idx: number) =>
            shift_per_weekday[idx] === 3
              ? Math.min(
                  Math.floor(
                    (sortedOptShifts[idx] - total_weekday_shifts[idx]) /
                      saturdaysCount
                  ),
                  3
                )
              : 0
        )
        const total_saturday_shifts = saturdays.map(
          (x: number, idx: number) => x * shift_per_saturday[idx]
        )

        const sundays = shifts_distribution.map(
          (x: ShiftDistribution) => x.numSundays
        )
        const shift_per_sunday = sundays.map(
          (sundaysCount: number, idx: number) =>
            shift_per_weekday[idx] === 3
              ? Math.min(
                  Math.floor(
                    (sortedOptShifts[idx] -
                      total_weekday_shifts[idx] -
                      total_saturday_shifts[idx]) /
                      sundaysCount
                  ),
                  3
                )
              : 0
        )
        const total_sunday_shifts = sundays.map(
          (x: number, idx: number) => x * shift_per_sunday[idx]
        )

        const ad_hoc_shifts = sortedOptShifts.map(
          (x: number, idx: number) =>
            x -
            total_weekday_shifts[idx] -
            total_saturday_shifts[idx] -
            total_sunday_shifts[idx]
        )

        const data = {
          Date: sortedDates,
          'Total Shifts': sortedOptShifts,
          'Total Weekday Shifts': total_weekday_shifts,
          'Week Days': weekdays,
          'Shifts per WeekDay': shift_per_weekday,
          'Total Saturday Shifts': total_saturday_shifts,
          Saturdays: saturdays,
          'Shifts per Saturday': shift_per_saturday,
          'Total Sunday Shifts': total_sunday_shifts,
          Sundays: sundays,
          'Shifts per Sunday': shift_per_sunday,
          'Ad-hoc Shifts': ad_hoc_shifts,
        }

        return data
      } else {
        return initialfilterDistributionGraph
      }
    } else {
      return initialfilterDistributionGraph
    }
  }, [distributionGraphData, Lines, SimulationStatus])

  const filterDistributionTable = useMemo(() => {
    // Early return if Lines is empty or distributionGraphTableData is empty
    if (!Lines.length || !Object.keys(distributionGraphTableData).length) {
      return {}
    }

    return Object.keys(distributionGraphTableData).reduce((obj, key) => {
      if (Lines.includes(key)) {
        obj[key] = distributionGraphTableData[key]
      }
      return obj
    }, {} as DistributionGraphTableData)
  }, [distributionGraphTableData, Lines])

  const filterShiftgraph = useMemo(() => {
    if (!distributionGraphData || !distributionGraphData.shifts_distribution) {
      return {}
    }

    const shiftsData = distributionGraphData.shifts_distribution

    const firstLineKey: string = Lines[0] // need check and remove

    const filteredData = filterByLineKeys(shiftsData, [firstLineKey])

    const sortedFilteredData = filteredData.sort((a, b) => {
      return new Date(a.date).getTime() - new Date(b.date).getTime()
    })

    return sortedFilteredData
  }, [distributionGraphData, Lines])

  return (
    <div className='w-full'>
      {loading ? (
        <div className='text-center mt-4'>
          <LdLoading /> <LdTypo>Loading Optimization Result</LdTypo>
        </div>
      ) : (
        <div className='mt-4 w-full'>
          <LdTabs style={{ width: '100%' }}>
            {SimulationStatus === 'SUCCESS' &&
            filterDistributionGraphTable &&
            Object.keys(filterDistributionGraphTable).length > 0 ? (
              <div className='p-2 mt-2'>
                <span>
                  The following table displays the optimal shifts distribution
                  for this line outputed by the algorithm.
                </span>
              </div>
            ) : (
              <div
                className='rounded-[5px] mt-2 p-1 mb-4 flex items-center h-8'
                style={{ backgroundColor: '#FBB360' }}
              >
                <LdIcon name='cross' className='mr-2' />
                <span>
                  No Capacity Optimization ran for this line yet, so no results
                  available to display
                </span>
              </div>
            )}
            <LdTablist mode='ghost'>
              <LdTab
                onClick={() => setActiveTab('table')}
                style={{
                  fontWeight: activeTab === 'table' ? 'bold' : 'normal',
                }}
              >
                Table
              </LdTab>
              <LdTab
                onClick={() => setActiveTab('graph')}
                style={{
                  fontWeight: activeTab === 'graph' ? 'bold' : 'normal',
                }}
              >
                Graph
              </LdTab>
            </LdTablist>
            <LdTabpanellist>
              <LdTabpanel
                style={{ display: activeTab === 'table' ? 'block' : 'none' }}
              >
                <div className='optmazationResult'>
                  {filterDistributionGraphTable &&
                  Object.keys(filterDistributionGraphTable).length > 0 ? (
                    <OptimizationTable
                      filterDistributionGraphTable={
                        filterDistributionGraphTable
                      }
                    />
                  ) : (
                    <p>No data available</p>
                  )}
                </div>
              </LdTabpanel>
              <LdTabpanel
                style={{ display: activeTab === 'graph' ? 'block' : 'none' }}
              >
                <div className='w-full'>
                  {filterShiftgraph &&
                    Array.isArray(filterShiftgraph) &&
                    filterShiftgraph.length > 0 && (
                      <OptimazationChart data={filterShiftgraph} />
                    )}
                </div>
                <div className='w-full'>
                  {filterDistributionTable &&
                    Object.keys(filterDistributionTable).length > 0 && (
                      <SimulationResultSummary
                        distributionGraphData={filterDistributionTable}
                      />
                    )}
                </div>
              </LdTabpanel>
            </LdTabpanellist>
          </LdTabs>
        </div>
      )}
    </div>
  )
}

export default SimulationResult
