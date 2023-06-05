"use strict";
exports.__esModule = true;
exports.Shader = void 0;
var gl_matrix_1 = require("gl-matrix");
var globals_1 = require("../../globals");
var activeProgram = null;
var Shader = /** @class */ (function () {
    function Shader(type, source) {
        this.shader = globals_1.gl.createShader(type);
        globals_1.gl.shaderSource(this.shader, source);
        globals_1.gl.compileShader(this.shader);
        if (!globals_1.gl.getShaderParameter(this.shader, globals_1.gl.COMPILE_STATUS)) {
            throw globals_1.gl.getShaderInfoLog(this.shader);
        }
    }
    return Shader;
}());
exports.Shader = Shader;
;
var ShaderProgram = /** @class */ (function () {
    function ShaderProgram(shaders) {
        this.prog = globals_1.gl.createProgram();
        for (var _i = 0, shaders_1 = shaders; _i < shaders_1.length; _i++) {
            var shader = shaders_1[_i];
            globals_1.gl.attachShader(this.prog, shader.shader);
        }
        globals_1.gl.linkProgram(this.prog);
        if (!globals_1.gl.getProgramParameter(this.prog, globals_1.gl.LINK_STATUS)) {
            throw globals_1.gl.getProgramInfoLog(this.prog);
        }
        this.attrPos = globals_1.gl.getAttribLocation(this.prog, "vs_Pos");
        this.attrNor = globals_1.gl.getAttribLocation(this.prog, "vs_Nor");
        this.attrCol = globals_1.gl.getAttribLocation(this.prog, "vs_Col");
        this.attrUv = globals_1.gl.getAttribLocation(this.prog, "vs_Uv");
        this.unifModel = globals_1.gl.getUniformLocation(this.prog, "u_Model");
        this.unifModelInvTr = globals_1.gl.getUniformLocation(this.prog, "u_ModelInvTr");
        this.unifViewProj = globals_1.gl.getUniformLocation(this.prog, "u_ViewProj");
        this.unifPlanePos = globals_1.gl.getUniformLocation(this.prog, "u_PlanePos");
        this.unifSpanwPos = globals_1.gl.getUniformLocation(this.prog, "u_SpawnPos");
        this.unifMouseWorldPos = globals_1.gl.getUniformLocation(this.prog, "u_MouseWorldPos");
        this.unifMouseWorldDir = globals_1.gl.getUniformLocation(this.prog, "u_MouseWorldDir");
        this.unifSimRes = globals_1.gl.getUniformLocation(this.prog, "u_SimRes");
        this.unifPipeLen = globals_1.gl.getUniformLocation(this.prog, "u_PipeLen");
        this.unifKs = globals_1.gl.getUniformLocation(this.prog, "u_Ks");
        this.unifKc = globals_1.gl.getUniformLocation(this.prog, "u_Kc");
        this.unifKd = globals_1.gl.getUniformLocation(this.prog, "u_Kd");
        this.unifTimestep = globals_1.gl.getUniformLocation(this.prog, "u_timestep");
        this.unifPipeArea = globals_1.gl.getUniformLocation(this.prog, "u_PipeArea");
        this.unifEye = globals_1.gl.getUniformLocation(this.prog, "u_Eye");
        this.unifRef = globals_1.gl.getUniformLocation(this.prog, "u_Ref");
        this.unifUp = globals_1.gl.getUniformLocation(this.prog, "u_Up");
        this.unifDimensions = globals_1.gl.getUniformLocation(this.prog, "u_Dimensions");
        this.unifTime = globals_1.gl.getUniformLocation(this.prog, "u_Time");
        this.unifWaterTransparency = globals_1.gl.getUniformLocation(this.prog, "u_WaterTransparency");
        this.unifRndTerrain = globals_1.gl.getUniformLocation(this.prog, "u_RndTerrain");
        this.unifTerrainType = globals_1.gl.getUniformLocation(this.prog, "u_TerrainType");
        this.unifTerrainDebug = globals_1.gl.getUniformLocation(this.prog, "u_TerrainDebug");
        this.unifTerrainScale = globals_1.gl.getUniformLocation(this.prog, "u_TerrainScale");
        this.unifTerrainHeight = globals_1.gl.getUniformLocation(this.prog, "u_TerrainHeight");
        this.unifBrushSize = globals_1.gl.getUniformLocation(this.prog, "u_BrushSize");
        this.unifBrushType = globals_1.gl.getUniformLocation(this.prog, "u_BrushType");
        this.unifBrushStrength = globals_1.gl.getUniformLocation(this.prog, "u_BrushStrength");
        this.unifBrushOperation = globals_1.gl.getUniformLocation(this.prog, "u_BrushOperation");
        this.unifBrushPressed = globals_1.gl.getUniformLocation(this.prog, "u_BrushPressed");
        this.unifBrusPos = globals_1.gl.getUniformLocation(this.prog, "u_BrushPos");
    }
    ShaderProgram.prototype.use = function () {
        if (activeProgram !== this.prog) {
            globals_1.gl.useProgram(this.prog);
            activeProgram = this.prog;
        }
    };
    ShaderProgram.prototype.setModelMatrix = function (model) {
        this.use();
        if (this.unifModel !== -1) {
            globals_1.gl.uniformMatrix4fv(this.unifModel, false, model);
        }
        if (this.unifModelInvTr !== -1) {
            var modelinvtr = gl_matrix_1.mat4.create();
            gl_matrix_1.mat4.transpose(modelinvtr, model);
            gl_matrix_1.mat4.invert(modelinvtr, modelinvtr);
            globals_1.gl.uniformMatrix4fv(this.unifModelInvTr, false, modelinvtr);
        }
    };
    ShaderProgram.prototype.setViewProjMatrix = function (vp) {
        this.use();
        if (this.unifViewProj !== -1) {
            globals_1.gl.uniformMatrix4fv(this.unifViewProj, false, vp);
        }
    };
    ShaderProgram.prototype.setInt = function (f, name) {
        this.use();
        var newf = globals_1.gl.getUniformLocation(this.prog, name);
        globals_1.gl.uniform1i(newf, f);
    };
    ShaderProgram.prototype.setFloat = function (f, name) {
        this.use();
        var newf = globals_1.gl.getUniformLocation(this.prog, name);
        globals_1.gl.uniform1f(newf, f);
    };
    ShaderProgram.prototype.setVec2 = function (v, name) {
        this.use();
        var newv = globals_1.gl.getUniformLocation(this.prog, name);
        globals_1.gl.uniform2fv(newv, v);
    };
    ShaderProgram.prototype.setTime = function (t) {
        this.use();
        if (this.unifTime !== -1) {
            globals_1.gl.uniform1f(this.unifTime, t);
        }
    };
    ShaderProgram.prototype.setWaterTransparency = function (t) {
        this.use();
        if (this.unifWaterTransparency !== -1) {
            globals_1.gl.uniform1f(this.unifWaterTransparency, t);
        }
    };
    ShaderProgram.prototype.setDimensions = function (width, height) {
        this.use();
        if (this.unifDimensions !== -1) {
            globals_1.gl.uniform2f(this.unifDimensions, width, height);
        }
    };
    ShaderProgram.prototype.setTerrainType = function (t) {
        this.use();
        if (this.unifTerrainType !== -1) {
            globals_1.gl.uniform1i(this.unifTerrainType, t);
        }
    };
    ShaderProgram.prototype.setBrushType = function (t) {
        this.use();
        if (this.unifBrushType !== -1) {
            globals_1.gl.uniform1i(this.unifBrushType, t);
        }
    };
    ShaderProgram.prototype.setBrushSize = function (t) {
        this.use();
        if (this.unifBrushSize !== -1) {
            globals_1.gl.uniform1f(this.unifBrushSize, t);
        }
    };
    ShaderProgram.prototype.setBrushStrength = function (t) {
        this.use();
        if (this.unifBrushStrength !== -1) {
            globals_1.gl.uniform1f(this.unifBrushStrength, t);
        }
    };
    ShaderProgram.prototype.setBrushOperation = function (t) {
        this.use();
        if (this.unifBrushOperation !== -1) {
            globals_1.gl.uniform1i(this.unifBrushOperation, t);
        }
    };
    ShaderProgram.prototype.setBrushPos = function (t) {
        this.use();
        if (this.unifBrusPos !== -1) {
            globals_1.gl.uniform2fv(this.unifBrusPos, t);
        }
    };
    ShaderProgram.prototype.setBrushPressed = function (t) {
        this.use();
        if (this.unifBrushPressed !== -1) {
            globals_1.gl.uniform1i(this.unifBrushPressed, t);
        }
    };
    ShaderProgram.prototype.setTerrainDebug = function (t) {
        this.use();
        if (this.unifTerrainDebug !== -1) {
            globals_1.gl.uniform1i(this.unifTerrainDebug, t);
        }
    };
    ShaderProgram.prototype.setTerrainScale = function (t) {
        this.use();
        if (this.unifTerrainScale !== -1) {
            globals_1.gl.uniform1f(this.unifTerrainScale, t);
        }
    };
    ShaderProgram.prototype.setTerrainHeight = function (t) {
        this.use();
        if (this.unifTerrainHeight !== -1) {
            globals_1.gl.uniform1f(this.unifTerrainHeight, t);
        }
    };
    ShaderProgram.prototype.setSpawnPos = function (pos) {
        this.use();
        if (this.unifSpanwPos !== -1) {
            globals_1.gl.uniform2fv(this.unifSpanwPos, pos);
        }
    };
    ShaderProgram.prototype.setMouseWorldPos = function (pos) {
        this.use();
        if (this.unifMouseWorldPos !== -1) {
            globals_1.gl.uniform4fv(this.unifMouseWorldPos, pos);
        }
    };
    ShaderProgram.prototype.setMouseWorldDir = function (dir) {
        this.use();
        if (this.unifMouseWorldDir !== -1) {
            globals_1.gl.uniform3fv(this.unifMouseWorldDir, dir);
        }
    };
    ShaderProgram.prototype.setRndTerrain = function (r) {
        this.use();
        if (this.unifRndTerrain !== -1) {
            globals_1.gl.uniform1i(this.unifRndTerrain, r);
        }
    };
    ShaderProgram.prototype.setPlanePos = function (pos) {
        this.use();
        if (this.unifPlanePos !== -1) {
            globals_1.gl.uniform2fv(this.unifPlanePos, pos);
        }
    };
    ShaderProgram.prototype.setEyeRefUp = function (eye, ref, up) {
        this.use();
        if (this.unifEye !== -1) {
            globals_1.gl.uniform3f(this.unifEye, eye[0], eye[1], eye[2]);
        }
        if (this.unifRef !== -1) {
            globals_1.gl.uniform3f(this.unifRef, ref[0], ref[1], ref[2]);
        }
        if (this.unifUp !== -1) {
            globals_1.gl.uniform3f(this.unifUp, up[0], up[1], up[2]);
        }
    };
    ShaderProgram.prototype.setPipeLen = function (len) {
        this.use();
        if (this.unifPipeLen !== -1) {
            globals_1.gl.uniform1f(this.unifPipeLen, len);
        }
    };
    ShaderProgram.prototype.setKs = function (k) {
        this.use();
        if (this.unifKs !== -1) {
            globals_1.gl.uniform1f(this.unifKs, k);
        }
    };
    ShaderProgram.prototype.setKc = function (k) {
        this.use();
        if (this.unifKc !== -1) {
            globals_1.gl.uniform1f(this.unifKc, k);
        }
    };
    ShaderProgram.prototype.setTimestep = function (t) {
        this.use();
        if (this.unifTimestep !== -1) {
            globals_1.gl.uniform1f(this.unifTimestep, t);
        }
    };
    ShaderProgram.prototype.setPipeArea = function (a) {
        this.use();
        if (this.unifPipeArea !== -1) {
            globals_1.gl.uniform1f(this.unifPipeArea, a);
        }
    };
    ShaderProgram.prototype.setKd = function (k) {
        this.use();
        if (this.unifKd !== -1) {
            globals_1.gl.uniform1f(this.unifKd, k);
        }
    };
    ShaderProgram.prototype.setSimres = function (res) {
        this.use();
        if (this.unifSimRes !== -1) {
            globals_1.gl.uniform1f(this.unifSimRes, res);
        }
    };
    ShaderProgram.prototype.draw = function (d) {
        this.use();
        if (this.attrPos != -1 && d.bindPos()) {
            globals_1.gl.enableVertexAttribArray(this.attrPos);
            globals_1.gl.vertexAttribPointer(this.attrPos, 4, globals_1.gl.FLOAT, false, 0, 0);
        }
        if (this.attrNor != -1 && d.bindNor()) {
            globals_1.gl.enableVertexAttribArray(this.attrNor);
            globals_1.gl.vertexAttribPointer(this.attrNor, 4, globals_1.gl.FLOAT, false, 0, 0);
        }
        if (this.attrUv != -1 && d.bindUv()) {
            globals_1.gl.enableVertexAttribArray(this.attrUv);
            globals_1.gl.vertexAttribPointer(this.attrUv, 2, globals_1.gl.FLOAT, false, 0, 0);
        }
        d.bindIdx();
        globals_1.gl.drawElements(d.drawMode(), d.elemCount(), globals_1.gl.UNSIGNED_INT, 0);
        if (this.attrPos != -1)
            globals_1.gl.disableVertexAttribArray(this.attrPos);
        if (this.attrNor != -1)
            globals_1.gl.disableVertexAttribArray(this.attrNor);
        if (this.attrUv != -1)
            globals_1.gl.disableVertexAttribArray(this.attrUv);
    };
    return ShaderProgram;
}());
;
exports["default"] = ShaderProgram;
