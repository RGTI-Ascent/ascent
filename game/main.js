import { ResizeSystem } from 'engine/systems/ResizeSystem.js';
import { UpdateSystem } from 'engine/systems/UpdateSystem.js';
import { UnlitRenderer } from 'engine/renderers/UnlitRenderer.js';
import { PlayerController } from 'engine/controllers/PlayerController.js';
import { PlatformController } from 'engine/controllers/PlatformController.js';

import {
    Camera,
    Entity,
    Material,
    Model,
    Primitive,
    Sampler,
    Texture,
    Transform,
    Parent,
    Mesh,
    Vertex,
} from 'engine/core/core.js';

import { loadResources } from 'engine/loaders/resources.js';

const resources = await loadResources({
    'floorMesh': new URL('../../../models/floor/floor.json', import.meta.url),
    'cubeMesh': new URL('../../../models/cube/cube.json', import.meta.url),
    'image': new URL('../../../models/floor/rock.png', import.meta.url),
    'stonebrick': new URL('../../../models/cube/stonebrick.png', import.meta.url),
    'playerSprite': new URL('../../mario.png', import.meta.url),
});

const canvas = document.querySelector('canvas');
const renderer = new UnlitRenderer(canvas);
await renderer.initialize();

const camera = new Entity();
camera.addComponent(new Transform({
    translation: [0, 0, 10],
    rotation: [0, 0, 0, 1],
}));
camera.addComponent(new Camera());
//camera.addComponent(new CylindricalCamera(camera, canvas));

const floor = new Entity();
floor.addComponent(new Transform({
    scale: [10, 1, 10],
}));
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
    translation: [0, 5, 0],
    scale: [2, 10, 2],
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

function createSquareMesh() {
    const vertices = [
        new Vertex({ position: [-0.5, -0.5, 0], texcoords: [0, 1], normal: [0, 0, 1] }),
        new Vertex({ position: [ 0.5, -0.5, 0], texcoords: [1, 1], normal: [0, 0, 1] }),
        new Vertex({ position: [ 0.5,  0.5, 0], texcoords: [1, 0], normal: [0, 0, 1] }),
        new Vertex({ position: [-0.5,  0.5, 0], texcoords: [0, 0], normal: [0, 0, 1] }),
    ];
    const indices = [0, 1, 2, 0, 2, 3];
    return new Mesh({ vertices, indices });
}

const playerSquare = new Entity();
playerSquare.addComponent(new Transform({
    translation: [0, 0, -5],
}));
playerSquare.addComponent(new Model({
    primitives: [
        new Primitive({
            mesh: createSquareMesh(),
            material: new Material({
                baseTexture: new Texture({
                    image: resources.playerSprite,
                    sampler: new Sampler({
                        minFilter: 'nearest',
                        magFilter: 'nearest',
                        addressModeU: 'clamp-to-edge',
                        addressModeV: 'clamp-to-edge',
                    }),
                }),
                baseFactor: [1, 1, 1, 1],
            }),
        }),
    ],
}));

const platformCtrl = new PlatformController({ baseHeight: 0.5 });
const playerController = new PlayerController(playerSquare, canvas, 
    { cameraEntity: camera, platformCtrl: platformCtrl });
playerSquare.addComponent(playerController);

// test platforma
const rightQuarterStart = 0;           // 0 radians
const rightQuarterEnd = Math.PI / 2;  // 90 degrees

platformCtrl.add({
    angleStart: rightQuarterStart,
    angleEnd: rightQuarterEnd,
    height: 2
});
// ---------------

const scene = [floor, tower, camera, playerSquare];

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