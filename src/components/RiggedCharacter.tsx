import React, { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, useAnimations } from '@react-three/drei';
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

    // Check if we should process pose from webcam
    // Always process if result is available
    const processPose = !!poseResult;

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
    });


    return (
        <group ref={group} {...props} dispose={null}>
            <group scale={0.01} rotation={[0, Math.PI, 0]}>
                <primitive object={clonedScene} />
            </group>
        </group>
    );
}
