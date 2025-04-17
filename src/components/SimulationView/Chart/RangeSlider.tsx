import { useEffect, useState } from 'react';
import './rangeslider.css';

const generateDateStops = (startDate: string, endDate: string): string[] => {
    const stops: string[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Ensure the start date is set to the first of the month
    start.setDate(1);
    
    // Generate all months between start and end dates
    let currentDate = new Date(start);
    while (currentDate < end) { // Use < to exclude the end month
      const formattedDate = currentDate.toLocaleString('default', { month: '2-digit', year: 'numeric' }); // Format as MM/YYYY
      stops.push(formattedDate);
      currentDate.setMonth(currentDate.getMonth() + 1); // Increment by 1 month
    }

    // If you want to include the last month if it is not already included
    if (currentDate.getTime() === end.getTime()) {
      const formattedDate = currentDate.toLocaleString('default', { month: '2-digit', year: 'numeric' });
      stops.push(formattedDate);
    }

    return stops;
};


const formatDate = (dateString:string) => {
  const date = new Date(dateString);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${month}/${year}`;
};

const RangeSlider = ({
  simulationData,
  handleSliderChange,
}: { 
  simulationData: { init_date: string; end_date: string };
  handleSliderChange: (value: string[]) => void;
}) => {
  const [startDateValue, setStartDateValue] = useState<number>(0);
  const [endDateValue, setEndDateValue] = useState<number>(0);
  const [generatedDates, setGeneratedDates] = useState<string[]>([]);
  const [dateMap, setDateMap] = useState<{ [key: number]: string }>({});

  useEffect(() => {
    const generateDates = generateDateStops(simulationData.init_date, simulationData.end_date);
    setGeneratedDates(generateDates);
    
    const stopsArray = generateDates.map((_, index) => index);

    const dateMapping = stopsArray.reduce((acc, index) => {
      acc[index] = generateDates[index];
      return acc;
    }, {} as { [key: number]: string });

    setDateMap(dateMapping);

    // Set initial values based on simulationData
    const initialDateIndex = generateDates.findIndex(date => date === formatDate(simulationData.init_date));
    const endDateIndex = generateDates.findIndex(date => date === formatDate(simulationData.end_date));

    if (initialDateIndex !== -1) {
      setStartDateValue(initialDateIndex);
    }
    if (endDateIndex !== -1) {
      setEndDateValue(endDateIndex);
    }
  }, [simulationData]);

  // Calculate the visible range (5 months)
  const visibleStartIndex = Math.max(0, startDateValue - 5);
  const visibleEndIndex = Math.min(generatedDates.length - 1, startDateValue + 5);

  return (
    <div className='customRangeSlider'>
      <div className='rangeSlider'>
        <input
          type='range'
          min='0'
          max={generatedDates.length - 1} 
          step='1'
          className='startDateInput'
          value={startDateValue}
          onChange={(e) => {
            const val = parseInt(e.target.value);
            handleSliderChange([dateMap[val], dateMap[endDateValue]]);
            setStartDateValue(val);
          }}
        />
        <input
          type='range'
          min='0'
          max={generatedDates.length - 1} 
          step='1'
          className='endDateInput'
          value={endDateValue}
          onChange={(e) => {
            const val = parseInt(e.target.value);
            handleSliderChange([dateMap[startDateValue], dateMap[val]]);
            setEndDateValue(val);
          }}
        />
        <div className='rangeSliderTrack'>
          <div
            className='selectedRangeStart'
            style={{
              width: `${(startDateValue / (generatedDates.length - 1)) * 100}%`, 
            }}
          ></div>
          <div
            className='selectedRangeEnd'
            style={{
              width: `${(1 - (endDateValue / (generatedDates.length - 1))) * 100}%`, // Adjust width based on number of stops
            }}
          ></div>
        </div>
        <div  className='selectedRange'></div>
        <div
          className='startValue'
          style={{
            left: `${(startDateValue / (generatedDates.length - 1)) * 1}%`, // Adjust position based on number of stops
          }}
        >
          {dateMap[startDateValue]}
        </div>
        <div
          className='endValue' 
          style={{ left: `${(endDateValue / (generatedDates.length - 1)) * 100}%` }} // Adjust position based on number of stops
        >
          {dateMap[endDateValue]}
        </div>
      </div>
      <div className='rangeLabel'>
        {generatedDates && (
          <div className='date-stops'>
            {generatedDates.slice(visibleStartIndex, visibleEndIndex + 1).map((dateStop, index) => (
              <span key={index}>{dateStop}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RangeSlider;
