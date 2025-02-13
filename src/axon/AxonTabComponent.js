import LiveViewControlWrapper from "./LiveViewControlWrapper";
import GenericTabBar from "./GenericTabBar";
import WellSelectorComponent from "./WellSelectorComponent";
import StateVisualizerComponent from "./StateVisualizerComponent";
import StateEditComponent from "./StateEditComponent";
import PointListEditorComponent from "./PointListEditorComponent";
import WebSocketComponent from "./WebSocketComponent";
import LiveViewComponent from "./LiveViewComponent";
import PositionControllerComponent from "./PositionControllerComponent";
import PositionViewComponent from "./PositionViewComponent";
import ParameterEditorComponent from "./ParameterEditorComponent";
 
 
const AxonTabComponent = () => {
  return ( 
    <div style={{ width: "75%" }}>
        
        <div style={{ display: "flex" }}>
          <WebSocketComponent /> 
          <PositionViewComponent /> 
          <StateVisualizerComponent />
          <StateVisualizerComponent />
          <StateEditComponent />
        </div>

        <div style={{ padding:"8px" }}></div>

        <div style={{ display: "flex" }}>
          <div style={{ flex: 3 }}>
            <GenericTabBar id="1" tabNames={["Well Selector","Live View", "Parameter", "Point List"]}>
                <WellSelectorComponent />
                <LiveViewControlWrapper />
                <ParameterEditorComponent /> 
                <PointListEditorComponent />
            </GenericTabBar>
          </div>
          <div style={{ flex: 2 }}>
            <GenericTabBar id="2" tabNames={["Live View", "Point List", "Parameter", "Well Selector"]}>
                <LiveViewControlWrapper/>
                <PointListEditorComponent />
                <ParameterEditorComponent /> 
                <WellSelectorComponent />
            </GenericTabBar>

          </div>
        </div>

        <div style={{ padding: "50px" }}>/\</div> 
    </div>
  );
}

export default AxonTabComponent;

