import { SwipeProps, SwipeEventHandlers, OnActionArgs } from './types';
declare class Swipe {
    props: SwipeProps;
    private set;
    handlers: SwipeEventHandlers;
    private flipInitiatorData;
    private isFinishing;
    prevProps: {};
    constructor(props: SwipeProps);
    onAction({ velocity, delta: [deltaX, deltaY], down, first }: OnActionArgs): void;
}
export default Swipe;
