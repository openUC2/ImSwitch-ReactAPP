
import LiveViewComponent from "./LiveViewComponent";
import PositionControllerComponent from "./PositionControllerComponent";


 
 
 
const LiveViewControlWrapper = ({ useFastMode = true }) => {
  return ( 
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
        <div style={{ position: "relative", top: "0px", left: "0px", zIndex: 1, width: "100%", height: "100%" }}>
        <LiveViewComponent useFastMode={useFastMode} />
        </div>
        <div style={{ position: "absolute", bottom: "200px", left: "0px", zIndex: 2, }}>
        <PositionControllerComponent />
        </div>
    </div>
  );
}

export default LiveViewControlWrapper;

