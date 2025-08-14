import { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Text, Box, Sphere, Cylinder } from '@react-three/drei';
import { Vector3, Color } from 'three';
import * as THREE from 'three';

interface CityItem {
  id: string;
  item_name: string;
  item_type: string;
  rarity: string;
  position_x: number;
  position_y: number;
  position_z: number;
  is_placed: boolean;
}

interface NPC {
  id: string;
  npc_name: string;
  npc_type: string;
  position_x: number;
  position_y: number;
  position_z: number;
  behavior_script: any;
}

interface CityCanvasProps {
  cityItems: CityItem[];
  npcs: NPC[];
  season: 'spring' | 'summer' | 'autumn' | 'winter';
  onItemClick?: (item: CityItem) => void;
  onNPCClick?: (npc: NPC) => void;
}

// Animated NPC component
function AnimatedNPC({ npc, onClick }: { npc: NPC; onClick?: (npc: NPC) => void }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (meshRef.current) {
      // Gentle floating animation
      meshRef.current.position.y = npc.position_y + Math.sin(state.clock.elapsedTime * 2) * 0.1;
      
      // Gentle rotation
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.2;
    }
  });

  const npcColor = npc.npc_type === 'quest_giver' ? '#ff6b9d' : 
                   npc.npc_type === 'musician' ? '#4ecdc4' : 
                   npc.npc_type === 'gardener' ? '#45b7d1' : '#96ceb4';

  return (
    <group position={[npc.position_x, npc.position_y, npc.position_z]}>
      <Sphere
        ref={meshRef}
        args={[0.3, 16, 16]}
        onClick={() => onClick?.(npc)}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <meshStandardMaterial 
          color={npcColor} 
          emissive={hovered ? npcColor : '#000000'}
          emissiveIntensity={hovered ? 0.2 : 0}
        />
      </Sphere>
      
      {/* NPC name label */}
      <Text
        position={[0, 0.8, 0]}
        fontSize={0.2}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
      >
        {npc.npc_name}
      </Text>
    </group>
  );
}

// 3D City Item component
function CityItem3D({ item, onClick }: { item: CityItem; onClick?: (item: CityItem) => void }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (meshRef.current && item.rarity === 'legendary') {
      // Legendary items have a gentle glow animation
      const material = meshRef.current.material as THREE.MeshStandardMaterial;
      material.emissiveIntensity = 0.1 + Math.sin(state.clock.elapsedTime * 2) * 0.05;
    }
  });

  const getItemGeometry = () => {
    switch (item.item_type) {
      case 'building':
        return <Box args={[0.8, 1.2, 0.8]} />;
      case 'tree':
        return (
          <group>
            <Cylinder args={[0.1, 0.1, 0.6]} position={[0, 0.3, 0]}>
              <meshStandardMaterial color="#8B4513" />
            </Cylinder>
            <Sphere args={[0.4, 8, 8]} position={[0, 0.8, 0]}>
              <meshStandardMaterial color="#228B22" />
            </Sphere>
          </group>
        );
      case 'decoration':
        return <Sphere args={[0.3, 12, 12]} />;
      default:
        return <Box args={[0.5, 0.5, 0.5]} />;
    }
  };

  const getRarityColor = () => {
    switch (item.rarity) {
      case 'legendary':
        return '#ff6b9d';
      case 'rare':
        return '#ffd93d';
      case 'common':
      default:
        return '#4ecdc4';
    }
  };

  return (
    <group 
      position={[item.position_x, item.position_y, item.position_z]}
      onClick={() => onClick?.(item)}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <mesh ref={meshRef}>
        {getItemGeometry()}
        <meshStandardMaterial 
          color={getRarityColor()}
          emissive={item.rarity === 'legendary' ? getRarityColor() : '#000000'}
          emissiveIntensity={item.rarity === 'legendary' ? 0.1 : 0}
          transparent
          opacity={hovered ? 0.8 : 1}
        />
      </mesh>
      
      {hovered && (
        <Text
          position={[0, 1, 0]}
          fontSize={0.15}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
        >
          {item.item_name}
        </Text>
      )}
    </group>
  );
}

// Seasonal effects component
function SeasonalEffects({ season }: { season: string }) {
  const particlesRef = useRef<THREE.Points>(null);

  useFrame((state) => {
    if (particlesRef.current) {
      particlesRef.current.rotation.y = state.clock.elapsedTime * 0.1;
    }
  });

  const getSeasonalParticles = () => {
    const particleCount = 100;
    const positions = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 1] = Math.random() * 10;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 20;
    }

    const particleColor = season === 'winter' ? '#ffffff' :
                         season === 'autumn' ? '#ff8c42' :
                         season === 'spring' ? '#ff6b9d' :
                         '#4ecdc4';

    return (
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={particleCount}
            array={positions}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial size={0.05} color={particleColor} transparent opacity={0.6} />
      </points>
    );
  };

  return season !== 'summer' ? getSeasonalParticles() : null;
}

// Ground plane component
function Ground({ season }: { season: string }) {
  const groundColor = season === 'winter' ? '#e8f4f8' :
                     season === 'autumn' ? '#d4a574' :
                     season === 'spring' ? '#90ee90' :
                     '#7cb342';

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]}>
      <planeGeometry args={[50, 50]} />
      <meshStandardMaterial color={groundColor} />
    </mesh>
  );
}

// Sky component
function Sky({ season }: { season: string }) {
  const skyColor = season === 'winter' ? '#b8d4f0' :
                  season === 'autumn' ? '#ffa726' :
                  season === 'spring' ? '#e1bee7' :
                  '#87ceeb';

  return (
    <mesh>
      <sphereGeometry args={[100, 32, 32]} />
      <meshBasicMaterial color={skyColor} side={THREE.BackSide} />
    </mesh>
  );
}

export default function CityCanvas({ cityItems, npcs, season, onItemClick, onNPCClick }: CityCanvasProps) {
  return (
    <div className="w-full h-96 rounded-lg overflow-hidden border-2 border-primary/20">
      <Canvas camera={{ position: [10, 8, 10], fov: 60 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 10, 5]} intensity={0.8} />
        <pointLight position={[0, 10, 0]} intensity={0.4} />
        
        <Sky season={season} />
        <Ground season={season} />
        <SeasonalEffects season={season} />
        
        {cityItems.filter(item => item.is_placed).map((item) => (
          <CityItem3D key={item.id} item={item} onClick={onItemClick} />
        ))}
        
        {npcs.map((npc) => (
          <AnimatedNPC key={npc.id} npc={npc} onClick={onNPCClick} />
        ))}
        
        <OrbitControls 
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          maxPolarAngle={Math.PI / 2}
          minDistance={5}
          maxDistance={20}
        />
      </Canvas>
    </div>
  );
}