import * as THREE from 'three';

export interface BoxCollider {
  type: 'box';
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  minY?: number;
  maxY?: number;
}

export interface CylinderCollider {
  type: 'cylinder';
  x: number;
  z: number;
  radius: number;
}

export interface PerimeterBoundary {
  type: 'circle' | 'polygon';
  centerX?: number;
  centerZ?: number;
  radius?: number;
  points?: { x: number; z: number }[];
}

export type Collider = BoxCollider | CylinderCollider;

export class CollisionSystem {
  private colliders: Collider[] = [];
  private perimeter: PerimeterBoundary | null = null;
  private playerRadius = 0.45;

  constructor(playerRadius = 0.45) {
    this.playerRadius = playerRadius;
  }

  public clear(): void {
    this.colliders = [];
    this.perimeter = null;
  }

  public addBox(minX: number, maxX: number, minZ: number, maxZ: number, minY = -10, maxY = 50): void {
    this.colliders.push({
      type: 'box',
      minX: Math.min(minX, maxX),
      maxX: Math.max(minX, maxX),
      minZ: Math.min(minZ, maxZ),
      maxZ: Math.max(minZ, maxZ),
      minY,
      maxY,
    });
  }

  public addCylinder(x: number, z: number, radius: number): void {
    this.colliders.push({
      type: 'cylinder',
      x,
      z,
      radius,
    });
  }

  public setCircularPerimeter(centerX: number, centerZ: number, radius: number): void {
    this.perimeter = {
      type: 'circle',
      centerX,
      centerZ,
      radius,
    };
  }

  public setPolygonPerimeter(points: { x: number; z: number }[]): void {
    this.perimeter = {
      type: 'polygon',
      points,
    };
  }

  /**
   * Resolves collision against all registered obstacles using sliding response.
   * Prevents walking through walls or solid objects while allowing smooth movement along surfaces.
   */
  public resolve(
    currentPos: THREE.Vector3,
    targetPos: THREE.Vector3,
    customRadius?: number
  ): THREE.Vector3 {
    const r = customRadius ?? this.playerRadius;
    const resolved = targetPos.clone();

    // 1. Check perimeter boundary first
    if (this.perimeter) {
      if (this.perimeter.type === 'circle' && this.perimeter.centerX !== undefined && this.perimeter.centerZ !== undefined && this.perimeter.radius !== undefined) {
        const dx = resolved.x - this.perimeter.centerX;
        const dz = resolved.z - this.perimeter.centerZ;
        const dist = Math.sqrt(dx * dx + dz * dz);
        const maxDist = this.perimeter.radius - r;
        if (dist > maxDist && dist > 0.001) {
          const ratio = maxDist / dist;
          resolved.x = this.perimeter.centerX + dx * ratio;
          resolved.z = this.perimeter.centerZ + dz * ratio;
        }
      }
    }

    // 2. Resolve axis-aligned boxes and cylinders with sliding response
    // Run two passes for corner cases
    for (let pass = 0; pass < 2; pass++) {
      for (const col of this.colliders) {
        if (col.type === 'box') {
          // Check if resolved point (with radius) overlaps the box
          const closestX = Math.max(col.minX, Math.min(resolved.x, col.maxX));
          const closestZ = Math.max(col.minZ, Math.min(resolved.z, col.maxZ));

          const diffX = resolved.x - closestX;
          const diffZ = resolved.z - closestZ;
          const distSq = diffX * diffX + diffZ * diffZ;

          if (distSq < r * r) {
            // Collision detected! Slide out along the shallowest penetration or normal
            const dist = Math.sqrt(distSq);
            if (dist > 0.0001) {
              const push = r - dist;
              resolved.x += (diffX / dist) * push;
              resolved.z += (diffZ / dist) * push;
            } else {
              // Position was completely inside box: push toward nearest outer face
              const dMinX = Math.abs(resolved.x - col.minX);
              const dMaxX = Math.abs(resolved.x - col.maxX);
              const dMinZ = Math.abs(resolved.z - col.minZ);
              const dMaxZ = Math.abs(resolved.z - col.maxZ);
              const minD = Math.min(dMinX, dMaxX, dMinZ, dMaxZ);

              if (minD === dMinX) resolved.x = col.minX - r;
              else if (minD === dMaxX) resolved.x = col.maxX + r;
              else if (minD === dMinZ) resolved.z = col.minZ - r;
              else resolved.z = col.maxZ + r;
            }
          }
        } else if (col.type === 'cylinder') {
          // Circle vs circle collision
          const dx = resolved.x - col.x;
          const dz = resolved.z - col.z;
          const minDist = col.radius + r;
          const distSq = dx * dx + dz * dz;

          if (distSq < minDist * minDist) {
            const dist = Math.sqrt(distSq);
            if (dist > 0.0001) {
              const push = minDist - dist;
              resolved.x += (dx / dist) * push;
              resolved.z += (dz / dist) * push;
            } else {
              resolved.x += minDist;
            }
          }
        }
      }
    }

    return resolved;
  }
}
