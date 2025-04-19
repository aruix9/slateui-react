import { useEffect, useRef, useState } from 'react'
import './rangeslider.css'
import { LdSlider } from '@emdgroup-liquid/liquid/dist/react'

const generateDateStops = (startDate: string, endDate: string): string[] => {
  const stops: string[] = []
  const start = new Date(startDate)
  const end = new Date(endDate)

  // Ensure the start date is set to the first of the month
  start.setDate(1)

  // Generate all months between start and end dates
  let currentDate = new Date(start)
  while (currentDate < end) {
    // Use < to exclude the end month
    const formattedDate = currentDate.toLocaleString('default', {
      month: '2-digit',
      year: 'numeric',
    }) // Format as MM/YYYY
    stops.push(formattedDate)
    currentDate.setMonth(currentDate.getMonth() + 1) // Increment by 1 month
  }

  // If you want to include the last month if it is not already included
  if (currentDate.getTime() === end.getTime()) {
    const formattedDate = currentDate.toLocaleString('default', {
      month: '2-digit',
      year: 'numeric',
    })
    stops.push(formattedDate)
  }

  return stops
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  return `${month}/${year}`
}

const RangeSlider = ({
  simulationData,
  handleSliderChange,
}: {
  simulationData: { init_date: string; end_date: string }
  handleSliderChange: (value: string[]) => void
}) => {
  const sliderRef = useRef(null)
  const [startDateValue, setStartDateValue] = useState<number>(0)
  const [endDateValue, setEndDateValue] = useState<number>(0)
  const [generatedDates, setGeneratedDates] = useState<string[]>([])
  const [dateMap, setDateMap] = useState<{ [key: number]: string }>({})

  useEffect(() => {
    const generateDates = generateDateStops(
      simulationData.init_date,
      simulationData.end_date
    )
    setGeneratedDates(generateDates)

    const stopsArray = generateDates.map((_, index) => index)

    const dateMapping = stopsArray.reduce((acc, index) => {
      acc[index] = generateDates[index]
      return acc
    }, {} as { [key: number]: string })

    setDateMap(dateMapping)

    // Set initial values based on simulationData
    const initialDateIndex = generateDates.findIndex(
      (date) => date === formatDate(simulationData.init_date)
    )
    const endDateIndex = generateDates.findIndex(
      (date) => date === formatDate(simulationData.end_date)
    )

    if (initialDateIndex !== -1) {
      setStartDateValue(initialDateIndex)
    }
    if (endDateIndex !== -1) {
      setEndDateValue(endDateIndex)
    }

    updateSliderStyles(sliderRef.current, dateMapping[0], dateMapping[1])
  }, [simulationData])

  // Calculate the visible range (5 months)
  const visibleStartIndex = Math.max(0, startDateValue - 5)
  const visibleEndIndex = Math.min(
    generatedDates.length - 1,
    startDateValue + 5
  )

  const ldOnChange = (e: any) => {
    const start = e.detail[0]
    const end = e.detail[1]
    setStartDateValue(start)
    setEndDateValue(end)
    updateSliderStyles(e.target, dateMap[start], dateMap[end])
    handleSliderChange([dateMap[start], dateMap[end]])
  }

  const updateSliderStyles = (
    slider: { shadowRoot: ShadowRoot | null } | null,
    startDate: string,
    endDate: string
  ): void => {
    if (slider && slider.shadowRoot) {
      slider.shadowRoot.querySelector('style')?.remove()
      const style = document.createElement('style')
      style.textContent = `
        .ld-slider__output[for="ld-slider-1-value-0"]:after {content: "${startDate}" !important;}
        .ld-slider__output[for="ld-slider-1-value-1"]:after {content: "${endDate}" !important;}
      `
      slider.shadowRoot.appendChild(style)
    }
  }

  return (
    <div className='customRangeSlider px-4'>
      <div className='rangeSlider'>
        <LdSlider
          indicators
          hideValueLabels
          // hideValues
          min={0}
          max={generatedDates.length - 1}
          value={`0, ${generatedDates.length}`}
          step={1}
          ref={sliderRef}
          stops={Array.from({ length: generatedDates.length }, (_, i) => i)
            .slice(1)
            .join(',')}
          onLdchange={ldOnChange}
          style={{ '--now': 9897, '--value1': endDateValue }}
        ></LdSlider>
      </div>
      {generatedDates && (
        <div className='date-stops'>
          {generatedDates
            .slice(visibleStartIndex, visibleEndIndex + 1)
            .map((dateStop, index) => (
              <span key={index}>{dateStop}</span>
            ))}
        </div>
      )}
    </div>
  )
}

export default RangeSlider
