import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { ShortcutProvider } from './shortcut.tsx'

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <ShortcutProvider>
            <App />
        </ShortcutProvider>
    </StrictMode>,
)
