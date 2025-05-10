import ParameterEditorComponent from "./ParameterEditorComponent";
import ExperimentComponent from "./ExperimentComponent";
 
 
 
const ParameterEditorWrapper = () => {
  return ( 
    <div style={{ position: "relative", width: "400", height: "300" }}>
        <div style={{ position: "relative", top: "0px", left: "0px", zIndex: 1, }}>
        <ParameterEditorComponent />
        </div>
        <div style={{ }}>
        <ExperimentComponent />
        </div>
    </div>
  );
}

export default ParameterEditorWrapper;

