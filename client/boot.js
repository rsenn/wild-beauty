// Server-provided settings (the `limits` part of the boot JSON).
import { createContext } from '../vendor/preact.js';
import { useContext } from '../vendor/hooks.js';

export const Boot = createContext({ limits: { maxBytes: Infinity } });

export const useBoot = () => useContext(Boot);
