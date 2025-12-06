import { Transform } from '../core/Transform.js';

export class EnemyController {
    constructor(entity, {
        speed = 1,
        towerRadius = 5,
        amplitude = 0.3,
        collisionRadius = 0.5,
    } = {}) {
        this.entity = entity;
        this.towerRadius = towerRadius;
        this.speed = speed;
        this.amplitude = amplitude;
        this.player = null;
        this.collisionRadius = collisionRadius;
        
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

        transform.translation[0] = x;
        transform.translation[2] = z;

        const yaw = angle + Math.PI;

        // convert yaw to quaternion (rotation around Y axis)
        const half = yaw * 0.5;
        transform.rotation[1] = - Math.sin(half);
        transform.rotation[3] = Math.cos(half);

    }
}
