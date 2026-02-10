import { Layout } from './components/Layout';
import { RegisterList } from './components/RegisterList';
import { Viewport } from './components/Viewport';
import { OpsGraph } from './components/OpsGraph';
import { Timeline } from './components/Timeline';
import { InputPanel } from './components/InputPanel';
import { useStore } from './store';

import { useEffect } from 'react';
import { demoProgram } from './demo_state';

function App() {
  const interactionMode = useStore((state) => state.ui.interactionMode);
  const setProgram = useStore((state) => state.setProgram);
  const isSourceMode = interactionMode === 'source';

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.shiftKey && e.key === 'D') {
        console.log('Loading Demo Start...');
        // Load only the source image first (Step 1)
        setProgram({
          ...demoProgram,
          registers: [], ops: [], wires: [], schedule: []
        });
      }
      if (e.shiftKey && e.key === 'F') {
        console.log('Loading Full Graph...');
        // Load the full graph (Step 3)
        setProgram(demoProgram);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      <div className="fixed bottom-1 right-1 text-[10px] text-neutral-600 pointer-events-none z-50 select-none">
        v{import.meta.env.PACKAGE_VERSION} (Source Mode Default)
      </div>
      <Layout
        left={
          <div className="flex flex-col h-full">
            <InputPanel />
            {isSourceMode && (
              <div className="flex-1 overflow-y-auto">
                <RegisterList />
              </div>
            )}
          </div>
        }
        center={<Viewport />}
        right={isSourceMode ? <OpsGraph /> : null}
        bottom={<Timeline />}
      />
    </>
  );
}

export default App
