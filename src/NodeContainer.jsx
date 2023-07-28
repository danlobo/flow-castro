import { DragContextProvider } from './DragContext.jsx';
import { ScreenContextProvider } from './ScreenContext.jsx';
import Screen from './Screen.jsx';

function NodeContainer({ theme, themes, state, ...props}) {
  return (
    <ScreenContextProvider initialState={state}>
      <DragContextProvider>
        <Screen {...props}/>
      </DragContextProvider>
    </ScreenContextProvider>
  );
}

export default NodeContainer;