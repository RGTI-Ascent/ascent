import { quat, vec3, mat4, mat3 } from 'glm';
import { Transform } from '../core/Transform.js';
import { PlatformController } from "../controllers/PlatformController.js";

function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function lerp(a, b, t) { return a + (b - a) * t; }
function lerp3(out, a, b, t) {
    out[0] = lerp(a[0], b[0], t);
    out[1] = lerp(a[1], b[1], t);
    out[2] = lerp(a[2], b[2], t);
    return out;
}

function slerpQuat(out, a, b, t) {
    let cosHalf = a[0]*b[0] + a[1]*b[1] + a[2]*b[2] + a[3]*b[3];
    if (Math.abs(cosHalf) >= 1.0) {
        out[0]=a[0]; out[1]=a[1]; out[2]=a[2]; out[3]=a[3];
        return out;
    }
    let half = Math.acos(clamp(cosHalf, -1, 1));
    let sinHalf = Math.sqrt(1.0 - cosHalf * cosHalf);
    if (Math.abs(sinHalf) < 0.001) {
        out[0] = lerp(a[0], b[0], t);
        out[1] = lerp(a[1], b[1], t);
        out[2] = lerp(a[2], b[2], t);
        out[3] = lerp(a[3], b[3], t);
        return out;
    }
    const ratioA = Math.sin((1 - t) * half) / sinHalf;
    const ratioB = Math.sin(t * half) / sinHalf;
    out[0] = a[0]*ratioA + b[0]*ratioB;
    out[1] = a[1]*ratioA + b[1]*ratioB;
    out[2] = a[2]*ratioA + b[2]*ratioB;
    out[3] = a[3]*ratioA + b[3]*ratioB;
    return out;
}

export class PlayerController {
    constructor(entity, domElement, {
        cameraEntity = null,
        platformCtrl = null,
        towerRadius = 5,
        speed = 2,
        jumpVelocity = 11,
        gravity = 30,
        baseHeight = 0.5,
        cameraOffsetLocal = [0, 3, 10],
        cameraSmoothing = 8,
        coyoteTime = 0.12,
        jumpBuffer = 0.12,
    } = {}) {

        this.entity = entity;
        this.domElement = domElement;
        this.cameraEntity = cameraEntity;

        this.towerRadius = towerRadius;
        this.speed = speed;
        this.jumpVelocity = jumpVelocity;
        this.gravity = gravity;
        this.baseHeight = baseHeight;
        this.cameraOffsetLocal = cameraOffsetLocal;
        this.cameraSmoothing = cameraSmoothing;

        this.coyoteTimeMax = coyoteTime;
        this.jumpBufferMax = jumpBuffer;
        this.coyoteTimer = 0;
        this.jumpBufferTimer = 0;

        this.angle = 0;
        this.verticalPosition = baseHeight;
        this.verticalVelocity = 0;
        this.grounded = true;

        this.keys = {};
        this.facingRight = true;

        this.initHandlers();
        //this.platformCtrl = new PlatformController({ towerRadius });
        this.platformCtrl = platformCtrl;
    }

    initHandlers() {
        const doc = this.domElement.ownerDocument;
        doc.addEventListener('keydown', e => {
            this.keys[e.code] = true;
            if (e.code === 'Space') this.jumpBufferTimer = this.jumpBufferMax;
        });
        doc.addEventListener('keyup', e => {
            this.keys[e.code] = false;
        });
    }

    update(t, dt) {
        if (dt <= 0) return;

        // input
        if (this.keys['KeyA']) this.angle += this.speed * dt;
        if (this.keys['KeyD']) this.angle -= this.speed * dt;
        const twopi = Math.PI * 2;
        this.angle = ((this.angle % twopi) + twopi) % twopi;

        // jump timers
        this.jumpBufferTimer = Math.max(0, this.jumpBufferTimer - dt);
        this.coyoteTimer = Math.max(0, this.coyoteTimer - dt);
        if (this.grounded) this.coyoteTimer = this.coyoteTimeMax;

        // jump
        if (this.jumpBufferTimer > 0 && (this.grounded || this.coyoteTimer > 0)) {
            this.verticalVelocity = this.jumpVelocity;
            this.grounded = false;
            this.coyoteTimer = 0;
            this.jumpBufferTimer = 0;
        }

        // gravity
        if (this.verticalVelocity < 0) {
            this.verticalVelocity -= this.gravity * 1.35 * dt;
        } else {
            this.verticalVelocity -= this.gravity * dt;
        }

        // early jump release
        if (!this.keys['Space'] && this.verticalVelocity > 0) {
            this.verticalVelocity *= 0.55;
        }

        // apply vertical motion
        this.verticalPosition += this.verticalVelocity * dt;

        if (this.platformCtrl) this.platformCtrl.resolveCollision(this);

        //this.grounded = false;

        // compute world position
        const x = Math.cos(this.angle) * this.towerRadius;
        const z = Math.sin(this.angle) * this.towerRadius;
        const y = this.verticalPosition;

        const transform = this.entity.getComponentOfType(Transform);
        if (!transform) return;

        transform.translation = [x, y, z];

        // face outward from tower
        const dirToPlayer = vec3.normalize([], [x, 0, z]);
        const lookAtPoint = [x + dirToPlayer[0] * 10, y, z + dirToPlayer[2] * 10];

        const lookAtMat = mat4.create();
        mat4.lookAt(lookAtMat, [x, y, z], lookAtPoint, [0, 1, 0]);

        const modelMat = mat4.create();
        mat4.invert(modelMat, lookAtMat);

        const rotMat = mat3.create();
        mat3.fromMat4(rotMat, modelMat);

        const rotation = quat.create();
        quat.fromMat3(rotation, rotMat);
        transform.rotation = rotation;

        // jump stretch
        if (this.keys['Space']) transform.scale = [0.8, 1.2, 0.8];
        else transform.scale = [1, 1, 1];

        // facing direction
        if (this.keys['KeyA']) this.facingRight = false;
        if (this.keys['KeyD']) this.facingRight = true;

        if (!this.facingRight) transform.scale[0] = Math.abs(transform.scale[0]);
        else transform.scale[0] = -Math.abs(transform.scale[0]);

        // lepse sledenje kamere 
        if (this.cameraEntity) {
            const cameraTransform = this.cameraEntity.getComponentOfType(Transform);
            if (cameraTransform) {
                const camDistance = this.towerRadius + this.cameraOffsetLocal[2];
                const camHeight = this.baseHeight + this.cameraOffsetLocal[1];

                const targetCam = [
                    Math.cos(this.angle) * camDistance,
                    camHeight,
                    Math.sin(this.angle) * camDistance
                ];

                const position = vec3.fromValues(targetCam[0], targetCam[1], targetCam[2]);
                const target = vec3.fromValues(x, y, z);

                const forward = vec3.normalize([], vec3.subtract([], target, position));

                let up = vec3.fromValues(0, 1, 0);
                if (Math.abs(vec3.dot(forward, up)) > 0.98) up = vec3.fromValues(1, 0, 0);

                const world = mat4.create();
                mat4.targetTo(world, position, target, up);

                const m3 = mat3.create();
                mat3.fromMat4(m3, world);

                const camRot = quat.create();
                quat.fromMat3(camRot, m3);

                if (this.cameraSmoothing > 0) {
                    const tSmooth = clamp(dt * this.cameraSmoothing, 0, 1);

                    const outPos = [0, 0, 0];
                    lerp3(outPos, cameraTransform.translation, targetCam, tSmooth);
                    cameraTransform.translation = outPos;

                    let targetQ = camRot.slice();
                    if (cameraTransform.rotation[0]*targetQ[0] +
                        cameraTransform.rotation[1]*targetQ[1] +
                        cameraTransform.rotation[2]*targetQ[2] +
                        cameraTransform.rotation[3]*targetQ[3] < 0) {
                        targetQ = [-targetQ[0], -targetQ[1], -targetQ[2], -targetQ[3]];
                    }

                    const outQ = [0,0,0,0];
                    slerpQuat(outQ, cameraTransform.rotation, targetQ, tSmooth);
                    cameraTransform.rotation = outQ;
                } else {
                    cameraTransform.translation = targetCam;
                    cameraTransform.rotation = camRot;
                }
            }
        }
    }
}
