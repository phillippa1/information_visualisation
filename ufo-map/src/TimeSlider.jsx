import { Range, getTrackBackground } from 'react-range';

const TimeSlider = ({ selectedYear, setSelectedYear }) => {
    const STEP = 1;
    const MIN = 1906;
    const MAX = 2014;

    return (
        <div
            style={{
                position: "absolute",
                bottom: 5,
                width: 'calc(100% - 40px)', // 20px left + 20px right padding

                background: "rgba(255,255,255,0.9)",
                padding: "10px 20px",
                zIndex: 2000,
                borderTop: "1px solid #ddd",
            }}
        >
            <label style={{ display: "block", marginBottom: "5px" }}>
                Year Range: {selectedYear[0]} — {selectedYear[1]}
            </label>

            <Range
                step={STEP}
                min={MIN}
                max={MAX}
                values={selectedYear}
                onChange={setSelectedYear}
                allowOverlap={false}   // thumbs cannot cross
                minDistance={1}        // minimum 1 year gap
                renderTrack={({ props, children }) => (
                    <div
                        {...props}
                        style={{
                            ...props.style,
                            height: '10px',
                            width: '100%',
                            borderRadius: '5px',
                            background: getTrackBackground({
                                values: selectedYear,
                                colors: ['#ddd', '#A0C79D', '#ddd'], // green in selected range
                                min: MIN,
                                max: MAX
                            }),
                            alignSelf: 'center',
                        }}
                    >
                        {children}
                    </div>
                )}
                renderThumb={({ props, index }) => (
                    <div
                        {...props}
                        style={{
                            ...props.style,
                            height: '24px',
                            width: '24px',
                            borderRadius: '50%',
                            backgroundColor: index === 0 ? '#70916C' : '#7085B8',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            boxShadow: '0 0 2px #AAA',
                        }}
                    >
                        <div style={{ position: 'absolute', top: '-28px', color: '#000', fontSize: '12px' }}>
                            {selectedYear[index]}
                        </div>
                    </div>
                )}
            />
        </div>
    );
};

export default TimeSlider;
