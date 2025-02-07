// redux state example components
import StateEditComponent from "./StateEditComponent";
import StateVisualizerComponent from "./StateVisualizerComponent";

// redux websocket handler
import WebSocketHandler from "./WebSocketHandler";
import WebSocketComponent from "./WebSocketComponent";

// other redux components
import LiveViewComponent from "./LiveViewComponent";
import PositionControllerComponent from "./PositionControllerComponent";

// well selector
import WellSelectorComponent from "./WellSelectorComponent";
import PointListEditorComponent from "./PointListEditorComponent";
 
 
const AxonTabComponent = () => {
  return (
    <div>
        <p>Basic redux state example</p>
        <div style={{ display: "flex" }}>
            <StateVisualizerComponent />
            <StateEditComponent />
        </div>

        <p>Websocket integration</p>
        <div style={{ display: "flex" }}>
            <WebSocketHandler />
            <WebSocketComponent />
            <LiveViewComponent />
            <PositionControllerComponent />
        </div>

        <p>Well selector</p>
        <div style={{ display: "flex" }}>
            <WellSelectorComponent /> 
            <PointListEditorComponent /> 
        </div>

    </div>
  );
}

export default AxonTabComponent;

