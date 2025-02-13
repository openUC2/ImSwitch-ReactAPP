import React from 'react';
import { useDispatch, useSelector } from 'react-redux';

//import { getPosition, setPosition } from './state/slices/positionSlice';
import * as positionSlice from "../state/slices/PositionSlice";

const StateEditComponent = () => {

  // Get the dispatch function
  const dispatch = useDispatch();

  // Access global Redux state
  const { x, y, z } = useSelector(positionSlice.getPosition);

    // Round x and y
    const roundedX = Math.round(x);
    const roundedY = Math.round(y);
    const roundedZ = Math.round(z);


  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    dispatch(positionSlice.setPosition({ ...{ x, y, z }, [name]: value }));
  };


  return (
    <div style={{ border: '1px solid #eee', padding: '10px' }}>
      <form>
        <table>
          <thead>
            <tr>
              <th>Label</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>x</td>
              <td>
                <input
                  type="number"
                  name="x"
                  value={roundedX}
                  step="10"
                  onChange={handleChange}
                />
              </td>
            </tr>
            <tr>
              <td>y</td>
              <td>
                <input
                  type="number"
                  name="y"
                  value={roundedY}
                  step="10"
                  onChange={handleChange}
                />
              </td>
            </tr>
            <tr>
              <td>z</td>
              <td>
                <input
                  type="number"
                  name="z"
                  value={roundedZ}
                  step="10"
                  onChange={handleChange}
                />
              </td>
            </tr>
          </tbody>
        </table>
      </form>
    </div>
  );
};

export default StateEditComponent;
