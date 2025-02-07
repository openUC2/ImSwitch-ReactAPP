
import StateEditComponent from "./StateEditComponent";
import StateVisualizerComponent from "./StateVisualizerComponent";
 
 
const AxonTabComponent = () => {
  return (
    <div style={{ display: "flex" }}>
        <StateVisualizerComponent />
        <StateEditComponent />
    </div>
 
    
  );
}

export default AxonTabComponent;

