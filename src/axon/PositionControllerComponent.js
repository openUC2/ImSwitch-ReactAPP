import React, { useState } from 'react';

const PositionControllerComponent = () => {
  const [intervalId, setIntervalId] = useState(null);

  const movePosition = (direction) => {
    const url = `https://imswitch.openuc2.com/PositionerController/movePositioner?positionerName=VirtualStage&speed=20000&axis=`;

    let axis, dist;

    const speed = 5000;

    switch (direction) {
      case 'up':
        axis = 'Y';
        dist = speed;
        break;
      case 'down':
        axis = 'Y';
        dist = -speed;
        break;
      case 'left':
        axis = 'X';
        dist = speed;
        break;
      case 'right':
        axis = 'X';
        dist = -speed;
        break;
      default:
        return;
    }

    const apiUrl = `${url}${axis}&dist=${dist}&isAbsolute=false&isBlocking=false&speed=20000`;

    // Send the request to the server
    fetch(apiUrl)
      .then(response => response.json())
      .then(data => {
        console.log('Moved Successfully:', data);
      })
      .catch(error => {
        console.error('Moved Error:', error);
      });
  };

  const startMoving = (direction) => {
    // Start calling movePosition repeatedly
    const id = setInterval(() => {
      movePosition(direction);
    }, 100); // 100ms interval, adjust as needed
    setIntervalId(id);
  };

  const stopMoving = () => {
    // Clear the interval to stop calling movePosition
    if (intervalId) {
      clearInterval(intervalId);
      setIntervalId(null);
    }
  };

  return (
    <div className="arrow-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: "10px", border: '0px solid white' }}>
      <div>
        <button
          onMouseDown={() => startMoving('up')}
          onMouseUp={stopMoving}
          onMouseLeave={stopMoving}
          style={{ padding: '0px 8px', fontSize: '24px' }}
        >
          ↑
        </button>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100px' }}>
        <button
          onMouseDown={() => startMoving('left')}
          onMouseUp={stopMoving}
          onMouseLeave={stopMoving}
          style={{ padding: '0px 4px', fontSize: '24px' }}
        >
          ←
        </button>
        <button
          onMouseDown={() => startMoving('right')}
          onMouseUp={stopMoving}
          onMouseLeave={stopMoving}
          style={{ padding: '0px 4px', fontSize: '24px' }}
        >
          →
        </button>
      </div>
      <div>
        <button
          onMouseDown={() => startMoving('down')}
          onMouseUp={stopMoving}
          onMouseLeave={stopMoving}
          style={{ padding: '0px 8px', fontSize: '24px' }}
        >
          ↓
        </button>
      </div>
    </div>
  );
};

export default PositionControllerComponent;
