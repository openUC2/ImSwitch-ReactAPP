import React, { Component } from 'react';
import { connect } from 'react-redux';

class StateVisualizerComponent extends Component {
  render() {
    const { x, y, z } = this.props; // Destructure the values from Redux state

    // Round x and y
    const roundedX = Math.round(x);
    const roundedY = Math.round(y);
    const roundedZ = Math.round(z);

    return (
      <div  style={{ border: '1px solid #eee', padding: '10px'}}>
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
              <td>{roundedX}</td>
            </tr>
            <tr>
              <td>y</td>
              <td>{roundedY}</td>
            </tr>
            <tr>
              <td>z</td>
              <td>{roundedZ}</td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }
}

// Map the Redux state to the component's props
const mapStateToProps = (state) => ({
  x: state.position.x,
  y: state.position.y,
  z: state.position.z,
});

// Connect the component to Redux store
export default connect(mapStateToProps)(StateVisualizerComponent);
