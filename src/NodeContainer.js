import { DragContextProvider } from './DragContext';
import { ScreenContextProvider } from './ScreenContext';
import Screen from './Screen';


function NodeContainer(props) {
  return (
    <ScreenContextProvider>
      <DragContextProvider>
        <Screen {...props} />
      </DragContextProvider>
    </ScreenContextProvider>
  );
}

export default NodeContainer;