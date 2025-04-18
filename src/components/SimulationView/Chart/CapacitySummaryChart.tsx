import { useState, useEffect } from 'react'
import {
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Line,
  ResponsiveContainer,
} from 'recharts'

import './barChart.css'

interface ChartData {
  DATE: string
  LOAD: number
  EXTRA: number
  REDUCED: number
  MAX_CAPACITY: number
  MIN_CAPACITY: number
  PRODUCTIVE_CAPACITY: number
}

interface InputData {
  [key: string]: any // Allow additional dynamic keys
}

const monthTickFormatter = (tick: any) => {
  const date = new Date(tick)
  const month = date.getMonth()
  const monthNames = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ]
  return monthNames[month]
}

const yearTickFormatter = (tick: any) => {
  const date = new Date(tick)
  return isNaN(date.getFullYear()) ? '0' : String(date.getFullYear())
}

const CapacitySummaryChart: React.FC<{ inputData: InputData }> = ({
  inputData,
}) => {
  const [chartData, setChartData] = useState<ChartData[]>([]) // Define the state type

  const filterChartData = (inputData: InputData) => {
    let combinedData: ChartData[] = []

    // Initialize an object to hold totals based on the selected filter
    const totals: Record<
      string,
      {
        total_load: number
        total_extra: number
        total_reduced: number
        max_capacity: number
        min_capacity: number
        productive_capacity: number
        optimal_capacity: number
      }
    > = {}

    // Function to convert quarter format to date format

    // Loop through the loadGraphData
    for (let i = 0; i < inputData.loadGraphData.dates.length; i++) {
      const date = inputData.loadGraphData.dates[i] // Convert the date format
      const label = inputData.loadGraphData.labels[i]
      const value = inputData.loadGraphData.values[i]

      let key: string = date // Use the full date for the key

      // Initialize the totals object if it doesn't exist
      if (!totals[key]) {
        totals[key] = {
          total_load: 0,
          total_extra: 0,
          total_reduced: 0,
          max_capacity: 0,
          min_capacity: 0,
          productive_capacity: 0,
          optimal_capacity: 0,
        }
      }

      // Sum the values based on the label
      if (label === 'Load') {
        totals[key].total_load += value
      } else if (label.startsWith('Extra')) {
        totals[key].total_extra += value
      } else if (label.startsWith('Reduced')) {
        totals[key].total_reduced += value
      }
    }

    // If the selected filter is "Hours", combine with capacity data
    if (inputData.selectedFilter === 'Hours') {
      for (let i = 0; i < inputData.capacityGraphData.dates.length; i++) {
        const date = inputData.capacityGraphData.dates[i] // Convert the date format
        const key = date // Use the full date as the key

        // Check if the date exists in totals
        if (totals[key]) {
          totals[key].max_capacity +=
            inputData.capacityGraphData.max_capacity[i]
          totals[key].min_capacity +=
            inputData.capacityGraphData.min_capacity[i]
          totals[key].productive_capacity +=
            inputData.capacityGraphData.productive_capacity[i]
        }
      }
    }

    if (
      inputData.selectedFilter === 'Hours' &&
      inputData.optimalGraphData.dates.length
    ) {
      for (let i = 0; i < inputData.optimalGraphData.dates.length; i++) {
        const date = inputData.optimalGraphData.dates[i] // Convert the date format
        const key = date // Use the full date as the key

        // Check if the date exists in totals
        if (totals[key]) {
          totals[key].optimal_capacity += roundToDecimal(
            inputData.optimalGraphData.values[i],
            2
          )
        }
      }
    }

    // Convert the totals object into an array for easier use in charts
    combinedData = Object.keys(totals).map((key) => ({
      DATE: key,
      LOAD: totals[key].total_load,
      EXTRA: totals[key].total_extra,
      REDUCED: totals[key].total_reduced,
      MAX_CAPACITY: totals[key].max_capacity,
      MIN_CAPACITY: totals[key].min_capacity,
      PRODUCTIVE_CAPACITY: totals[key].productive_capacity,
      OPTIMAL_CAPACITY: totals[key].optimal_capacity,
    }))

    return combinedData
  }

  function roundToDecimal(value: number, decimals: number) {
    return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals)
  }

  useEffect(() => {
    const filteredChartData = filterChartData(inputData)
    setChartData(filteredChartData) // Set the filtered data to chartData
  }, [inputData])

  return (
    <div className='my-8'>
      <ResponsiveContainer width='100%' height={300}>
        <ComposedChart
          data={chartData}
          key={JSON.stringify(chartData)}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid
            vertical={false}
            horizontal={false}
            strokeDasharray='0'
          />

          {/* X Axis for Months */}
          <XAxis
            padding={{ left: 20, right: 20 }}
            tickLine={false}
            dataKey='DATE'
            tickFormatter={monthTickFormatter}
            tick={{ fontSize: 11, fontWeight: 600 }} // Set font size and weight
          />

          {/* X Axis for Years */}
          <XAxis
            dataKey='DATE'
            tickLine={false}
            axisLine={{ stroke: '#808080' }} // Set the axis line color to gray
            orientation='bottom'
            interval={0} // Adjust this based on your data
            tickFormatter={yearTickFormatter}
            tick={{ fontSize: 11, fontWeight: 600 }}
            xAxisId='year' // Ensure it's unique
          />

          <YAxis
            label={{
              value: inputData.selectedFilter,
              angle: -90,
              position: 'insideLeft',
            }}
            axisLine={false}
            tickFormatter={(value) => {
              if (value >= 1000000) {
                return `${(value / 1000000).toFixed(0)}M`
              } else if (value >= 1000) {
                return `${(value / 1000).toFixed(0)}K`
              }
              return value
            }}
          />

          <Legend
            layout='horizontal'
            verticalAlign='top'
            align='right'
            wrapperStyle={{ paddingTop: '10px' }}
          />

          <Bar
            legendType='circle'
            name={`Extra ${inputData.selectedFilter}`}
            dataKey='EXTRA'
            stackId='a'
            fill='#1d7c2b'
          />
          <Bar
            legendType='circle'
            name='Load'
            dataKey='LOAD'
            stackId='a'
            fill='#3bab4b'
          />

          {/* Conditionally render Reduced Bar */}
          {chartData.some((data) => data.REDUCED < 0) && (
            <Bar
              legendType='circle'
              name='Reduced'
              dataKey={(data) => -data.REDUCED} // Negate the value directly in the dataKey
              stackId='a'
              fill='#FF9980'
            />
          )}

          {/* Conditionally render Lines based on selectedFilter */}
          {inputData.selectedFilter === 'Hours' && (
            <>
              <Line
                legendType='circle'
                name='Actual Capacity'
                dataKey='PRODUCTIVE_CAPACITY'
                stroke='#FF0000'
                dot={false}
              />
              <Line
                legendType='circle'
                name='Optimal Capacity'
                dataKey='OPTIMAL_CAPACITY'
                stroke='#8F398F'
                dot={false}
              />
              <Line
                legendType='circle'
                name='Max Capacity'
                dataKey='MAX_CAPACITY'
                stroke='#7f7e81'
                dot={false}
              />
              <Line
                legendType='circle'
                name='Min Capacity'
                dataKey='MIN_CAPACITY'
                stroke='#000000'
                dot={false}
              />
            </>
          )}

          {/* Tooltip Component */}
          <Tooltip
            contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc' }} // Customize tooltip style
            cursor={{ fill: 'rgba(0,0,0,0.1)' }} // Customize cursor style
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}

export default CapacitySummaryChart
