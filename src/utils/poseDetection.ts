import {
    PoseLandmarker,
    HandLandmarker,
    FaceLandmarker,
    FilesetResolver,
    DrawingUtils
} from '@mediapipe/tasks-vision';
import type { PoseLandmarkerResult, HandLandmarkerResult, FaceLandmarkerResult } from '@mediapipe/tasks-vision';

export const createPoseLandmarker = async (numPoses: number = 5) => {
    const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.32/wasm'
    );

    const poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task`,
            delegate: 'GPU'
        },
        runningMode: 'VIDEO',
        numPoses: numPoses
    });

    return poseLandmarker;
};

export const createHandLandmarker = async (numHands: number = 2) => {
    const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.32/wasm'
    );

    const handLandmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
            delegate: 'GPU'
        },
        runningMode: 'VIDEO',
        numHands: numHands
    });

    return handLandmarker;
};

export const createFaceLandmarker = async (numFaces: number = 1) => {
    const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.32/wasm'
    );

    const faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
            delegate: 'GPU'
        },
        runningMode: 'VIDEO',
        numFaces: numFaces
    });

    return faceLandmarker;
};

export const drawPose = (
    canvasCtx: CanvasRenderingContext2D,
    poseLandmarkerResult: PoseLandmarkerResult
) => {
    const drawingUtils = new DrawingUtils(canvasCtx);
    for (const landmark of poseLandmarkerResult.landmarks) {
        drawingUtils.drawLandmarks(landmark, {
            radius: (data) => DrawingUtils.lerp(data.from!.z, -0.15, 0.1, 5, 1)
        });
        drawingUtils.drawConnectors(landmark, PoseLandmarker.POSE_CONNECTIONS);
    }
};

export const drawHands = (
    canvasCtx: CanvasRenderingContext2D,
    handLandmarkerResult: HandLandmarkerResult
) => {
    const drawingUtils = new DrawingUtils(canvasCtx);
    for (const landmark of handLandmarkerResult.landmarks) {
        drawingUtils.drawConnectors(landmark, HandLandmarker.HAND_CONNECTIONS, {
            color: "#00FF00",
            lineWidth: 2
        });
        drawingUtils.drawLandmarks(landmark, {
            color: "#FF0000",
            lineWidth: 1,
            radius: 3
        });
    }
};

export const drawFace = (
    canvasCtx: CanvasRenderingContext2D,
    faceLandmarkerResult: FaceLandmarkerResult
) => {
    const drawingUtils = new DrawingUtils(canvasCtx);
    for (const landmark of faceLandmarkerResult.faceLandmarks) {
        drawingUtils.drawConnectors(landmark, FaceLandmarker.FACE_LANDMARKS_TESSELATION, {
            color: "#C0C0C070",
            lineWidth: 1
        });
        drawingUtils.drawConnectors(landmark, FaceLandmarker.FACE_LANDMARKS_RIGHT_EYE, {
            color: "#FF3030",
            lineWidth: 1
        });
        drawingUtils.drawConnectors(landmark, FaceLandmarker.FACE_LANDMARKS_RIGHT_EYEBROW, {
            color: "#FF3030",
            lineWidth: 1
        });
        drawingUtils.drawConnectors(landmark, FaceLandmarker.FACE_LANDMARKS_LEFT_EYE, {
            color: "#30FF30",
            lineWidth: 1
        });
        drawingUtils.drawConnectors(landmark, FaceLandmarker.FACE_LANDMARKS_LEFT_EYEBROW, {
            color: "#30FF30",
            lineWidth: 1
        });
        drawingUtils.drawConnectors(landmark, FaceLandmarker.FACE_LANDMARKS_FACE_OVAL, {
            color: "#E0E0E0",
            lineWidth: 1
        });
        drawingUtils.drawConnectors(landmark, FaceLandmarker.FACE_LANDMARKS_LIPS, {
            color: "#E0E0E0",
            lineWidth: 1
        });
    }
};
