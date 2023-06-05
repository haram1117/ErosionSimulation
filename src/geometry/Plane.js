"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
exports.__esModule = true;
var gl_matrix_1 = require("gl-matrix");
var Drawable_1 = require("../rendering/gl/Drawable");
var globals_1 = require("../globals");
var Plane = /** @class */ (function (_super) {
    __extends(Plane, _super);
    function Plane(center, scale, subdivs) {
        var _this = _super.call(this) || this;
        _this.center = gl_matrix_1.vec3.fromValues(center[0], center[1], center[2]);
        _this.scale = scale;
        _this.subdivs = subdivs + subdivs % 2; // Ensures the number is even, rounds up.
        return _this;
    }
    Plane.prototype.create = function () {
        var width = Math.pow(2, this.subdivs / 2);
        var normalize = 1.0 / width;
        this.positions = new Float32Array((width + 1) * (width + 1) * 4);
        this.normals = new Float32Array((width + 1) * (width + 1) * 4);
        this.uvs = new Float32Array((width + 1) * (width + 1) * 2);
        this.indices = new Uint32Array(width * width * 6); // NxN squares, each square is two triangles, each triangle is three indices
        var posIdx = 0;
        for (var x = 0; x <= width; ++x) {
            for (var z = 0; z <= width; ++z) {
                // Make a strip of vertices along Z with the current X coord
                this.normals[posIdx] = 0;
                this.positions[posIdx++] = x * normalize * this.scale[0] + this.center[0] - this.scale[0] * 0.5;
                this.normals[posIdx] = 1;
                this.positions[posIdx++] = 0 + this.center[1];
                this.normals[posIdx] = 0;
                this.positions[posIdx++] = z * normalize * this.scale[1] + this.center[2] - this.scale[1] * 0.5;
                this.normals[posIdx] = 0;
                this.positions[posIdx++] = 1;
            }
        }
        var uvIdx = 0;
        for (var x = 0; x <= width; ++x) {
            for (var z = 0; z <= width; ++z) {
                // Make a strip of vertices along Z with the current X coord
                this.uvs[uvIdx++] = x * normalize;
                this.uvs[uvIdx++] = z * normalize;
            }
        }
        var indexIdx = 0;
        // Make the squares out of indices
        for (var i = 0; i < width; ++i) { // X iter
            for (var j = 0; j < width; ++j) { // Z iter
                this.indices[indexIdx++] = j + i * (width + 1);
                this.indices[indexIdx++] = j + 1 + i * (width + 1);
                this.indices[indexIdx++] = j + (i + 1) * (width + 1);
                this.indices[indexIdx++] = j + 1 + i * (width + 1);
                this.indices[indexIdx++] = j + (i + 1) * (width + 1);
                this.indices[indexIdx++] = j + 1 + (i + 1) * (width + 1);
            }
        }
        this.generateUv();
        this.generateIdx();
        this.generatePos();
        this.generateNor();
        this.count = this.indices.length;
        globals_1.gl.bindBuffer(globals_1.gl.ELEMENT_ARRAY_BUFFER, this.bufIdx);
        globals_1.gl.bufferData(globals_1.gl.ELEMENT_ARRAY_BUFFER, this.indices, globals_1.gl.STATIC_DRAW);
        globals_1.gl.bindBuffer(globals_1.gl.ARRAY_BUFFER, this.bufNor);
        globals_1.gl.bufferData(globals_1.gl.ARRAY_BUFFER, this.normals, globals_1.gl.STATIC_DRAW);
        globals_1.gl.bindBuffer(globals_1.gl.ARRAY_BUFFER, this.bufPos);
        globals_1.gl.bufferData(globals_1.gl.ARRAY_BUFFER, this.positions, globals_1.gl.STATIC_DRAW);
        globals_1.gl.bindBuffer(globals_1.gl.ARRAY_BUFFER, this.bufUv);
        globals_1.gl.bufferData(globals_1.gl.ARRAY_BUFFER, this.uvs, globals_1.gl.STATIC_DRAW);
        console.log("Created plane");
    };
    return Plane;
}(Drawable_1["default"]));
;
exports["default"] = Plane;
