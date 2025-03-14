import LiveViewControlWrapper from "./LiveViewControlWrapper";
import GenericTabBar from "./GenericTabBar";
import WellSelectorComponent from "./WellSelectorComponent";
import PointListEditorComponent from "./PointListEditorComponent";
import PointListShapeEditorComponent from "./PointListShapeEditorComponent";
import WebSocketComponent from "./WebSocketComponent";
import LiveViewComponent from "./LiveViewComponent";
import PositionControllerComponent from "./PositionControllerComponent";
import PositionViewComponent from "./PositionViewComponent";
import ParameterEditorComponent from "./ParameterEditorComponent";
import ExperimentComponent from "./ExperimentComponent";
import ObjectiveController from "../components/ObjectiveController";
import ResizablePanel from "./ResizablePanel"; //<ResizablePanel></ResizablePanel> performace issues :/

const AxonTabComponent = () => {
  return (
    <div style={{ width: "100%" }}>
      <div style={{ display: "flex" }}>
        <div style={{ flex: 3 }}>
          <GenericTabBar
            id="1"
            tabNames={[
              "Well Selector",
              "Live View",
              "Parameter",
              "Points",
              "State",
            ]}
          >
            <WellSelectorComponent />
            <LiveViewControlWrapper />
            <ParameterEditorComponent />

            <PointListEditorComponent />
            <div style={{ display: "flex" }}>
              <WebSocketComponent />
              <PositionViewComponent />
            </div>
          </GenericTabBar>
        </div>
        <div style={{ flex: 2 }}>
          <GenericTabBar
            id="2"
            tabNames={[
              "Live View",
              "Points",
              "Shape",
              "Parameter",
              "Well Selector",
              "Experiment",
              "Objective"
            ]}
          >
            <LiveViewControlWrapper />
            <PointListEditorComponent />
            <PointListShapeEditorComponent />
            <ParameterEditorComponent />
            <WellSelectorComponent />
            <ExperimentComponent />
            <ObjectiveController />
          </GenericTabBar>
        </div>
      </div>
    </div>
  );
};

export default AxonTabComponent;
