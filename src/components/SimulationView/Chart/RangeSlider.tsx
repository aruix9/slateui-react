import { useCallback, useEffect, useRef, useState } from 'react'
import './rangeslider.css'
import { LdLoading, LdSlider } from '@emdgroup-liquid/liquid/dist/react'

const generateDateStops = (startDate: string, endDate: string): string[] => {
  const stops: string[] = []
  const start = new Date(startDate)
  const end = new Date(endDate)

  // Ensure the start date is set to the first of the month
  start.setDate(1)

  // Generate all months between start and end dates
  let currentDate = new Date(start)
  while (currentDate < end) {
    const formattedDate = currentDate.toLocaleString('default', {
      month: '2-digit',
      year: 'numeric',
    })
    stops.push(formattedDate)
    currentDate.setMonth(currentDate.getMonth() + 1) // Increment by 1 month
  }

  // Include the last month if it is not already included
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
  const [startDateValue, setStartDateValue] = useState<number>(0)
  const [endDateValue, setEndDateValue] = useState<number>(0)
  const [generatedDates, setGeneratedDates] = useState<string[]>([])
  const [dateMap, setDateMap] = useState<{ [key: number]: string }>({})

  // const sliderRef = useRef(null)
  const [sliderNode, setSliderNode] = useState(null)

  // useEffect(() => {
  //   if (sliderRef.current) {
  //     console.log('Input ref:', sliderRef.current)

  //     // updateSliderStyles(sliderRef, dateMap[0], dateMap[1])
  //     // inputRef.current.focus(); // Example usage
  //   }
  // }, [])

  const refCallback = useCallback(
    (node: HTMLLdSliderElement) => {
      if (node) {
        updateSliderStyles(node, dateMap[0], dateMap[1])
      }
      setSliderNode(null)
    },
    [dateMap]
  )

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

    // Validate the indices
    if (
      start < 0 ||
      end < 0 ||
      start >= generatedDates.length ||
      end >= generatedDates.length
    ) {
      console.warn('Invalid slider values:', start, end)
      return // Exit if values are out of bounds
    }

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
      const styleId = 'custom-style'
      let styleTag = slider.shadowRoot.getElementById('custom-style')
      if (styleTag) {
        styleTag.textContent = `
          .ld-slider__output:nth-of-type(1):after {content: "${startDate}" !important;}
          .ld-slider__output:nth-of-type(2):after {content: "${endDate}" !important;}
        `
      } else {
        const newStyle = document.createElement('style')
        newStyle.id = styleId
        newStyle.setAttribute('data-added', 'true')
        newStyle.textContent = `
          .ld-slider__output:nth-of-type(1):after {content: "${startDate}" !important;}
          .ld-slider__output:nth-of-type(2):after {content: "${endDate}" !important;}
        `
        slider.shadowRoot.appendChild(newStyle)
      }
    }
  }

  if (!Object.keys(dateMap).length) {
    return <LdLoading />
  }

  return (
    <div className='customRangeSlider'>
      <div className='rangeSlider'>
        {Object.keys(dateMap).length && (
          <LdSlider
            hideValueLabels
            min={0}
            max={generatedDates.length - 1}
            value={`${startDateValue},${endDateValue}`}
            ref={refCallback}
            onLdchange={ldOnChange}
            style={{ '--now': 9897, '--value1': endDateValue }}
          ></LdSlider>
        )}
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
