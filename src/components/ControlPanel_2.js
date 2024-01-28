// ControlPanel2.js
import React from 'react';
import { Responsive, WidthProvider } from 'react-grid-layout';
import DraggableWidget from './DraggableWidget';
import FlowStopController from './FlowStopController';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const ResponsiveGridLayout = WidthProvider(Responsive);

const ControlPanel_2 = ({ hostIP, layout, onLayoutChange }) => {
  return (
    <ResponsiveGridLayout
      className="layout"
      layouts={{ lg: layout }}
      cols={{lg: 12, md: 10, sm: 6, xs: 4, xxs: 2}}
      rows={10}
      rowHeight={30}
      onLayoutChange={(newLayout) => onLayoutChange(newLayout)} >
      <div key="widget1"><DraggableWidget title="Widget 1" /></div>
      <div key="widget2"><DraggableWidget title="Widget 2" /></div>
      <div key="widget3"><DraggableWidget title="Widget 3" /></div>
      <div key="FlowStop"><FlowStopController hostIP={hostIP} title="Flow Stop" /></div>
    </ResponsiveGridLayout>
  );
};

export default ControlPanel_2;
