import { ResizeSystem } from 'engine/systems/ResizeSystem.js';
import { UpdateSystem } from 'engine/systems/UpdateSystem.js';
import { UnlitRenderer } from 'engine/renderers/UnlitRenderer.js';
import { FirstPersonController } from 'engine/controllers/FirstPersonController.js';


import {
    Camera,
    Entity,
    Material,
    Model,
    Primitive,
    Sampler,
    Texture,
    Transform,
} from 'engine/core/core.js';

import { loadResources } from 'engine/loaders/resources.js';

const resources = await loadResources({
    'floorMesh': new URL('../../../models/floor/floor.json', import.meta.url),
    'cubeMesh': new URL('../../../models/cube/cube.json', import.meta.url),
    'image': new URL('../../../models/floor/rock.png', import.meta.url),
    'stonebrick': new URL('../../../models/cube/stonebrick.png', import.meta.url),
});

const canvas = document.querySelector('canvas');
const renderer = new UnlitRenderer(canvas);
await renderer.initialize();


const camera = new Entity();
camera.addComponent(new Transform({
    translation: [-1, 10, 10],
    rotation: [-0.1,-0.01,0,1],
}));
camera.addComponent(new Camera());
// uncomment for controlls
// camera.addComponent(new FirstPersonController(camera, canvas));

const floor = new Entity();
floor.addComponent(new Transform({
    scale: [10, 1, 10],
}));

console.log(camera);
floor.addComponent(new Model({
    primitives: [
        new Primitive({
            mesh: resources.floorMesh,
            material: new Material({
                baseTexture: new Texture({
                    image: resources.image,
                    sampler: new Sampler({
                        minFilter: 'nearest',
                        magFilter: 'nearest',
                        addressModeU: 'repeat',
                        addressModeV: 'repeat',
                    }),
                }),
            }),
        }),
    ],
}));

const tower = new Entity();
tower.addComponent(new Transform({
    translation: [0, 4, -10],
    scale: [2, 2, 2],
}));
tower.addComponent(new Model({
    primitives: [
        new Primitive({
            mesh: resources.cubeMesh,
            material: new Material({
                baseTexture: new Texture({
                    image: resources.stonebrick,
                    sampler: new Sampler({
                        minFilter: 'nearest',
                        magFilter: 'nearest',
                        addressModeU: 'repeat',
                        addressModeV: 'repeat',
                    }),
                }),
            }),
        }),
    ],
}));

const scene = [floor, tower, camera];

function update(t, dt) {
    for (const entity of scene) {
        for (const component of entity.components) {
            component.update?.(t, dt);
        }
    }
}

function render() {
    renderer.render(scene, camera);
}

function resize({ displaySize: { width, height }}) {
    camera.getComponentOfType(Camera).aspect = width / height;
}

new ResizeSystem({ canvas, resize }).start();
new UpdateSystem({ update, render }).start();