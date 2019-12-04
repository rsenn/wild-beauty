import { Component } from 'react';
import { FlipperProps } from '../FlipToolkit/types';
import { FlippedElementPositionsBeforeUpdateReturnVals } from '../FlipToolkit/flip/getFlippedElementPositions/getFlippedElementPositionsBeforeUpdate/types';
declare class Flipper extends Component<FlipperProps> {
    static defaultProps: {
        applyTransformOrigin: boolean;
        element: string;
    };
    private inProgressAnimations;
    private flipCallbacks;
    private el?;
    getSnapshotBeforeUpdate(prevProps: FlipperProps): FlippedElementPositionsBeforeUpdateReturnVals | null;
    componentDidUpdate(prevProps: FlipperProps, _prevState: any, cachedData: FlippedElementPositionsBeforeUpdateReturnVals): void;
    render(): JSX.Element;
}
export default Flipper;
