// PlatformController.js
// Simple cylindrical platform collision for tower-style platformers.
// Supports: top landings, bottom head bumps, and side collisions.

export class PlatformController {
    constructor({
        towerRadius = 5,
        angleTolerance = 0.05,
        verticalTolerance = 0.1,
        groundHeight = 0.2,
    } = {}) {
        this.towerRadius = towerRadius;
        this.angleTolerance = angleTolerance;
        this.verticalTolerance = verticalTolerance;
        this.groundHeight = groundHeight;
        this.platforms = [];
    }

    // doda platformo od angleStart do angleEnd z visino,0.4debelino itd
    add({ angleStart, angleEnd, height, thickness = 1, radius = null, deadly }) {
        this.platforms.push({
            angleStart,
            angleEnd,
            height,
            thickness,
            radius: radius ?? this.towerRadius,
            deadly: deadly,
        });
    }

    // Angle wrap helper
    angleInRange(a, start, end) {
        const twopi = Math.PI * 2;
        a = ((a % twopi) + twopi) % twopi;
        start = ((start % twopi) + twopi) % twopi;
        end = ((end % twopi) + twopi) % twopi;

        if (start <= end) return a >= start && a <= end;
        return a >= start || a <= end;
    }

    resolveCollision(player) {
        let landed = null;
        let landedY = -Infinity;

        const radius = this.towerRadius;
        const x = Math.cos(player.angle) * radius;
        const z = Math.sin(player.angle) * radius;

        if (player.verticalPosition <= this.groundHeight) {
            player.verticalPosition = this.groundHeight;
            player.verticalVelocity = 0;
            player.grounded = true;
        }

        for (const p of this.platforms) {

            if (Math.abs(p.radius - radius) > 0.15) continue;

            const insideAngle = this.angleInRange(
                player.angle,
                p.angleStart,
                p.angleEnd
            );

            const top = p.height;
            const bottom = p.height - p.thickness;

            // collision od zgoraj
            if (insideAngle && player.verticalVelocity <= 0) {
                if (player.verticalPosition <= top + this.verticalTolerance &&
                    player.verticalPosition >= top - 1.0) {
                    if(p.deadly) player.alive = false;
                    if (top > landedY) {
                        landed = p;
                        landedY = top;
                    }
                }
            }

            // collision od spodaj
            if (insideAngle && player.verticalVelocity > 0) {
                if (player.verticalPosition >= bottom - this.verticalTolerance &&
                    player.verticalPosition <= bottom + this.verticalTolerance) {
                    if(p.deadly) player.alive = false;
                    player.verticalVelocity = 0;
                    player.verticalPosition = bottom - 0.02;
                }
            }
            
            // SIDE COLLISION = NE DELA (nepotreben)
            /*
            if (!insideAngle &&
                player.verticalPosition >= bottom &&
                player.verticalPosition <= top) {

                const distStart = Math.abs(player.angle - p.angleStart);
                const distEnd   = Math.abs(player.angle - p.angleEnd);

                player.angle = (distStart < distEnd)
                    ? p.angleStart
                    : p.angleEnd;
            }*/
        }

        // landing
        if (landed) {
            player.verticalPosition = landedY;
            player.verticalVelocity = 0;
            player.grounded = true;
        }
    }
}
