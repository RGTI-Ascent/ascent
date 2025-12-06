import { Transform } from '../core/Transform.js';
import { Parent } from '../core/Parent.js';
import { PlayerController } from './PlayerController.js';
import { vec3, mat4 } from 'glm';

export class EnemyController {
    constructor(entity, scene, {
        speed = 1,
        towerRadius = 5,
        amplitude = 0.3,
        collisionRadius = 0.5,
        player = null,
    } = {}) {
        this.entity = entity;
        this.scene = scene;
        this.towerRadius = towerRadius;
        this.speed = speed;
        this.amplitude = amplitude;
        this.player = null;
        this.collisionRadius = collisionRadius;
        this.player = player;
        
        this.alive = true;
        this.baseTranslation = [...entity.getComponentOfType(Transform).translation];
    }

    update(t, dt) {
        const transform = this.entity.getComponentOfType(Transform);
        if (!transform) return;

        const bx = this.baseTranslation[0];
        const bz = this.baseTranslation[2];

        const baseRadius = Math.hypot(bx, bz);
        const baseAngle = Math.atan2(bz, bx);


        const offset = Math.sin(t * this.speed) * this.amplitude;
        const angle = baseAngle + offset;

        // world position
        const x = Math.cos(angle) * baseRadius;
        const z = Math.sin(angle) * baseRadius;
        const y = this.baseTranslation[1] + Math.sin(t * this.speed * 10) * 0.2;

        transform.translation[0] = x;
        transform.translation[1] = y;
        transform.translation[2] = z;

        const yaw = angle + Math.PI;

        // convert yaw to quaternion (rotation around Y axis)
        const half = yaw * 0.5;
        transform.rotation[1] = - Math.sin(half);
        transform.rotation[3] = Math.cos(half);


        // colision
        const parent = this.entity.getComponentOfType(Parent);
        const parentMatrix = parent.entity.getComponentOfType(Transform).matrix;
        
        const localMatrix = this.entity.getComponentOfType(Transform).matrix;

        const worldMatrix = mat4.multiply(mat4.create(), parentMatrix, localMatrix);

        //position now in world position
        const enemyPos = [
            worldMatrix[12],
            worldMatrix[13],
            worldMatrix[14],
        ];

        const playerPos = this.player.getComponentOfType(Transform).translation;

        // calculate how near player pos and wolrd pos and collision
        const ENEMY_RADIUS = 0.4;   // TODO tweak mybe
        const PLAYER_RADIUS = 0.5;  // tweak

        const dx = playerPos[0] - enemyPos[0];
        const dy = playerPos[1] - enemyPos[1];
        const dz = playerPos[2] - enemyPos[2];

        const distSq = dx*dx + dy*dy + dz*dz;
        const radius = ENEMY_RADIUS + PLAYER_RADIUS;

        const playerController = this.player.getComponentOfType(PlayerController);
        if (distSq < radius * radius) {
            const verticalDiff = playerPos[1] - enemyPos[1];
        
            if (verticalDiff > 0.3) {
                // stomp
                const index = this.scene.indexOf(this.entity);
                if (index !== -1) this.scene.splice(index, 1);
                playerController.verticalVelocity = 5; // bounce?
                playerController.
                return; 
            } else {
                // hit player
                playerController.alive = false;
            }
        }

    }

    
}
