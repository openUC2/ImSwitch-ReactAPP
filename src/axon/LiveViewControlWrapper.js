
import LiveViewComponent from "./LiveViewComponent";
import PositionControllerComponent from "./PositionControllerComponent";


 
 
 
const LiveViewControlWrapper = () => {
  return ( 
    <div style={{ position: "relative", width: "100%", height: "400px" }}>
        <div style={{ position: "relative", top: "0px", left: "0px", zIndex: 1, width: "100%", height: "100%" }}>
        <LiveViewComponent />
        </div>
        <div style={{ position: "absolute", top: "0px", left: "0px", zIndex: 2, }}>
        <PositionControllerComponent />
        </div>
    </div>
  );
}

export default LiveViewControlWrapper;

