import { DragContextProvider } from './DragContext';
import { ScreenContextProvider } from './ScreenContext';
import Screen from './Screen';


function NodeContainer() {
  return (
    <ScreenContextProvider>
      <DragContextProvider>
        <Screen />
      </DragContextProvider>
    </ScreenContextProvider>
  );
}

export default NodeContainer;