import { useRef, useEffect } from 'react';

interface SettingsModalProps {
    devices: MediaDeviceInfo[];
    selectedDeviceId: string | undefined;
    onSelectDevice: (deviceId: string) => void;
    maxPoses: number;
    onMaxPosesChange: (poses: number) => void;
    enableHands: boolean;
    onEnableHandsChange: (enabled: boolean) => void;
    enableFace: boolean;
    onEnableFaceChange: (enabled: boolean) => void;
    isOpen: boolean;
    onClose: () => void;
}

export const SettingsModal = ({
    devices,
    selectedDeviceId,
    onSelectDevice,
    maxPoses,
    onMaxPosesChange,
    enableHands,
    onEnableHandsChange,
    enableFace,
    onEnableFaceChange,
    isOpen,
    onClose,
}: SettingsModalProps) => {
    const modalRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.7)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
        }}>
            <div
                ref={modalRef}
                style={{
                    backgroundColor: '#333',
                    padding: '20px',
                    borderRadius: '8px',
                    color: 'white',
                    minWidth: '300px'
                }}
            >
                <h2 style={{ marginTop: 0 }}>Settings</h2>
                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px' }}>Camera:</label>
                    <select
                        value={selectedDeviceId || ''}
                        onChange={(e) => onSelectDevice(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '8px',
                            borderRadius: '4px',
                            border: '1px solid #555',
                            backgroundColor: '#222',
                            color: 'white'
                        }}
                    >
                        {devices.map((device) => (
                            <option key={device.deviceId} value={device.deviceId}>
                                {device.label || `Camera ${device.deviceId.slice(0, 5)}...`}
                            </option>
                        ))}
                    </select>
                </div>
                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px' }}>Detected People: {maxPoses}</label>
                    <select
                        value={maxPoses}
                        onChange={(e) => onMaxPosesChange(parseInt(e.target.value))}
                        style={{
                            width: '100%',
                            padding: '8px',
                            borderRadius: '4px',
                            border: '1px solid #555',
                            backgroundColor: '#222',
                            color: 'white'
                        }}
                    >
                        {[1, 2, 3, 4, 5].map(num => (
                            <option key={num} value={num}>{num}</option>
                        ))}
                    </select>
                </div>
                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                        <input
                            type="checkbox"
                            checked={enableHands}
                            onChange={(e) => onEnableHandsChange(e.target.checked)}
                            style={{ marginRight: '10px', width: '20px', height: '20px' }}
                        />
                        Enable Hand Detection
                    </label>
                </div>
                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                        <input
                            type="checkbox"
                            checked={enableFace}
                            onChange={(e) => onEnableFaceChange(e.target.checked)}
                            style={{ marginRight: '10px', width: '20px', height: '20px' }}
                        />
                        Enable Face Detection
                    </label>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                        onClick={onClose}
                        style={{
                            padding: '8px 16px',
                            backgroundColor: '#646cff',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};
