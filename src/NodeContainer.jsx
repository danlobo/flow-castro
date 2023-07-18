import { DragContextProvider } from './DragContext.jsx';
import { ScreenContextProvider } from './ScreenContext.jsx';
import Screen from './Screen.jsx';


function NodeContainer(props) {
  return (
    <ScreenContextProvider initialState={props.state}>
      <DragContextProvider>
        <Screen {...props} />
      </DragContextProvider>
    </ScreenContextProvider>
  );
}

export default NodeContainer;