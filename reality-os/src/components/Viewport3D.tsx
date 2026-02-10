import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { useStore } from '../store';
import { useRef, useState, Suspense } from 'react';
import * as THREE from 'three';

export function Viewport3D() {
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
    const imageUrl = useStore((state) => state.program.source.image_url);
    const registers = useStore((state) => state.program.registers);
    const selectedRegId = useStore((state) => state.ui.selected_register_id);
    const layerExtrusion = useStore((state) => state.ui.layer_extrusion);

    // Note: in a real app, use useLoader(TextureLoader, url) for suspense support

    return (
        <>
            <PerspectiveCamera makeDefault position={[0, -2, 5]} fov={50} />
            <OrbitControls makeDefault enableDamping dampingFactor={0.1} />

            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} />

            {/* Base Image Plane */}
            {imageUrl && <ImagePlane url={imageUrl} z={0} opacity={1} transparent={true} />}

            {/* Register Layers */}
            {registers.map((reg, index) => {
                const z = layerExtrusion.base_z + index * layerExtrusion.z_step;
                const isSelected = selectedRegId === reg.reg_id;

                return (
                    <ImagePlane
                        key={reg.reg_id}
                        url={reg.geom.mask_url}
                        z={z}
                        opacity={isSelected ? 0.9 : 0.3}
                        color={isSelected ? '#00ffff' : '#ffffff'}
                        transparent={true}
                    />
                );
            })}
        </>
    );
}

function ImagePlane({ url, z, opacity = 1, color = '#ffffff', transparent = true }: { url: string, z: number, opacity?: number, color?: string, transparent?: boolean }) {
    // Use Drei's useTexture or simplier plain texture loading?
    // Let's use a simple mesh with texture

    // We need to know aspect ratio to set plane geom.
    // For now assuming 1x1 or standard. 
    // Ideally we scale based on loaded texture.

    const meshRef = useRef<THREE.Mesh>(null);

    // Quick texture load (not suspense safe really without useLoader, but ok for now)
    const [texture] = useState(() => new THREE.TextureLoader().load(url, (tex) => {
        if (meshRef.current) {
            const aspect = tex.image.width / tex.image.height;
            meshRef.current.scale.set(aspect, 1, 1);
            texture.needsUpdate = true;
        }
    }));

    return (
        <mesh position={[0, 0, z]} ref={meshRef}>
            <planeGeometry args={[1, 1]} />
            <meshBasicMaterial
                map={texture}
                transparent={transparent}
                opacity={opacity}
                color={color}
                side={THREE.DoubleSide}
                depthWrite={!transparent} // avoid z-fighting or sorting issues with transparency
            />
        </mesh>
    );
}
