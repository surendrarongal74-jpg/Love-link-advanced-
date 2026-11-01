/**
 * WorldPhysicsValidator.ts
 *
 * Authoritative geometric collision engine and floor/wall validator for the 3D game.
 * Used both client-side for continuous sliding physics and server-side/network sync
 * to guarantee that player avatars cannot clip through static geometry, walls, or floors.
 */

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface CylinderObstacle {
  id: string;
  x: number;
  z: number;
  radius: number;
  minY?: number;
  maxY?: number;
}

export interface BoxObstacle {
  id: string;
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  minY?: number;
  maxY?: number;
}

export interface FloorSurface {
  id: string;
  type: 'circle' | 'box';
  x: number;
  z: number;
  radius?: number;
  width?: number;
  depth?: number;
  elevation: number;
  requiresBridge?: boolean;
}

export class WorldPhysicsValidator {
  public static readonly PLAYER_RADIUS = 0.45;
  public static readonly PLAYER_HEIGHT = 1.7;
  public static readonly MAX_TICK_DISPLACEMENT = 1.2; // Max step to prevent tunneling

  // Static world obstacle geometry
  public static readonly CYLINDER_OBSTACLES: CylinderObstacle[] = [
    // Entrance Archway Columns
    { id: 'arch_left', x: -1.8, z: 4.5, radius: 0.45, minY: 0.4, maxY: 4.0 },
    { id: 'arch_right', x: 1.8, z: 4.5, radius: 0.45, minY: 0.4, maxY: 4.0 },

    // Bonsai Cherry Trees on Main Island
    { id: 'tree_left', x: -4.5, z: -2.5, radius: 0.65, minY: 0.4, maxY: 4.0 },
    { id: 'tree_right', x: 4.5, z: -2.5, radius: 0.65, minY: 0.4, maxY: 4.0 },

    // Ancient Sanctuary 4 Columns
    { id: 'sanc_pillar_1', x: -3.0, z: -28.5, radius: 0.5, minY: 0.8, maxY: 5.5 },
    { id: 'sanc_pillar_2', x: 3.0, z: -28.5, radius: 0.5, minY: 0.8, maxY: 5.5 },
    { id: 'sanc_pillar_3', x: -3.0, z: -23.5, radius: 0.5, minY: 0.8, maxY: 5.5 },
    { id: 'sanc_pillar_4', x: 3.0, z: -23.5, radius: 0.5, minY: 0.8, maxY: 5.5 },

    // Master Portal Pedestal (Solid Base)
    { id: 'portal_base', x: 0, z: -26.0, radius: 1.1, minY: 0.8, maxY: 4.5 },
  ];

  public static readonly BOX_OBSTACLES: BoxObstacle[] = [
    // Archway crossbeam
    { id: 'arch_beam', minX: -2.1, maxX: 2.1, minZ: 4.2, maxZ: 4.8, minY: 3.0, maxY: 3.8 },
  ];

  // Static walkable floor surfaces
  public static readonly FLOOR_SURFACES: FloorSurface[] = [
    // 1. Center Spawn Island
    { id: 'center_island', type: 'circle', x: 0, z: 0, radius: 7.45, elevation: 0.4 },

    // 2. West Island (Pressure Switch A)
    { id: 'west_island', type: 'circle', x: -17.5, z: -2.0, radius: 4.25, elevation: 0.4 },

    // 3. East Island (Pressure Switch B)
    { id: 'east_island', type: 'circle', x: 17.5, z: -2.0, radius: 4.25, elevation: 0.4 },

    // 4. Stepping Stones (Left Archipelago)
    { id: 'step_left_1', type: 'circle', x: -9.5, z: 0.5, radius: 1.45, elevation: 0.2 },
    { id: 'step_left_2', type: 'circle', x: -12.5, z: -1.0, radius: 1.55, elevation: 0.35 },

    // 5. Stepping Stones (Right Archipelago)
    { id: 'step_right_1', type: 'circle', x: 9.5, z: 0.5, radius: 1.45, elevation: 0.2 },
    { id: 'step_right_2', type: 'circle', x: 12.5, z: -1.0, radius: 1.55, elevation: 0.35 },

    // 6. Materialized Energy Bridge (Conditional)
    {
      id: 'energy_bridge',
      type: 'box',
      x: 0,
      z: -14.0,
      width: 3.8, // |x| <= 1.9
      depth: 14.4, // z between -6.8 and -21.2
      elevation: 0.4,
      requiresBridge: true,
    },

    // 7. Celestial Sanctuary Island
    { id: 'sanctuary_island', type: 'circle', x: 0, z: -26.0, radius: 6.05, elevation: 0.8 },
  ];

  /**
   * Calculates the exact authoritative floor elevation under position (x, z).
   * Returns null if standing over open sky void.
   */
  public static getSurfaceElevation(x: number, z: number, isBridgeSolid = false): number | null {
    // 1. Center Spawn Island
    const distCenter = Math.hypot(x, z);
    if (distCenter <= 7.45) {
      return 0.4;
    }

    // 2. West Island
    const distWest = Math.hypot(x - -17.5, z - -2.0);
    if (distWest <= 4.25) {
      return 0.4;
    }

    // 3. East Island
    const distEast = Math.hypot(x - 17.5, z - -2.0);
    if (distEast <= 4.25) {
      return 0.4;
    }

    // 4. Left Stepping Stones
    if (Math.hypot(x - -9.5, z - 0.5) <= 1.45) return 0.2;
    if (Math.hypot(x - -12.5, z - -1.0) <= 1.55) return 0.35;

    // 5. Right Stepping Stones
    if (Math.hypot(x - 9.5, z - 0.5) <= 1.45) return 0.2;
    if (Math.hypot(x - 12.5, z - -1.0) <= 1.55) return 0.35;

    // 6. Materialized Energy Bridge
    if (isBridgeSolid && Math.abs(x) <= 1.9 && z <= -6.8 && z >= -21.2) {
      return 0.4;
    }

    // 7. Celestial Sanctuary Island
    const distSanc = Math.hypot(x - 0, z - -26.0);
    if (distSanc <= 6.05) {
      return 0.8;
    }

    return null;
  }

  /**
   * Resolves collision against static world geometry (columns, trees, obstacles).
   * Uses continuous sliding normals so the character glides effortlessly along walls
   * rather than getting stuck or jittering.
   */
  public static resolveStaticCollisions(
    targetPos: Vec3,
    prevPos: Vec3,
    playerRadius = WorldPhysicsValidator.PLAYER_RADIUS
  ): Vec3 {
    const resolved: Vec3 = { x: targetPos.x, y: targetPos.y, z: targetPos.z };

    // Prevent excessive displacement across a single tick (anti-tunneling)
    const stepDx = resolved.x - prevPos.x;
    const stepDz = resolved.z - prevPos.z;
    const stepDist = Math.hypot(stepDx, stepDz);
    if (stepDist > this.MAX_TICK_DISPLACEMENT) {
      const scale = this.MAX_TICK_DISPLACEMENT / stepDist;
      resolved.x = prevPos.x + stepDx * scale;
      resolved.z = prevPos.z + stepDz * scale;
    }

    // Double-pass resolution for snug corners
    for (let pass = 0; pass < 2; pass++) {
      // 1. Cylinder Colliders (Columns, Trees, Pedestals)
      for (const cyl of this.CYLINDER_OBSTACLES) {
        // Height check if specified
        if (cyl.minY !== undefined && resolved.y + this.PLAYER_HEIGHT < cyl.minY) continue;
        if (cyl.maxY !== undefined && resolved.y > cyl.maxY) continue;

        const dx = resolved.x - cyl.x;
        const dz = resolved.z - cyl.z;
        const minDist = cyl.radius + playerRadius;
        const distSq = dx * dx + dz * dz;

        if (distSq < minDist * minDist) {
          const dist = Math.sqrt(distSq);
          if (dist > 0.0001) {
            const penetration = minDist - dist;
            // Push out along radial normal vector
            resolved.x += (dx / dist) * penetration;
            resolved.z += (dz / dist) * penetration;
          } else {
            // Dead-center penetration fallback
            resolved.x += minDist;
          }
        }
      }

      // 2. Box Colliders (Crossbeams, rectangular boundaries)
      for (const box of this.BOX_OBSTACLES) {
        if (box.minY !== undefined && resolved.y + this.PLAYER_HEIGHT < box.minY) continue;
        if (box.maxY !== undefined && resolved.y > box.maxY) continue;

        const closestX = Math.max(box.minX, Math.min(resolved.x, box.maxX));
        const closestZ = Math.max(box.minZ, Math.min(resolved.z, box.maxZ));

        const diffX = resolved.x - closestX;
        const diffZ = resolved.z - closestZ;
        const distSq = diffX * diffX + diffZ * diffZ;

        if (distSq < playerRadius * playerRadius) {
          const dist = Math.sqrt(distSq);
          if (dist > 0.0001) {
            const push = playerRadius - dist;
            resolved.x += (diffX / dist) * push;
            resolved.z += (diffZ / dist) * push;
          } else {
            // Inside box: push toward nearest face
            const dMinX = Math.abs(resolved.x - box.minX);
            const dMaxX = Math.abs(resolved.x - box.maxX);
            const dMinZ = Math.abs(resolved.z - box.minZ);
            const dMaxZ = Math.abs(resolved.z - box.maxZ);
            const minD = Math.min(dMinX, dMaxX, dMinZ, dMaxZ);

            if (minD === dMinX) resolved.x = box.minX - playerRadius;
            else if (minD === dMaxX) resolved.x = box.maxX + playerRadius;
            else if (minD === dMinZ) resolved.z = box.minZ - playerRadius;
            else resolved.z = box.maxZ + playerRadius;
          }
        }
      }
    }

    // World envelope clamping (prevents flying out into infinite space)
    resolved.x = Math.max(-28.0, Math.min(28.0, resolved.x));
    resolved.z = Math.max(-36.0, Math.min(12.0, resolved.z));
    resolved.y = Math.max(-10.0, Math.min(20.0, resolved.y));

    return resolved;
  }

  /**
   * Full authoritative validation function.
   * Ensures the position does not clip into static walls, accounts for floor elevation,
   * validates bridge presence, and guarantees grounded integrity.
   */
  public static validateAndResolvePosition(
    targetPos: Vec3,
    prevPos: Vec3,
    isGrounded: boolean,
    isBridgeSolid = false
  ): {
    position: Vec3;
    isGrounded: boolean;
    surfaceElevation: number | null;
    wasCorrected: boolean;
  } {
    // 1. Resolve horizontal wall / obstacle collisions
    const resolvedHoriz = this.resolveStaticCollisions(targetPos, prevPos);

    // 2. Validate ground elevation
    const surfaceElevation = this.getSurfaceElevation(resolvedHoriz.x, resolvedHoriz.z, isBridgeSolid);

    let finalY = resolvedHoriz.y;
    let finalGrounded = isGrounded;

    if (surfaceElevation !== null) {
      if (isGrounded) {
        // Enforce solid floor contact: prevent feet sinking into floor
        if (finalY < surfaceElevation) {
          finalY = surfaceElevation;
        }
      } else {
        // Landing collision
        if (finalY <= surfaceElevation + 0.08) {
          finalY = surfaceElevation;
          finalGrounded = true;
        }
      }
    } else {
      // Over open sky void: cannot be grounded
      finalGrounded = false;
    }

    const wasCorrected =
      Math.abs(resolvedHoriz.x - targetPos.x) > 0.01 ||
      Math.abs(resolvedHoriz.z - targetPos.z) > 0.01 ||
      Math.abs(finalY - targetPos.y) > 0.01 ||
      finalGrounded !== isGrounded;

    return {
      position: {
        x: Number(resolvedHoriz.x.toFixed(3)),
        y: Number(finalY.toFixed(3)),
        z: Number(resolvedHoriz.z.toFixed(3)),
      },
      isGrounded: finalGrounded,
      surfaceElevation,
      wasCorrected,
    };
  }
}
