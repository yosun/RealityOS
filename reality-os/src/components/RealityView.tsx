import { Canvas } from '@react-three/fiber';
import { Html, Line, QuadraticBezierLine, OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { type ThreeEvent } from '@react-three/fiber';
import { useStore } from '../store';
import { Suspense, useRef, useState } from 'react';
import * as THREE from 'three';
import { ChatInterface } from './ChatInterface';

export function RealityView() {
    return (
        <div className="w-full h-full bg-neutral-900">
            <Canvas>
                <Suspense fallback={null}>
                    <Scene />
                </Suspense>
            </Canvas>
        </div>
    );
}

function Scene() {
    const interactionMode = useStore((state) => state.ui.interactionMode);
    const imageUrl = useStore((state) => state.program.source.image_url);
    const registers = useStore((state) => state.program.registers);
    const ops = useStore((state) => state.program.ops);
    const wires = useStore((state) => state.program.wires);
    const selectedRegId = useStore((state) => state.ui.selected_register_id);
    const layerExtrusion = useStore((state) => state.ui.layer_extrusion);
    const hoveredItemId = useStore((state) => state.ui.hovered_item_id);
    const aspectRatio = useStore((state) => state.ui.aspect_ratio);

    // Actions
    const updateOp = useStore((state) => state.updateOp);
    const setHoveredItem = useStore((state) => state.setHoveredItem);

    // Initial Layout Calculation (for Ops that haven't been moved)
    // We only use this if op.position is {0,0} (default)
    const getInitialPos = (index: number) => ({
        x: 1.2,
        y: (index - ops.length / 2) * 1.0
    });

    // Drag State
    const [draggingOpId, setDraggingOpId] = useState<string | null>(null);
    const dragPlaneRef = useRef<THREE.Mesh>(null);

    // Define chat and anchor positions
    const chatPosition = new THREE.Vector3(1.6, 0.2, 2.5);

    // Calculate highlights
    const hoveredOp = ops.find(o => o.op_id === hoveredItemId);
    const highlightedRegIds = hoveredOp
        ? wires.filter(w => w.target_id === hoveredOp.op_id).map(w => w.source_id)
        : [];

    const handlePlanePointerMove = (e: ThreeEvent<PointerEvent>) => {
        if (draggingOpId) {
            e.stopPropagation();
            // e.point is the intersection point in world space
            const newPos = e.point;
            // Update Op position in store (XY plane)
            // We want to keep Z consistent, but the drag plane handles Z.
            updateOp(draggingOpId, { position: { x: newPos.x, y: newPos.y } });
        }
    };

    const handlePlanePointerUp = (e: ThreeEvent<PointerEvent>) => {
        if (draggingOpId) {
            e.stopPropagation();
            setDraggingOpId(null);
        }
    };

    return (
        <>
            <PerspectiveCamera makeDefault position={[0, 0, 5]} fov={50} />
            <OrbitControls
                makeDefault
                enableDamping
                dampingFactor={0.1}
                enabled={interactionMode === 'source' && !draggingOpId} // Disable orbit while dragging
            />

            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} />

            {/* The Image Plane (Reality) */}
            <ImagePlane
                url={imageUrl || "https://aimagical.com/is/pixelsquid/Cartoon%20House.H03.2k.png"}
                z={layerExtrusion.base_z}
                selected={true}
                onAspect={(aspect) => useStore.getState().updateUI({ aspect_ratio: aspect })}
            />

            {/* Run Mode: Chat Integration */}
            {interactionMode === 'run' && (
                <Html position={chatPosition} center transform sprite>
                    <div className="w-[400px] h-[500px] transition-transform duration-500 ease-out hover:scale-[1.02]">
                        <div className="relative w-full h-full shadow-2xl rounded-xl overflow-hidden glass-panel">
                            <ChatInterface />
                        </div>
                    </div>
                </Html>
            )}

            {/* Registers (Base Layers) */}
            {registers.map((reg, index) => {
                const zStep = 0.01;
                const z = layerExtrusion.base_z + (index + 1) * zStep;
                const isSelected = selectedRegId === reg.reg_id;
                const isSourceMode = interactionMode === 'source';
                const isHovered = (hoveredItemId === reg.reg_id || highlightedRegIds.includes(reg.reg_id));
                const opacity = !isSourceMode ? 0.9 : (isSelected || isHovered ? 0.8 : 0.6);

                return (
                    <ImagePlane
                        key={reg.reg_id}
                        url={reg.geom.mask_url}
                        z={z}
                        opacity={opacity}
                        color={isSelected || isHovered ? '#d946ef' : '#a855f7'}
                        transparent={true}
                        selected={isSelected}
                        wireframeColor={isSelected ? '#ffd700' : '#4b5563'}
                        onClick={(e: ThreeEvent<MouseEvent>) => {
                            e.stopPropagation();
                            useStore.getState().updateUI({
                                selected_register_id: isSelected ? null : reg.reg_id,
                            });
                        }}
                        forcedAspect={aspectRatio}
                        isMask={true}
                    />
                );
            })}

            {/* Source Mode: Registers, Ops, Wires */}
            {/* Drag Plane - Invisible plane that catches mouse events for dragging */}
            {interactionMode === 'source' && (
                <mesh
                    visible={false} // Invisible but raycastable? No, visible=false disables raycast usually. 
                    // We need visible=true but transparent, opacity=0
                    position={[0, 0, 0.5]} // Match Op Z height roughly
                    onPointerMove={handlePlanePointerMove}
                    onPointerUp={handlePlanePointerUp}
                    onPointerLeave={handlePlanePointerUp} // Stop drag if leaving area
                    ref={dragPlaneRef}
                >
                    <planeGeometry args={[100, 100]} />
                    <meshBasicMaterial visible={false} />
                </mesh>
            )}

            {interactionMode === 'source' && (
                <group>
                    {/* Ops Nodes */}
                    {ops.map((op, i) => {
                        // Determine position: Use stored if set/moved, else default
                        // Check if position is "empty" (0,0) AND status is idle/new? 
                        // Actually, let's just use 0,0 if that's what it is, but if it is EXACTLY 0,0 maybe we assume uninitialized?
                        // A better way is to initialize them in store. But for now:
                        const initial = getInitialPos(i);
                        const hasMoved = op.position.x !== 0 || op.position.y !== 0;

                        // If it hasn't moved (0,0), use the calculated initial layout.
                        // Ideally we'd commit this to store, but visual fallback is fine for now.
                        const x = hasMoved ? op.position.x : initial.x;
                        const y = hasMoved ? op.position.y : initial.y;
                        const z = 0.5; // Ops float at 0.5

                        const isHovered = hoveredItemId === op.op_id || draggingOpId === op.op_id;

                        return (
                            <group key={op.op_id} position={[x, y, z]}>
                                <mesh
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        console.log('Clicked Op', op.op_id);
                                    }}
                                    onPointerDown={(e) => {
                                        e.stopPropagation();
                                        setDraggingOpId(op.op_id);
                                        // Initialize position in store if it was 0,0
                                        if (!hasMoved) {
                                            updateOp(op.op_id, { position: { x, y } });
                                        }
                                    }}
                                    onPointerOver={() => setHoveredItem(op.op_id)}
                                    onPointerOut={() => setHoveredItem(null)}
                                >
                                    <boxGeometry args={[0.4, 0.4, 0.4]} />
                                    <meshStandardMaterial
                                        color={isHovered ? "#f472b6" : "#ec4899"} // Light Pink vs Pink
                                        emissive={isHovered ? "#ec4899" : "#000000"}
                                        emissiveIntensity={0.5}
                                        roughness={0.2}
                                        metalness={0.8}
                                    />
                                    {/* Wireframe overlay for "Tech" look */}
                                    <Line
                                        points={[
                                            [-0.2, -0.2, 0.2], [0.2, -0.2, 0.2], [0.2, 0.2, 0.2], [-0.2, 0.2, 0.2], [-0.2, -0.2, 0.2], // Front face
                                            [-0.2, -0.2, -0.2], [0.2, -0.2, -0.2], [0.2, 0.2, -0.2], [-0.2, 0.2, -0.2], [-0.2, -0.2, -0.2], // Back face
                                        ]}
                                        color="#ffffff"
                                        opacity={0.3}
                                        transparent
                                        lineWidth={1}
                                    />
                                </mesh>

                                {/* Connector Lines */}
                                {wires.filter(w => w.target_id === op.op_id).map(wire => {
                                    const regIndex = registers.findIndex(r => r.reg_id === wire.source_id);
                                    if (regIndex === -1) return null;

                                    const zStep = 0.01;
                                    const regZ = layerExtrusion.base_z + (regIndex + 1) * zStep;

                                    // Start point is Register (0,0,regZ) world space.
                                    // We are in a Group at (x,y,z).
                                    // So Register relative position is (-x, -y, regZ - z).

                                    const startRel = new THREE.Vector3(-x, -y, regZ - z);
                                    const endRel = new THREE.Vector3(0, 0, 0); // Center of Op

                                    return (
                                        <QuadraticBezierLine
                                            key={wire.edge_id}
                                            start={startRel}
                                            end={endRel}
                                            mid={[startRel.x * 0.5, startRel.y * 0.5, 0.2]} // Control point
                                            color="#a855f7"
                                            lineWidth={isHovered ? 2 : 1}
                                            transparent
                                            opacity={0.6}
                                        />
                                    )
                                })}

                                <Html position={[0, -0.3, 0]} center pointerEvents="none">
                                    <div className={`text-[10px] px-2 py-1 rounded border whitespace-nowrap backdrop-blur-md transition-colors duration-200 ${isHovered
                                        ? "bg-pink-500/20 border-pink-500 text-pink-100"
                                        : "bg-black/80 border-neutral-700 text-neutral-400"
                                        }`}>
                                        {op.type}
                                    </div>
                                </Html>
                            </group>
                        );
                    })}
                </group>
            )}
        </>
    );
}

function ImagePlane({ url, z, opacity = 1, color = '#ffffff', transparent = true, selected = false, wireframeColor = '#ffd700', onClick, onAspect, forcedAspect, isMask = false }: { url: string, z: number, opacity?: number, color?: string, transparent?: boolean, selected?: boolean, wireframeColor?: string, onClick?: (e: any) => void, onAspect?: (aspect: number) => void, forcedAspect?: number, isMask?: boolean }) {
    const meshRef = useRef<THREE.Mesh>(null);

    // Quick texture load
    const [texture] = useState(() => new THREE.TextureLoader().setCrossOrigin('anonymous').load(url, (tex) => {
        if (meshRef.current) {
            const aspect = tex.image.width / tex.image.height;
            if (onAspect) onAspect(aspect);

            // If forcedAspect is provided, use it. Otherwise use texture aspect.
            // But wait, if texture aspect differs from base aspect, we might stretch the mask?
            // Yes, usually masks SHOULD match the base image aspect exactly if they are full-canvas masks.
            // If they are cropped masks, they will be positioned wrong if we just stretch them.
            // Assumption: SAM-3 returns a full-canvas mask (same dims as input).

            const finalAspect = forcedAspect || aspect;
            meshRef.current.scale.set(finalAspect, 1, 1);
            texture.needsUpdate = true;
        }
    }, undefined, (err) => {
        console.error("Texture load failed:", url, err);
    }));

    // React to forcedAspect changes if already loaded
    if (meshRef.current && forcedAspect) {
        meshRef.current.scale.set(forcedAspect, 1, 1);
    }

    return (
        <mesh position={[0, 0, z]} ref={meshRef} onClick={onClick}>
            <planeGeometry args={[1, 1]} />
            <meshBasicMaterial
                map={!isMask ? texture : undefined} // If it's a mask, we don't map it directly to color
                alphaMap={isMask ? texture : undefined} // Use it as alpha map for shape
                color={color} // Use the prop color (e.g. pink)
                transparent={transparent}
                opacity={opacity}
                side={THREE.DoubleSide}
                depthWrite={!transparent}
                alphaTest={isMask ? 0.1 : 0} // Cutout
            />
            {selected && (
                <Line
                    points={[
                        [-0.5, 0.5, 0.01], // Top-Left
                        [0.5, 0.5, 0.01],  // Top-Right
                        [0.5, -0.5, 0.01], // Bottom-Right
                        [-0.5, -0.5, 0.01], // Bottom-Left
                        [-0.5, 0.5, 0.01]  // Close loop
                    ]}
                    color={wireframeColor}
                    lineWidth={3}
                    transparent
                    opacity={0.8}
                />
            )}
        </mesh>
    );
}
