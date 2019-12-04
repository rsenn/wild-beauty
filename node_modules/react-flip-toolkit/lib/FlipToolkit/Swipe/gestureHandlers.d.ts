import { OnAction, Config, Set, SwipeEventHandlers } from './types';
interface HandlerProps {
    onAction: OnAction;
    config: Config;
}
declare function gestureHandlers(props: HandlerProps): {
    handlers: SwipeEventHandlers;
    set: Set;
};
export default gestureHandlers;
