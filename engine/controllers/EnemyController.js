export class EnemyController {
    constructor(entity, {
        speed = 1,
        // add other config here
    } = {}) {

        this.entity = entity;
        this.speed = speed;

        this.alive = true;
    }

    update(t, dt) {
        //if (!this.entity) return;

        //const transform = this.entity.transform;

        // Example movement:
        //transform.translation[0] += this.speed * dt;

        // Add logic here...
        console.log("update called");
    }
}