import React from 'react';
import PropTypes from 'prop-types';
import { SwipeProps } from '../FlipToolkit/Swipe/types';
declare type SwipeComponentProps = SwipeProps & {
    children: React.ReactElement;
};
declare function SwipeWrapper(props: SwipeComponentProps): JSX.Element;
declare namespace SwipeWrapper {
    var propTypes: {
        children: PropTypes.Validator<string | number | boolean | {} | PropTypes.ReactElementLike | PropTypes.ReactNodeArray>;
        flipId: PropTypes.Requireable<React.ReactText>;
        touchOnly: PropTypes.Requireable<boolean>;
        onClick: PropTypes.Requireable<(...args: any[]) => any>;
        onUp: PropTypes.Requireable<(...args: any[]) => any>;
        onDown: PropTypes.Requireable<(...args: any[]) => any>;
        threshold: PropTypes.Requireable<number>;
        right: PropTypes.Requireable<boolean | PropTypes.InferProps<{
            initFlip: PropTypes.Requireable<(...args: any[]) => any>;
            cancelFlip: PropTypes.Requireable<(...args: any[]) => any>;
            threshold: PropTypes.Requireable<number>;
        }>>;
        left: PropTypes.Requireable<boolean | PropTypes.InferProps<{
            initFlip: PropTypes.Requireable<(...args: any[]) => any>;
            cancelFlip: PropTypes.Requireable<(...args: any[]) => any>;
            threshold: PropTypes.Requireable<number>;
        }>>;
        top: PropTypes.Requireable<boolean | PropTypes.InferProps<{
            initFlip: PropTypes.Requireable<(...args: any[]) => any>;
            cancelFlip: PropTypes.Requireable<(...args: any[]) => any>;
            threshold: PropTypes.Requireable<number>;
        }>>;
        bottom: PropTypes.Requireable<boolean | PropTypes.InferProps<{
            initFlip: PropTypes.Requireable<(...args: any[]) => any>;
            cancelFlip: PropTypes.Requireable<(...args: any[]) => any>;
            threshold: PropTypes.Requireable<number>;
        }>>;
    };
}
export default SwipeWrapper;
