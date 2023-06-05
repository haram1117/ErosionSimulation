"use strict";
exports.__esModule = true;
// @ts-ignore
var three_1 = require("three");
var OrbitControls_1 = require("three/examples/jsm/controls/OrbitControls");
var gl_matrix_1 = require("gl-matrix");
// @ts-ignore
var three_2 = require("three");
var Camera = /** @class */ (function () {
    function Camera(position, target) {
        this.worldUp = gl_matrix_1.vec3.fromValues(0, 1, 0);
        this.projectionMatrix = gl_matrix_1.mat4.create();
        this.viewMatrix = gl_matrix_1.mat4.create();
        this.fovy = 45;
        this.aspectRatio = 1;
        this.near = 0.01;
        this.far = 500;
        this.position = gl_matrix_1.vec3.create();
        this.direction = gl_matrix_1.vec3.create();
        this.target = gl_matrix_1.vec3.create();
        this.up = gl_matrix_1.vec3.fromValues(0.0, 1.0, 0.0);
        this.counter = 0;
        this.tposition = new three_2.Vector3(0, 0, 0);
        this.tdirection = new three_2.Vector3(0, 0, 0);
        this.tup = new three_2.Vector3(0, 0, 0);
        gl_matrix_1.vec3.subtract(this.direction, target, position);
        this.tposition = new three_2.Vector3(position[0], position[1], position[2]);
        this.tdirection = new three_2.Vector3(this.direction[0], this.direction[1], this.direction[2]);
        this.tup = new three_2.Vector3(this.up[0], this.up[1], this.up[2]);
        this.threeCamera = new three_1.PerspectiveCamera(this.fovy, this.aspectRatio, this.near, this.far);
        this.threeCamera.position.set(position[0], position[1], position[2]);
        this.threeControls = new OrbitControls_1.OrbitControls(this.threeCamera, document.getElementById('canvas'));
        // this.threeControls.enableZoom = true;
        // this.threeControls.rotateSpeed = 0.3;
        // this.threeControls.zoomSpeed = 1.0;
        // this.threeControls.panSpeed = 2.0;
        // this.threeControls.target.set(target);
        this.threeControls.enableDamping = true;
        this.threeControls.dampingFactor = 0.08;
        console.log(this.threeCamera.position);
        this.threeControls.update();
        gl_matrix_1.vec3.add(this.target, this.position, this.direction);
        var wd = new three_2.Vector3();
        this.threeCamera.getWorldDirection(wd);
        this.direction = gl_matrix_1.vec3.fromValues(wd.x, wd.y, wd.z);
        this.position = gl_matrix_1.vec3.fromValues(this.threeCamera.position.x, this.threeCamera.position.y, this.threeCamera.position.z);
        gl_matrix_1.vec3.add(this.target, this.position, this.direction);
        var lookatVec = gl_matrix_1.vec3.fromValues(0, 0, 0);
        gl_matrix_1.vec3.subtract(lookatVec, this.position, this.target);
        var tmpRight = gl_matrix_1.vec3.fromValues(0, 0, 0);
        var camUp = gl_matrix_1.vec3.fromValues(0, 0, 0);
        gl_matrix_1.vec3.cross(tmpRight, this.worldUp, lookatVec);
        gl_matrix_1.vec3.cross(camUp, tmpRight, lookatVec);
        gl_matrix_1.vec3.normalize(camUp, camUp);
        gl_matrix_1.vec3.scale(camUp, camUp, -1);
        this.up = camUp;
        gl_matrix_1.mat4.lookAt(this.viewMatrix, this.position, this.target, gl_matrix_1.vec3.fromValues(0, 1, 0));
    }
    Camera.prototype.setAspectRatio = function (aspectRatio) {
        this.aspectRatio = aspectRatio;
    };
    Camera.prototype.updateProjectionMatrix = function () {
        gl_matrix_1.mat4.perspective(this.projectionMatrix, this.fovy, this.aspectRatio, this.near, this.far);
    };
    Camera.prototype.update = function () {
        this.threeControls.update();
        this.threeCamera.updateMatrixWorld();
        var wd = new three_2.Vector3();
        this.threeCamera.getWorldDirection(wd);
        this.direction = gl_matrix_1.vec3.fromValues(wd.x, wd.y, wd.z);
        this.position = gl_matrix_1.vec3.fromValues(this.threeCamera.position.x, this.threeCamera.position.y, this.threeCamera.position.z);
        gl_matrix_1.vec3.add(this.target, this.position, this.direction);
        var lookatVec = gl_matrix_1.vec3.fromValues(0, 0, 0);
        gl_matrix_1.vec3.subtract(lookatVec, this.position, this.target);
        var tmpRight = gl_matrix_1.vec3.fromValues(0, 0, 0);
        var camUp = gl_matrix_1.vec3.fromValues(0, 0, 0);
        gl_matrix_1.vec3.cross(tmpRight, this.worldUp, lookatVec);
        gl_matrix_1.vec3.cross(camUp, tmpRight, lookatVec);
        gl_matrix_1.vec3.normalize(camUp, camUp);
        gl_matrix_1.vec3.scale(camUp, camUp, -1);
        this.up = camUp;
        this.counter++;
        gl_matrix_1.mat4.lookAt(this.viewMatrix, this.position, this.target, gl_matrix_1.vec3.fromValues(0, 1, 0));
    };
    return Camera;
}());
;
exports["default"] = Camera;
