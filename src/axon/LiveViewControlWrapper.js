
import LiveViewComponent from "./LiveViewComponent";
import PositionControllerComponent from "./PositionControllerComponent";


 
 
 
const LiveViewControlWrapper = () => {
  return ( 
    <div style={{ position: "relative", width: "400", height: "300" }}>
        <div style={{ position: "relative", top: "0px", left: "0px", zIndex: 1, }}>
        <LiveViewComponent />
        </div>
        <div style={{ position: "absolute", top: "0px", left: "0px", zIndex: 2, }}>
        <PositionControllerComponent />
        </div>
    </div>
  );
}

export default LiveViewControlWrapper;

