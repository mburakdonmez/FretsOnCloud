let scene;
let camera;
let renderer;
let planeTexture;
let cyl;
let mainObj;

let scoreBoard;
let text;

let light;
let sc_light = [];

let mapTexture;

let controls;
let stats;

const colors = {
    0: 0x00FF00,
    1: 0xFF0000,
    2: 0xFFFF00,
    3: 0x0000FF,
    4: 0xFF5500
}

let hitBoxes = {};
const createNoteObj = (slot) => {
    let cylinderGeometry = new THREE.CylinderBufferGeometry(0.3, 0.3, 0.75, 15);
    let cylinderMateriai = new THREE.MeshPhongMaterial({
        color: colors[slot],
        shininess: 100,
        specular: 0xffffff
    });
    cyl = new THREE.Mesh(cylinderGeometry, cylinderMateriai);
    cyl.rotation.z = Math.PI / 2;
    cyl.position.set(slot - 2, -0.1, -14);
    return cyl;
}

const createCylinder = (cylinder_args, materail_args) => {
    let cylinderGeometry = new THREE.CylinderBufferGeometry(...cylinder_args);
    let cylinderMateriai = new THREE.MeshLambertMaterial(materail_args);
    return new THREE.Mesh(cylinderGeometry, cylinderMateriai);
}

const createLine = (pos_x) => {
    let line = createCylinder([0.05, 0.05, 30, 5], { color: 0xffffff })
    line.rotation.x = Math.PI / 2;
    line.position.set(pos_x, 0.025, 0);
    return line;
}

const createHitBox = (pos_x, hitBoxKey) => {   //hitBoxKey: hb1, hb2, hb3...
    let down = createCylinder([0.05, 0.05, 0.85], { color: colors[pos_x + 2] });
    let up = createCylinder([0.05, 0.05, 0.85], { color: colors[pos_x + 2] });
    let left = createCylinder([0.05, 0.05, 0.4], { color: colors[pos_x + 2] });
    let right = createCylinder([0.05, 0.05, 0.4], { color: colors[pos_x + 2] });

    let geometry = new THREE.BoxGeometry(0.825, 0.1, 0.375);
    let material = new THREE.MeshPhongMaterial({ color: 0xfef5ff });
    let center = new THREE.Mesh(geometry, material);
    center.position.set(0, 0, -0.2);
    center.rotation.z = Math.PI / 2;
    center.visible = false;
    down.add(center);
    hitBoxes[hitBoxKey] = center;

    down.rotation.z = Math.PI / 2;
    left.rotation.x = Math.PI / 2;
    right.rotation.x = Math.PI / 2;

    down.position.set(pos_x, 0.025, 14);

    down.add(up);
    up.position.z = -0.4;

    down.add(left);
    left.position.set(0, -0.85 / 2, -0.2);


    down.add(right);
    right.position.set(0, 0.85 / 2, -0.2);

    return down;

}

const writePoints = (text_here) => {
    $(text).text(text_here);
}

const initScene = (cb = () => { }) => {
    text = document.getElementById('notesdiv');

    stats = new Stats();
    document.body.appendChild(stats.dom);

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    sc_position = [0, 6, -6.5];
    if (screen.width > 512) { //to fit the scene
        camera.position.z = 5;
    } else if (screen.width >= 400) {
        sc_position = [0, 8, -6.5];
        camera.position.z = 7;
        camera.position.y = 2;
    } else if (screen.width >= 350) {
        sc_position = [0, 8, -6.5];
        camera.position.z = 7.5;
        camera.position.y = 2.5;
    } else {
        alert("Coution! This device is too narrow to play this game, please play on a wider screen");
        sc_position = [0, 8, -6.5];
        camera.position.z = 7.5;
        camera.position.y = 2.5;
    }


    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setClearColor(0xe5e5e5)
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    planeTexture = new THREE.TextureLoader().load('/textures/texture1.png', (t) => {
        t.wrapS = t.wrapT = THREE.RepeatWrapping;
        t.offset.set(0, 0);
        t.repeat.set(1, 2);
    });
    let geometry = new THREE.BoxGeometry(5, 0.1, 30);
    let material = new THREE.MeshLambertMaterial({ color: 0xFFCC00, map: planeTexture });
    mainObj = new THREE.Mesh(geometry, material);
    mainObj.position.set(0, 5, -12);
    mainObj.rotation.x = 0.5;
    scene.add(mainObj);

    mainObj.add(createLine(-1.5));
    mainObj.add(createLine(-0.5));
    mainObj.add(createLine(0.5));
    mainObj.add(createLine(1.5));

    mainObj.add(createHitBox(-2, 'hb1'));
    mainObj.add(createHitBox(-1, 'hb2'));
    mainObj.add(createHitBox(0, 'hb3'));
    mainObj.add(createHitBox(1, 'hb4'));
    mainObj.add(createHitBox(2, 'hb5'));

    //main light source
    light = new THREE.PointLight(0xFFFFFF, 3, 500, 2);
    light.position.set(0, 10, 0);
    mainObj.add(light);

    light = new THREE.AmbientLight(0x202020); // soft white light
    scene.add(light);

    let gltfloader = new THREE.GLTFLoader();
    gltfloader.load('objects/discoball/out.glb', (gltf) => {
        scoreBoard = gltf.scene;
        scoreBoard.position.set(...sc_position);
        scene.add(scoreBoard);

        let temp_light = new THREE.PointLight(0x000000, 3, 3, 1);
        temp_light.position.set(0.5, 0, 1.5);
        scoreBoard.add(temp_light);
        sc_light.push(temp_light);

        temp_light = new THREE.PointLight(0x000000, 3, 3, 1);
        temp_light.position.set(-0.5, 0, 1.5);
        scoreBoard.add(temp_light);
        sc_light.push(temp_light);

        temp_light = new THREE.PointLight(0x000000, 3, 3, 1);
        temp_light.position.set(0, -1.5, 1.5);
        scoreBoard.add(temp_light);
        sc_light.push(temp_light);


        cb();
    })

    window.onresize = function () {
        renderer.setSize(window.innerWidth, window.innerHeight);
        camera.aspect = window.innerWidth / window.innerHeight;

        camera.updateProjectionMatrix();
    }


}

const animate = function () {
    if (!gameEnded)
        requestAnimationFrame(animate);
    gameRender(new Date());
    stats.update();
    renderer.render(scene, camera);
};