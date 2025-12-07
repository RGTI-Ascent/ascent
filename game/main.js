import { ResizeSystem } from 'engine/systems/ResizeSystem.js';
import { UpdateSystem } from 'engine/systems/UpdateSystem.js';
import { UnlitRenderer } from 'engine/renderers/UnlitRenderer.js';
import { PlayerController } from 'engine/controllers/PlayerController.js';
import { PlatformController } from 'engine/controllers/PlatformController.js';
import { EnemyController } from '../engine/controllers/EnemyController.js';

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
    'stonebrick': new URL('../../../textures/Stone_wall_1.png', import.meta.url),
    'wood': new URL('../../../textures/wood.png', import.meta.url),
    'squid': new URL('../../../textures/squid.png', import.meta.url),
    'crabSprite': new URL('../../../textures/crab_sprite_front.png', import.meta.url),
    'tEnemy': new URL('../../../textures/tutorial_enemy.png', import.meta.url),
    'towerBase': new URL('../../models/Base/Base.obj', import.meta.url),
    'platform3': new URL('../../models/Platforms/platform3mod.obj', import.meta.url),
    'water': new URL('../../../textures/water.jpg', import.meta.url),
    'sky': new URL('../../../sky.png', import.meta.url),
    'spikes': new URL('../../../models/Platforms/spikes.obj', import.meta.url),
    'blood': new URL('../../../blood.jpg', import.meta.url),
    'zombie': new URL('../../../models/cube/big-zombie-face.png', import.meta.url),
});

const scene = []

const canvas = document.getElementById("game");
const renderer = new UnlitRenderer(canvas);
await renderer.initialize();

const camera = new Entity();
camera.addComponent(new Transform({
    translation: [0, 0, 10],
    rotation: [0, 0, 0, 1],
}));
camera.addComponent(new Camera());
scene.push(camera);

const floor = new Entity();
floor.addComponent(new Transform({
    scale: [800, 1, 800],
    translation: [0, -0.7, 0],
}));
floor.addComponent(new Model({
    primitives: [
        new Primitive({
            mesh: resources.floorMesh,
            material: new Material({
                baseTexture: new Texture({
                    image: resources.water,
                    sampler: new Sampler({
                        minFilter: 'nearest',
                        magFilter: 'nearest',
                        addressModeU: 'repeat',
                        addressModeV: 'repeat',
                    }),
                }),
                uvScale: [100, 100],
            }),
        }),
    ],
})); scene.push(floor);

const tower = new Entity();
tower.addComponent(new Transform({
    translation: [0, -6.8, 0],
    scale: [0.0024, 0.0044, 0.0024], // origvalues: 0.0022, 0.0022, 0.0022
}));
tower.addComponent(new Model({
    primitives: [
        new Primitive({
            mesh: resources.towerBase,
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
                baseFactor: [1, 1, 1, 1],
                uvScale: [90, 140], // origvalues: 70, 70
            }),
        }),
    ],
}));
scene.push(tower);

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
                    image: resources.crabSprite,
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
const playerController = new PlayerController(playerSquare, canvas, {   
        cameraEntity: camera, 
        platformCtrl: platformCtrl, 
        hudElement: document.getElementById("hud"),
        deathTextElement: document.getElementById("hud2"),
    }); if (hud2) hud2.style.display = "none";
playerSquare.addComponent(playerController);

// platforme ---------------------------------
function quatFromY(angle) {
    angle += 1.785
    return [0, Math.sin(angle / 2), 0, Math.cos(angle / 2)];
}
//doda platformo na dolocenem kotu in visini
function addPlatform(angle, height, deadly = false, enemy = false, isFinal = false) { 
    const platform = new Entity();

    if (!deadly) {
        platform.addComponent(new Transform({
            rotation: quatFromY(angle),
            translation: [0, -5.45+height, 0],
            scale: [0.22, 0.22, 0.22],
        }));
        platform.addComponent(new Model({
            primitives: [
                new Primitive({
                    mesh: resources.platform3,
                    material: new Material({
                        baseTexture: new Texture({
                            image: resources.wood,
                            sampler: new Sampler({
                                minFilter: 'linear',
                                magFilter: 'linear',
                                addressModeU: 'repeat',
                                addressModeV: 'repeat',
                            }),
                        }),
                        uvScale: [0.05, 0.05]
                    }),
                }),
            ],
        }));

        const rightQuarterStart = -Math.PI/7 - angle;           // 0 radians
        const rightQuarterEnd =  Math.PI/7 - angle;  // 90 degrees

        const p = {
            angleStart: rightQuarterStart,
            angleEnd: rightQuarterEnd,
            height: height,
            deadly: deadly,
        };
        if (isFinal) {
            p.isFinal = true;
        }

        platformCtrl.add(p);
    } else {
        platform.addComponent(new Transform({
            rotation: quatFromY(angle),
            translation: [0, -5.45+height, 0],
            scale: [0.22, 0.22, 0.22],
        }));
        platform.addComponent(new Model({
            primitives: [
                new Primitive({
                    mesh: resources.spikes,
                    material: new Material({
                        baseTexture: new Texture({
                            image: resources.blood,
                            sampler: new Sampler({
                                minFilter: 'nearest',
                                magFilter: 'nearest',
                                addressModeU: 'repeat',
                                addressModeV: 'repeat',
                            }),
                        }),
                        uvScale: [100, 80],
                    }),
                }),
            ],
        }));

        const rightQuarterStart = -Math.PI/18 - angle;           
        const rightQuarterEnd =  Math.PI/18 - angle;  

        const p = {
            angleStart: rightQuarterStart,
            angleEnd: rightQuarterEnd,
            height: height,
            deadly: deadly,
        };
        platformCtrl.add(p);
    } 
    
    if (enemy) {
        addEnemyToPlatform(platform);
    }

    scene.push(platform);
}


const platforms = [
    { angle: Math.PI/4, height: 2, enemy: true },
    { angle: Math.PI/2, height: 4 },
    { angle: Math.PI/2 + 0.05, height: 4, deadly: true },
    { angle: Math.PI, height: 4, enemy: true },
    { angle: Math.PI, height: 4, enemy: true },
    { angle: 3*Math.PI/2, height: 6, enemy: true },
    { angle: Math.PI, height: 8 },
    { angle: Math.PI, height: 10,  },
    { angle: Math.PI - 0.05, height: 10, deadly: true },
    { angle: Math.PI/2, height: 12 },
    { angle: 0, height: 14, enemy: true },
    { angle: 3*Math.PI/2, height: 16 },
    { angle: Math.PI, height: 18},
    { angle: Math.PI, height: 18, deadly: true},
    { angle: Math.PI, height: 20 },
    { angle: Math.PI, height: 22, isFinal: true },
];

// Add platforms
for (const p of platforms) {
    addPlatform(p.angle, p.height, p.deadly, p.enemy, p.isFinal);
}


function addEnemyToPlatform(platformEntity) {
    const enemy = new Entity();

    enemy.addComponent(new Transform({
        translation: [-4, 24.5, 21.5],
        scale: [1, 1.5, 1],
    }));

    enemy.addComponent(new Model({
        primitives: [
            new Primitive({
                mesh: resources.cubeMesh,
                material: new Material({
                    baseTexture: new Texture({
                        image: resources.squid,
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

    enemy.addComponent(
        new EnemyController(
            enemy, scene, { 
                speed: 1.2, 
                player: playerSquare 
            }));

    enemy.addComponent(new Parent(platformEntity));

    scene.push(enemy);
}

// ------------------------------------------

scene.push(playerSquare);

const hud = document.getElementById("hud");

function update(t, dt) {
    //hud.textContent = `Height: ${Math.floor(playerSquare.getComponentOfType(PlayerController).cameraOffsetLocal[1]-2)}`;
    hud.textContent = `Time: ${Math.floor(t)}`;

    for (const entity of scene) {
        for (const component of entity.components) {
            component.update?.(t, dt);
        }
    }

    //lava animation
    //floor.getComponentOfType(Transform).translation[1] += 0.3*dt;
    const floorMat = floor.getComponentOfType(Model).primitives[0].material;
    floorMat.uvScale[1] += dt * 0.01; // move upward at 0.1 units per second    
}

function render() {
    renderer.render(scene, camera);
}

function resize({ displaySize: { width, height }}) {
    camera.getComponentOfType(Camera).aspect = width / height;
}

new ResizeSystem({ canvas, resize }).start();
new UpdateSystem({ update, render }).start();