import { forwardRef } from 'react';

interface CanvasProps {
    width?: number;
    height?: number;
}

export const Canvas = forwardRef<HTMLCanvasElement, CanvasProps>(
    ({ width = 640, height = 480 }, ref) => {
        return (
            <canvas
                ref={ref}
                width={width}
                height={height}
                className="transform -scale-x-100 pointer-events-none" // Mirror
                style={{ position: 'absolute', top: 0, left: 0 }}
            />
        );
    }
);

Canvas.displayName = 'Canvas';
