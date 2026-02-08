import { forwardRef } from 'react';

interface WebcamProps {
    width?: number;
    height?: number;
}

export const Webcam = forwardRef<HTMLVideoElement, WebcamProps>(
    ({ width = 640, height = 480 }, ref) => {
        return (
            <div className="relative">
                <video
                    ref={ref}
                    autoPlay
                    playsInline
                    muted
                    width={width}
                    height={height}
                    className="transform -scale-x-100" // Mirror the video
                    style={{ display: 'block' }}
                />
            </div>
        );
    }
);

Webcam.displayName = 'Webcam';
