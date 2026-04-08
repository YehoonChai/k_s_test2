(function() {
    // -------------------------------------------------------------------------
    // 1. Shaders
    // -------------------------------------------------------------------------

    // [공통] 버텍스 셰이더
    var vertexShader = [
        "attribute vec2 vertex_position;",
        "varying vec2 texcoord;",
        "void main(void) {",
        "    gl_Position = vec4(vertex_position, 0.5, 1.0);",
        "    texcoord = vertex_position.xy * 0.5 + 0.5;",
        "}"
    ].join("\n");

    // [Multiframe] 누적 셰이더
    var accumFragmentShader = [
        "varying vec2 texcoord;",
        "uniform sampler2D sourceTex;",
        "uniform vec4 texcoordMod;", // Jitter Offset
        "void main(void) {",
        "    vec2 uv = texcoord * texcoordMod.xy + texcoordMod.zw;",
        "    gl_FragColor = texture2D(sourceTex, uv);",
        "}"
    ].join("\n");

    // [Bloom 1] Bright Pass + Blur H
    var blurHShader = [
        "varying vec2 texcoord;",
        "uniform sampler2D uTex;",
        "uniform vec2 uTexSize;",
        "uniform float uThreshold;",
        
        "vec3 getBright(vec3 color) {",
        "    float brightness = dot(color, vec3(0.2126, 0.7152, 0.0722));",
        "    // Threshold보다 밝은 부분만 남기고, 부드럽게 감쇄",
        "    return max(color - uThreshold, 0.0);", 
        "}",

        "void main(void) {",
        "    float pixelSize = 1.0 / uTexSize.x;",
        "    float weight[5]; weight[0]=0.227027; weight[1]=0.1945946; weight[2]=0.1216216; weight[3]=0.054054; weight[4]=0.016216;",
        "    ",
        "    vec3 result = getBright(texture2D(uTex, texcoord).rgb) * weight[0];",
        "    for(int i = 1; i < 5; ++i) {",
        "        result += getBright(texture2D(uTex, texcoord + vec2(pixelSize * float(i), 0.0)).rgb) * weight[i];",
        "        result += getBright(texture2D(uTex, texcoord - vec2(pixelSize * float(i), 0.0)).rgb) * weight[i];",
        "    }",
        "    gl_FragColor = vec4(result, 1.0);",
        "}"
    ].join("\n");

    // [Bloom 2] Blur V
    var blurVShader = [
        "varying vec2 texcoord;",
        "uniform sampler2D uTex;",
        "uniform vec2 uTexSize;",
        
        "void main(void) {",
        "    float pixelSize = 1.0 / uTexSize.y;",
        "    float weight[5]; weight[0]=0.227027; weight[1]=0.1945946; weight[2]=0.1216216; weight[3]=0.054054; weight[4]=0.016216;",
        "    vec3 result = texture2D(uTex, texcoord).rgb * weight[0];",
        "    for(int i = 1; i < 5; ++i) {",
        "        result += texture2D(uTex, texcoord + vec2(0.0, pixelSize * float(i))).rgb * weight[i];",
        "        result += texture2D(uTex, texcoord - vec2(0.0, pixelSize * float(i))).rgb * weight[i];",
        "    }",
        "    gl_FragColor = vec4(result, 1.0);",
        "}"
    ].join("\n");

    // [Final] 합성 셰이더 (Multiframe + Bloom + Grading + ToneMapping)
    var compositeShader = [
        "varying vec2 texcoord;",
        "uniform sampler2D uBaseTex;",
        "uniform sampler2D uBloomTex;",
        "uniform float uBloomIntensity;",
        "uniform float uGamma;",
        
        // Grading Uniforms
        "uniform float uBrightness;",
        "uniform float uContrast;",
        "uniform float uSaturation;",

        "void main(void) {",
        "    vec3 baseColor = texture2D(uBaseTex, texcoord).rgb;",
        "    vec3 bloomColor = texture2D(uBloomTex, texcoord).rgb;",
        "    ",
        "    // 1. Bloom 합성 (Additive)",
        "    vec3 color = baseColor + (bloomColor * uBloomIntensity);",
        "    ",
        "    // 2. Color Grading",
        "    // 2-1. Brightness",
        "    color = color + uBrightness;",
        "    ",
        "    // 2-2. Contrast",
        "    color = (color - 0.5) * uContrast + 0.5;",
        "    ",
        "    // 2-3. Saturation",
        "    float luminance = dot(color, vec3(0.2126, 0.7152, 0.0722));",
        "    color = mix(vec3(luminance), color, uSaturation);",
        "    ",
        "    // 3. Gamma Correction (Tone Mapping)",
        "    // 음수 색상 방지 (Contrast 계산 등으로 인해 발생 가능)",
        "    color = max(color, 0.0);",
        "    gl_FragColor = vec4(pow(color, vec3(1.0 / uGamma)), 1.0);",
        "}"
    ].join("\n");


    // -------------------------------------------------------------------------
    // 2. Helper Functions
    // -------------------------------------------------------------------------
    function halton(index, base) {
        var result = 0;
        var f = 1 / base;
        var i = index;
        while (i > 0) {
            result = result + f * (i % base);
            i = Math.floor(i / base);
            f = f / base;
        }
        return result;
    }

    var blendAccum = new pc.BlendState(true, pc.BLENDEQUATION_ADD, pc.BLENDMODE_CONSTANT, pc.BLENDMODE_ONE_MINUS_CONSTANT);
    var blendNone = new pc.BlendState(false);


    // -------------------------------------------------------------------------
    // 3. Script Definition
    // -------------------------------------------------------------------------
    var Multiframe = pc.createScript('multiframe');

    // --- Multiframe ---
    Multiframe.attributes.add('enabled', { type: 'boolean', default: true, title: 'Enabled' });
    Multiframe.attributes.add('samples', { type: 'number', default: 16, min: 2, max: 64, title: 'AA Samples' });
    Multiframe.attributes.add('jitter', { type: 'number', default: 1, title: 'AA Jitter' });

    // --- Bloom ---
    Multiframe.attributes.add('bloomEnabled', { type: 'boolean', default: true, title: '[Bloom] Enabled' });
    Multiframe.attributes.add('bloomIntensity', { type: 'number', default: 1.0, min: 0, max: 5, title: '[Bloom] Intensity' });
    Multiframe.attributes.add('bloomThreshold', { type: 'number', default: 0.7, min: 0, max: 2, title: '[Bloom] Threshold' });
    Multiframe.attributes.add('bloomBlurLevel', { type: 'number', default: 2, min: 1, max: 4, title: '[Bloom] Blur Level' });

    // --- Color Grading ---
    Multiframe.attributes.add('brightness', { type: 'number', default: 0.0, min: -1.0, max: 1.0, title: '[Grade] Brightness', description: '0 is default' });
    Multiframe.attributes.add('contrast', { type: 'number', default: 1.0, min: 0.0, max: 3.0, title: '[Grade] Contrast', description: '1 is default' });
    Multiframe.attributes.add('saturation', { type: 'number', default: 1.0, min: 0.0, max: 3.0, title: '[Grade] Saturation', description: '1 is default, 0 is grayscale' });

    Multiframe.prototype.initialize = function() {
        if (!this.entity.camera) {
            console.error('Multiframe: Camera component not found.');
            return;
        }

        // 기존 Frame 스크립트 충돌 방지
        if (this.entity.script && this.entity.script.frame) {
            this.entity.script.frame.enabled = false;
        }

        this.device = this.app.graphicsDevice;
        this.camera = this.entity.camera;
        
        this._ensureRenderTarget();

        // 셰이더 컴파일
        this.shdAccum = pc.ShaderUtils.createShader(this.device, { uniqueName: 'mf-accum', attributes: { vertex_position: pc.SEMANTIC_POSITION }, vertexGLSL: vertexShader, fragmentGLSL: accumFragmentShader });
        this.shdBlurH = pc.ShaderUtils.createShader(this.device, { uniqueName: 'mf-blur-h', attributes: { vertex_position: pc.SEMANTIC_POSITION }, vertexGLSL: vertexShader, fragmentGLSL: blurHShader });
        this.shdBlurV = pc.ShaderUtils.createShader(this.device, { uniqueName: 'mf-blur-v', attributes: { vertex_position: pc.SEMANTIC_POSITION }, vertexGLSL: vertexShader, fragmentGLSL: blurVShader });
        this.shdComp = pc.ShaderUtils.createShader(this.device, { uniqueName: 'mf-comp', attributes: { vertex_position: pc.SEMANTIC_POSITION }, vertexGLSL: vertexShader, fragmentGLSL: compositeShader });

        this.sampleArray = [];
        this.sampleId = 0;
        this._updateSampleArray();

        this.lastPos = new pc.Vec3();
        this.lastRot = new pc.Quat();
        
        this.accumTex = null;
        this.accumTarget = null;
        this.blurTex1 = null; 
        this.blurTarget1 = null;
        this.blurTex2 = null; 
        this.blurTarget2 = null;

        this.resizeTimer = null;

        this.onPostRender = this.onPostRender.bind(this);
        this.app.on('frameend', this.onPostRender);
        this.app.graphicsDevice.on('resizecanvas', this._onResize, this);

        this._setupCameraHooks();

        this.app.moved = this.moved.bind(this)
    };

    Multiframe.prototype._updateSampleArray = function() {
        this.sampleArray = [];
        for (var i = 1; i <= this.samples; i++) {
            var sx = (halton(i, 2) * 2.0 - 1.0) * this.jitter; 
            var sy = (halton(i, 3) * 2.0 - 1.0) * this.jitter;
            this.sampleArray.push(new pc.Vec3(sx * 0.5, sy * 0.5, 1.0));
        }
        this.moved();
    };

    Multiframe.prototype._ensureRenderTarget = function() {
        if (this.camera.renderTarget && this.colorBuffer && 
            this.colorBuffer.width === this.device.width && 
            this.colorBuffer.height === this.device.height) return;

        if (this.createdRenderTarget) {
            this.createdRenderTarget.destroy();
            this.colorBuffer.destroy();
        }

        this.colorBuffer = new pc.Texture(this.device, {
            width: this.device.width,
            height: this.device.height,
            format: pc.PIXELFORMAT_RGBA8,
            mipmaps: false,
            minFilter: pc.FILTER_LINEAR,
            magFilter: pc.FILTER_LINEAR
        });

        this.createdRenderTarget = new pc.RenderTarget({
            colorBuffer: this.colorBuffer,
            depth: true
        });

        this.camera.renderTarget = this.createdRenderTarget;
    };

    Multiframe.prototype._setupCameraHooks = function() {
        var self = this;
        this.preRender = function(component) {
            if (component !== self.camera) return;
            var pmat = self.camera.camera.projectionMatrix;
            if (self.enabled && self.accumTex && self.sampleId < self.sampleArray.length) {
                var sample = self.sampleArray[self.sampleId];
                pmat.data[8] = sample.x / self.accumTex.width;
                pmat.data[9] = sample.y / self.accumTex.height;
            } else {
                pmat.data[8] = 0; pmat.data[9] = 0;
            }
            self.camera.camera._viewProjMatDirty = true;
        };
        this.postRender = function(component) {
            if (component !== self.camera) return;
            self.camera.camera.projectionMatrix.data[8] = 0;
            self.camera.camera.projectionMatrix.data[9] = 0;
        };
        this.app.scene.on('prerender', this.preRender);
        this.app.scene.on('postrender', this.postRender);
    };

    Multiframe.prototype.onPostRender = function() {
        if (!this.enabled || !this.camera.renderTarget) return;

        this._checkMovement();
        if (this.sampleId >= this.sampleArray.length) return;

        var device = this.device;
        var sourceTex = this.camera.renderTarget.colorBuffer;

        if (!this.accumTex || this.accumTex.width !== sourceTex.width) {
            this._resizeInternalTextures(sourceTex.width, sourceTex.height);
        }

        // 1. Accumulation
        var blend = (this.sampleId === 0) ? 1.0 : (1.0 / (this.sampleId + 1));
        this.sampleId++;

        device.setBlendState(blendAccum);
        device.setBlendColor(blend, blend, blend, blend);
        device.setDepthState(pc.DepthState.NODEPTH);
        device.setCullMode(pc.CULLFACE_NONE);

        var scope = device.scope;
        scope.resolve('texcoordMod').setValue([1, 1, 0, 0]);
        scope.resolve('sourceTex').setValue(sourceTex);
        
        pc.drawQuadWithShader(device, this.accumTarget, this.shdAccum);


        // 2. Bloom Pipeline
        device.setBlendState(blendNone);

        if (this.bloomEnabled) {
            scope.resolve('uTex').setValue(this.accumTex);
            scope.resolve('uTexSize').setValue([this.blurTex1.width, this.blurTex1.height]);
            scope.resolve('uThreshold').setValue(this.bloomThreshold);
            pc.drawQuadWithShader(device, this.blurTarget1, this.shdBlurH);

            scope.resolve('uTex').setValue(this.blurTex1);
            scope.resolve('uTexSize').setValue([this.blurTex2.width, this.blurTex2.height]);
            pc.drawQuadWithShader(device, this.blurTarget2, this.shdBlurV);
        }

        // 3. Final Composite (Bloom + Grading)
        device.setBlendState(blendNone);
        scope.resolve('uBaseTex').setValue(this.accumTex);
        
        if (this.bloomEnabled) {
            scope.resolve('uBloomTex').setValue(this.blurTex2);
            scope.resolve('uBloomIntensity').setValue(this.bloomIntensity);
        } else {
            scope.resolve('uBloomTex').setValue(this.blurTex2); 
            scope.resolve('uBloomIntensity').setValue(0.0);
        }

        // Grading Values 전달
        scope.resolve('uGamma').setValue(2.2);
        scope.resolve('uBrightness').setValue(this.brightness);
        scope.resolve('uContrast').setValue(this.contrast);
        scope.resolve('uSaturation').setValue(this.saturation);

        pc.drawQuadWithShader(device, null, this.shdComp);
    };

    Multiframe.prototype._resizeInternalTextures = function(width, height) {
        if (this.accumTex) {
            this.accumTex.destroy(); this.accumTarget.destroy();
            this.blurTex1.destroy(); this.blurTarget1.destroy();
            this.blurTex2.destroy(); this.blurTarget2.destroy();
        }

        var format = pc.PIXELFORMAT_RGBA8;
        if (this.device.textureHalfFloatRenderable) format = pc.PIXELFORMAT_RGBA16F;

        this.accumTex = new pc.Texture(this.device, {
            width: width, height: height, format: format,
            mipmaps: false, minFilter: pc.FILTER_NEAREST, magFilter: pc.FILTER_NEAREST
        });
        this.accumTarget = new pc.RenderTarget({ colorBuffer: this.accumTex, depth: false });

        var scale = 1.0 / Math.pow(2, Math.max(1, this.bloomBlurLevel)); 
        var bWidth = Math.floor(width * scale);
        var bHeight = Math.floor(height * scale);

        this.blurTex1 = new pc.Texture(this.device, {
            width: bWidth, height: bHeight, format: pc.PIXELFORMAT_RGBA8,
            mipmaps: false, minFilter: pc.FILTER_LINEAR, magFilter: pc.FILTER_LINEAR,
            addressU: pc.ADDRESS_CLAMP_TO_EDGE, addressV: pc.ADDRESS_CLAMP_TO_EDGE
        });
        this.blurTarget1 = new pc.RenderTarget({ colorBuffer: this.blurTex1, depth: false });

        this.blurTex2 = new pc.Texture(this.device, {
            width: bWidth, height: bHeight, format: pc.PIXELFORMAT_RGBA8,
            mipmaps: false, minFilter: pc.FILTER_LINEAR, magFilter: pc.FILTER_LINEAR,
            addressU: pc.ADDRESS_CLAMP_TO_EDGE, addressV: pc.ADDRESS_CLAMP_TO_EDGE
        });
        this.blurTarget2 = new pc.RenderTarget({ colorBuffer: this.blurTex2, depth: false });

        this.moved();
    };

    Multiframe.prototype._checkMovement = function() {
        var pos = this.entity.getPosition();
        var rot = this.entity.getRotation();
        var threshold = 0.1; 
        
        if (pos.clone().sub(this.lastPos).lengthSq() > (threshold * threshold) || 
            Math.abs(rot.dot(this.lastRot)) < (1.0 - 0.00001)) {
            this.moved();
            this.lastPos.copy(pos);
            this.lastRot.copy(rot);
        }
    };

    Multiframe.prototype.moved = function() {
        this.sampleId = 0;
    };

    Multiframe.prototype._onResize = function(width, height) {
        var self = this;
        if (this.createdRenderTarget) this.camera.renderTarget = null;
        if (this.resizeTimer) clearTimeout(this.resizeTimer);
        this.resizeTimer = setTimeout(function() {
            self._ensureRenderTarget();
            self.moved();
            self.resizeTimer = null;
        }, 100);
    };

    Multiframe.prototype.onAttrChanged = function(name, value) {
        if (name === 'samples' || name === 'jitter') {
            this._updateSampleArray();
        } else if (name === 'bloomBlurLevel') {
            if (this.accumTex) this._resizeInternalTextures(this.accumTex.width, this.accumTex.height);
            this.moved();
        } else {
            // Grading 속성이 바뀌어도 화면을 다시 그려야 함
            // 움직이지 않아도 렌더링 루프가 계속 돌지 않는 구조(Accumulation 완료 시 멈춤)라면
            // 속성 변경 시 moved()를 호출하여 다시 그리게 해야 함
            this.moved(); 
        }
    };

    Multiframe.prototype.swap = function(old) {
        this.app.scene.off('prerender', this.preRender);
        this.app.scene.off('postrender', this.postRender);
        this.app.off('frameend', this.onPostRender);
        this.app.graphicsDevice.off('resizecanvas', this._onResize, this);
        
        if (this.accumTarget) {
            this.accumTarget.destroy(); this.accumTex.destroy();
            this.blurTarget1.destroy(); this.blurTex1.destroy();
            this.blurTarget2.destroy(); this.blurTex2.destroy();
        }
        if (this.createdRenderTarget) {
            this.createdRenderTarget.destroy();
            this.colorBuffer.destroy();
            this.camera.renderTarget = null;
        }
        this.initialize();
    };
})();