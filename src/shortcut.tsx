// latest registered hotkey shall cover the previous callbacks, until it's unregistered
import { createContext, useContext, useEffect, useLayoutEffect, useRef, type PropsWithChildren } from "react";

type KeyHandler = (e: KeyboardEvent) => any
type registry = (key: string, callback: KeyHandler) => void;

const ShortcutContext = createContext<{register: registry, unregister: registry} | null>(null);

function getKey(e: KeyboardEvent): string {
    const MacOS = /mac/i.test(navigator.userAgent);
    const isCmdOrCtrl = MacOS ? e.metaKey : e.ctrlKey; // Windows用Ctrl, Mac用Command(Meta)
    const isCtrlOrWin = MacOS ? e.ctrlKey : e.metaKey;

    return (isCmdOrCtrl ? "Ctrl+" : "")
         + (isCtrlOrWin ? "Win+" : "")
         + (e.altKey ? "Alt+" : "")
         + (e.shiftKey ? "Shift+" : "")
         + (e.code)
}

export const ShortcutProvider = ({ children }: PropsWithChildren) => {
    const handlersRef = useRef<Record<string, KeyHandler[]>>({});

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const key = getKey(e);
            console.log("got key", key);
            const callbacks = handlersRef.current[key];
            const latestCallback = callbacks ? callbacks[callbacks.length - 1] : undefined;
            if(latestCallback) latestCallback(e);
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const register: registry = (key, callback) => {
        console.log("register:", key, callback);
        if (!handlersRef.current[key]) handlersRef.current[key] = [];
        handlersRef.current[key].push(callback);
    }

    const unregister: registry = (key, callback) => {
        console.log("unregister:", key, callback);
        if (!handlersRef.current[key]) return ;
        handlersRef.current[key] = handlersRef.current[key].filter(cb => cb !== callback);
    }

    return <ShortcutContext.Provider value={{register, unregister}}>
        {children}
    </ShortcutContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export const useShortcut = (key: string, callback: KeyHandler) => {
    const context = useContext(ShortcutContext);
    if (!context) throw new Error("useShortcut hook used outside provider");

    const {register, unregister} = context;
    const callbackRef = useRef(callback); // useRef here to avoid unneccessary re-registry
    useLayoutEffect(() => {callbackRef.current = callback}, [callback]);

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            e.preventDefault();
            console.log("handle", key);
            callbackRef.current(e);
        };

        register(key, handler);
        return () => unregister(key, handler);
    }, [key, register, unregister]);
}