"use strict";
exports.__esModule = true;
var gl_matrix_1 = require("gl-matrix");
var globals_1 = require("../../globals");
// In this file, `gl` is accessible because it is imported above
var OpenGLRenderer = /** @class */ (function () {
    function OpenGLRenderer(canvas) {
        this.canvas = canvas;
        this.counter = 0;
    }
    OpenGLRenderer.prototype.setClearColor = function (r, g, b, a) {
        globals_1.gl.clearColor(r, g, b, a);
    };
    OpenGLRenderer.prototype.setSize = function (width, height) {
        this.canvas.width = width;
        this.canvas.height = height;
    };
    OpenGLRenderer.prototype.clear = function () {
        globals_1.gl.clear(globals_1.gl.COLOR_BUFFER_BIT | globals_1.gl.DEPTH_BUFFER_BIT);
    };
    OpenGLRenderer.prototype.render = function (camera, prog, drawables) {
        var model = gl_matrix_1.mat4.create();
        var viewProj = gl_matrix_1.mat4.create();
        var color = gl_matrix_1.vec4.fromValues(1, 0, 0, 1);
        gl_matrix_1.mat4.identity(model);
        gl_matrix_1.mat4.multiply(viewProj, camera.projectionMatrix, camera.viewMatrix);
        prog.setModelMatrix(model);
        prog.setViewProjMatrix(viewProj);
        prog.setEyeRefUp(camera.position, camera.target, camera.up);
        prog.setDimensions(this.canvas.width, this.canvas.height);
        for (var _i = 0, drawables_1 = drawables; _i < drawables_1.length; _i++) {
            var drawable = drawables_1[_i];
            prog.draw(drawable);
        }
    };
    return OpenGLRenderer;
}());
;
exports["default"] = OpenGLRenderer;
