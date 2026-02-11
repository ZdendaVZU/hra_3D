import React, { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, useAnimations, Html } from '@react-three/drei';
import * as THREE from 'three';
import { SkeletonUtils } from 'three-stdlib';
import { Pose } from 'kalidokit';
import type { PoseLandmarkerResult } from '@mediapipe/tasks-vision';

// Preload the GLTF
useGLTF.preload('/models/character/character_rigged.gltf');

interface RiggedCharacterProps {
    animation?: string; // e.g. "Idle", "Run"
    poseResult?: PoseLandmarkerResult | null;
    [key: string]: any; // Allow other props like scale, position, etc.
}

export function RiggedCharacter({ animation = "Idle", poseResult, ...props }: RiggedCharacterProps) {
    // Debug ver
    useEffect(() => { console.log("RiggedCharacter v5.0 - Final Correction (Sides & Z-1)"); }, []);

    const group = useRef<THREE.Group>(null);
    // Load the GLTF model
    const { scene, animations } = useGLTF('/models/character/character_rigged.gltf');
    // Clone correctly using SkeletonUtils to ensure SkinnedMesh binds to new bones
    const clonedScene = React.useMemo(() => SkeletonUtils.clone(scene), [scene]);

    // Animations
    const { actions, names } = useAnimations(animations, group);

    // Determine which animation to play
    // Exact match or partial match
    let actionName = names.find(n => n.toLowerCase().includes(animation.toLowerCase()));

    useEffect(() => {
        // Log available animations to find correct names
        // console.log("Available animations:", names);

        // If we have poseResult, we generally want to STOP animations or blend them.
        // For now, let's say if poseResult is present, we stop animations.
        // BUT, user might want to run AND move arms.
        // Let's keep animation logic simple: if animation prop changes, we play it.

        if (!processPose && actionName) { // Only play animation if NOT processing pose (or maybe mix?)
            const action = actions[actionName];
            if (action) {
                action.reset().fadeIn(0.2).play();
                return () => {
                    action.fadeOut(0.2);
                };
            }
        } else {
            // If we are controlling via webcam, fade out current animation
            if (actionName && actions[actionName]) {
                actions[actionName]?.fadeOut(0.2);
            }
        }
    }, [animation, actions, names, actionName, poseResult]); // Added poseResult dependency

    // Debug: Log Bone Names
    /*
    useEffect(() => {
        if (scene) {
            const bones: string[] = [];
            scene.traverse((obj) => {
                if ((obj as THREE.Bone).isBone) {
                    bones.push(obj.name);
                }
            });
            console.log("Skeleton Bone Names:", bones);
        }
    }, [scene]);
    */

    useEffect(() => {
        if (!clonedScene) return;

        // Traverse to enable shadows and find bones
        clonedScene.traverse((child: any) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                child.frustumCulled = false;
            }
        });

    }, [clonedScene]);

    // Manual Pose Control State
    const [manualPose, setManualPose] = React.useState<string>("Auto"); // Changed default to Auto
    const [debugBones, setDebugBones] = React.useState<string[]>([]);

    // Check if we should process pose from webcam
    const processPose = manualPose === "Auto" && !!poseResult;

    // Capture bone names on load for debug display
    useEffect(() => {
        if (clonedScene) {
            const b: string[] = [];
            clonedScene.traverse((child) => {
                if ((child as THREE.Bone).isBone) {
                    b.push(child.name);
                }
            });
            setDebugBones(b);
        }
    }, [clonedScene]);

    // Helper to find bone by partial name
    const findBone = (partialName: string) => {
        let bone: THREE.Bone | undefined;
        if (!clonedScene) return undefined;
        clonedScene.traverse((child) => {
            if ((child as THREE.Bone).isBone && child.name.toLowerCase().includes(partialName.toLowerCase())) {
                bone = child as THREE.Bone;
            }
        });
        return bone;
    };

    // Apply Manual Poses or Webcam Poses
    useFrame(() => {
        if (!clonedScene) return;

        // Reset rotation if necessary?
        // If we simply apply rotation every frame, we might not need to reset, 
        // BUT Mixamo animations might conflict.

        // Webcam Control
        if (processPose && poseResult && poseResult.worldLandmarks && poseResult.worldLandmarks.length > 0) {
            // landmarks: Normalized (screen space) - Kalidokit likes these for loose solving?
            // worldLandmarks: Metric 3D - Kalidokit might use these?
            // Kalidokit docs: `Pose.solve(pose3D, pose2D?, options?)`
            // "pose3D" usually refers to the 3D landmarks (x,y,z).
            // "pose2D" refers to x,y pixel/normalized.

            // Actually, MediaPipe returns `landmarks` (NormalizedLandmark, x,y,z in 0..1)
            // and `worldLandmarks` (Landmark, x,y,z in meters).

            // Let's pass `worldLandmarks` as the first arg (3D) and `landmarks` as optional.
            const wLandmarks = poseResult.worldLandmarks[0];
            const nLandmarks = poseResult.landmarks[0];

            // Solve using Kalidokit
            if (wLandmarks) {
                const riggedPoseRaw = Pose.solve(wLandmarks as any, nLandmarks as any, {
                    runtime: "mediapipe",
                    video: undefined,
                });

                if (riggedPoseRaw) {
                    const riggedPose = riggedPoseRaw as any; // Cast to avoid TS errors

                    // Helper function to apply rotation
                    // Kalidokit returns Euler angles {x,y,z} or Quaternion {x,y,z,w} depending on config.
                    // Default is quaternion if using `VRM` helpers, but raw solve?
                    // Looking at types: usually keys like "RightUpperArm" return {x,y,z} (Euler) or {x,y,z,w} (Quaternion).

                    // We need to mirror the movement because the character is facing away from us (avatar mode),
                    // but the webcam and MediaPipe are likely mirrored (mirror mode).
                    // Usually, negating X and Z of the quaternion mirrors the rotation across the YZ plane? 
                    // Or negating Y and Z?
                    // Let's try inverting Y and Z for Spine to fix the "leaning left instead of right" issue.

                    // Helper function to apply rotation with variable axis negation
                    // invert logic: {x: 1, y: 1, z: 1} is default
                    // Spine needed {x: 1, y: -1, z: -1}
                    // Arms seem to need full inversion (Inverse Quaternion) {-x, -y, -z} to fix "Up is Down" and "Out is In"

                    const rigBone = (boneName: string, rigidPart: any, factors: { x: number, y: number, z: number } = { x: 1, y: 1, z: 1 }) => {
                        const bone = findBone(boneName);
                        if (bone && rigidPart) {
                            if (rigidPart.w !== undefined) {
                                // Quaternion
                                bone.quaternion.set(
                                    rigidPart.x * factors.x,
                                    rigidPart.y * factors.y,
                                    rigidPart.z * factors.z,
                                    rigidPart.w
                                );
                            } else if (rigidPart.x !== undefined) {
                                // Euler (Rotation)
                                bone.rotation.set(
                                    rigidPart.x * factors.x,
                                    rigidPart.y * factors.y,
                                    rigidPart.z * factors.z
                                );
                            }
                        }
                    };

                    // Map parts

                    // Spine/Hips/Neck - Works well with { x: 1, y: -1, z: -1 }
                    const spineFactors = { x: 1, y: -1, z: -1 };
                    rigBone("Spine", riggedPose.Spine, spineFactors);
                    rigBone("Hips", riggedPose.Hips, spineFactors);
                    rigBone("Neck", riggedPose.Neck, spineFactors);
                    rigBone("Head", riggedPose.Head, spineFactors);

                    // Arms & Legs
                    // User said: "Sides are correct" (with Swapped mapping).
                    // User said: "Up is Down" (with z = -1).
                    // Plan: Keep Swapped mapping, but flip Z back to 1 to fix "Up".

                    const swappedLimbFactors = { x: 1, y: -1, z: 1 };

                    // Right Arm -> Mapped to Left data (Mirroring to fix swapped sides)
                    rigBone("RightArm", riggedPose.LeftUpperArm, swappedLimbFactors);
                    rigBone("RightForeArm", riggedPose.LeftLowerArm, swappedLimbFactors);

                    // Left Arm -> Mapped to Right data
                    rigBone("LeftArm", riggedPose.RightUpperArm, swappedLimbFactors);
                    rigBone("LeftForeArm", riggedPose.RightLowerArm, swappedLimbFactors);

                    // Legs - Also swapped
                    rigBone("RightUpLeg", riggedPose.LeftUpperLeg, swappedLimbFactors);
                    rigBone("RightLeg", riggedPose.LeftLowerLeg, swappedLimbFactors);

                    rigBone("LeftUpLeg", riggedPose.RightUpperLeg, swappedLimbFactors);
                    rigBone("LeftLeg", riggedPose.RightLowerLeg, swappedLimbFactors);
                }
            }
        }
        else if (manualPose === "Hands Up") {
            // ... keep existing manual logic ...
            // BUT we should probably move this to useFrame too if we want smooth updates or just setting it once is fine.
            // Setting once in useEffect is fine for static poses.
        }

    });

    // Existing Manual Poses Effect for static poses
    useEffect(() => {
        if (!clonedScene) return;
        if (processPose) return; // Skip if processing webcam

        // Reset all rotations first
        clonedScene.traverse((child) => {
            if ((child as THREE.Bone).isBone) {
                child.rotation.set(0, 0, 0);
            }
        });

        if (manualPose === "Hands Up") {
            const armL = findBone("arm_l") || findBone("upperarm_l") || findBone("shoulder_l");
            const armR = findBone("arm_r") || findBone("upperarm_r") || findBone("shoulder_r");

            if (armL) armL.rotation.z = Math.PI / 2; // Raise left arm
            if (armR) armR.rotation.z = -Math.PI / 2; // Raise right arm
        }

        if (manualPose === "Bow") {
            const spine = findBone("spine") || findBone("spine1") || findBone("hips");
            if (spine) spine.rotation.x = Math.PI / 4; // Lean forward
        }
    }, [manualPose, clonedScene, processPose]);


    return (
        <group ref={group} {...props} dispose={null}>
            <group scale={0.01} rotation={[0, Math.PI, 0]}>
                <primitive object={clonedScene} />
                <Html position={[0, 2.2, 0]} center>
                    <div style={{ background: 'rgba(0,0,0,0.8)', color: 'white', padding: '12px', borderRadius: '8px', pointerEvents: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '150px' }}>
                        <h3 style={{ margin: '0 0 5px 0', fontSize: '14px', borderBottom: '1px solid #555', paddingBottom: '4px' }}>Pose Controls</h3>

                        <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                            <button onClick={() => setManualPose("Auto")} style={{ background: manualPose === "Auto" ? '#2196F3' : '#333', color: 'white', border: 'none', padding: '5px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', flex: '1' }}>
                                Webcam
                            </button>
                            <button onClick={() => setManualPose("T-Pose")} style={{ background: manualPose === "T-Pose" ? '#4CAF50' : '#333', color: 'white', border: 'none', padding: '5px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', flex: '1' }}>
                                T-Pose
                            </button>
                            <button onClick={() => setManualPose("Hands Up")} style={{ background: manualPose === "Hands Up" ? '#4CAF50' : '#333', color: 'white', border: 'none', padding: '5px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', flex: '1' }}>
                                Hands Up
                            </button>
                            <button onClick={() => setManualPose("Bow")} style={{ background: manualPose === "Bow" ? '#4CAF50' : '#333', color: 'white', border: 'none', padding: '5px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', flex: '1' }}>
                                Bow
                            </button>
                        </div>

                        {/* Helper UI */}
                        <div style={{ marginTop: '5px', fontSize: '10px', color: '#aaa' }}>
                            {processPose ? "Tracking..." : "Manual Mode"}
                        </div>

                        {/* ... bone list ... */}
                    </div>
                </Html>
            </group>
        </group>
    );
}
