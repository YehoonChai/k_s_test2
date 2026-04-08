var Frame = pc.createScript('frame');

// --------------------------------------------------------------------------------
// -- 1. ATTRIBUTES (모든 포스트 이펙트 속성 정의)
// --------------------------------------------------------------------------------

// --- TAA (안티 앨리어싱) ---
Frame.attributes.add('taaEnabled', { type: 'boolean', default: true, title: 'TAA 켜기' });
Frame.attributes.add('taaJitter', { type: 'number', default: 0.8, min: 0, max: 2, precision: 2, title: 'TAA Jitter', description: 'TAA가 켜져있을 때만 보임' });

// --- 기본 렌더링 ---
Frame.attributes.add('samples', { type: 'number', default: 16, min: 0, max: 16, title: 'Samples (MSAA)', description: 'TAA가 꺼져있을 때만 보임' });
Frame.attributes.add('toneMapping', {
    type: 'number',
    enum: [
        { 'Linear': pc.TONEMAP_LINEAR }, { 'ACES': pc.TONEMAP_ACES }, { 'ACES2': pc.TONEMAP_ACES2 },
        { 'Filmic': pc.TONEMAP_FILMIC }, { 'Hejl': pc.TONEMAP_HEJL }, { 'None': pc.TONEMAP_NONE }
    ],
    default: pc.TONEMAP_ACES2,
    title: 'Tone Mapping'
});
Frame.attributes.add('sharpness', { type: 'number', default: 1.2, min: 0, max: 3, precision: 2, title: '선명도 (Sharpness)' });

// --- Bloom (빛 번짐) ---
Frame.attributes.add('bloomEnabled', { type: 'boolean', default: true, title: 'Bloom 켜기' });
Frame.attributes.add('bloomIntensity', { type: 'number', default: 0.01, min: 0, max: 1, precision: 3, title: 'Bloom Intensity' });
Frame.attributes.add('bloomThreshold', { type: 'number', default: 1, min: 0, max: 2, precision: 2, title: 'Bloom Threshold' });
Frame.attributes.add('bloomBlurLevel', { type: 'number', default: 3, min: 0, max: 10, title: 'Bloom Blur Level' });

// --- Vignette (비네팅) ---
Frame.attributes.add('vignetteEnabled', { type: 'boolean', default: false, title: 'Vignette 켜기' });
Frame.attributes.add('vignetteIntensity', { type: 'number', default: 0, min: 0, max: 10, precision: 2, title: 'Vignette Intensity' });
Frame.attributes.add('vignetteInner', { type: 'number', default: 0, min: 0, max: 10, precision: 2, title: 'Vignette Inner' });
Frame.attributes.add('vignetteOuter', { type: 'number', default: 0, min: 0, max: 10, precision: 2, title: 'Vignette Outer' });
Frame.attributes.add('vignetteCurvature', { type: 'number', default: 0, min: 0, max: 10, precision: 2, title: 'Vignette Curvature' });

// --- Color Grading (색 보정) ---
Frame.attributes.add('gradingEnabled', { type: 'boolean', default: true, title: 'Grading 켜기' });
Frame.attributes.add('gradingSaturation', { type: 'number', default: 1, min: -1, max: 10, precision: 2, title: 'Grading Saturation' });
Frame.attributes.add('gradingBrightness', { type: 'number', default: 1.54, min: -1, max: 10, precision: 2, title: 'Grading Brightness' });
Frame.attributes.add('gradingContrast', { type: 'number', default: 1, min: -1, max: 10, precision: 2, title: 'Grading Contrast' });

// --- Color LUT (컬러 필터) ---
Frame.attributes.add('lutEnabled', { type: 'boolean', default: false, title: 'Color LUT 켜기' });
Frame.attributes.add('lutTexture', { type: 'asset', assetType: 'texture', title: 'Color LUT Texture' });
Frame.attributes.add('lutIntensity', { type: 'number', default: 1, min: 0, max: 1, precision: 2, title: 'Color LUT Intensity' });

// --- DOF (아웃포커싱) ---
Frame.attributes.add('dofEnabled', { type: 'boolean', default: false, title: 'DOF 켜기 (아웃포커싱)' });
Frame.attributes.add('dofFocusDistance', { type: 'number', default: 10, min: 0, max: 100, precision: 1, title: 'DOF Focus Distance' });
Frame.attributes.add('dofAperture', { type: 'number', default: 0.1, min: 0, max: 1, precision: 2, title: 'DOF Aperture (Blur)' });

// --- SSAO (접촉 그림자) ---
Frame.attributes.add('ssaoEnabled', { type: 'boolean', default: false, title: 'SSAO 켜기 (접촉 그림자)' });
Frame.attributes.add('ssaoIntensity', { type: 'number', default: 0.5, min: 0, max: 2, precision: 2, title: 'SSAO Intensity' });
Frame.attributes.add('ssaoRadius', { type: 'number', default: 30, min: 0, max: 100, title: 'SSAO Radius' });

// --- Chromatic Aberration (색수차) ---
Frame.attributes.add('fringingEnabled', { type: 'boolean', default: false, title: 'Fringing 켜기 (색수차)' });
Frame.attributes.add('fringingIntensity', { type: 'number', default: 0, min: 0, max: 1, precision: 3, title: 'Fringing Intensity' });


// --------------------------------------------------------------------------------
// -- 2. INITIALIZE (초기화 및 리스너 등록)
// --------------------------------------------------------------------------------

Frame.prototype.initialize = function() {
    
    // 1. cameraFrame 객체를 1ms 뒤에 생성 (초기화 순서 문제 방지)
    setTimeout(() => {
        if (!this.entity || !this.entity.camera) return; // destroy 방지
        this.cameraFrame = new pc.CameraFrame(this.app, this.entity.camera);
        this.updateAllSettings(); // 모든 설정을 한 번에 적용
    }, 1);


    // 2. (!!!) "속성 변경 감지기" 추가 (실시간 조절의 핵심)
    this.on('attr', function(name, value) {
        // cameraFrame이 아직 생성되지 않았으면 무시
        if (!this.cameraFrame) {
            return;
        }

        // 2a. 속성 변경 시 실시간으로 CameraFrame에 값 적용
        this.updateSetting(name, value);

        // 2b. (!!!) 'Enabled' 토글을 누를 때마다 UI 숨김/표시 갱신
        if (name.endsWith('Enabled')) {
            this.updateAttributeVisibility();
        }
    }, this);

    // 3. (!!!) 에디터에서 스크립트가 로드될 때, 현재 토글 상태에 맞게 UI를 즉시 숨김
    this.updateAttributeVisibility();
};

// --------------------------------------------------------------------------------
// -- 3. HELPER FUNCTIONS (실제 로직)
// --------------------------------------------------------------------------------

/**
 * 모든 속성 값을 CameraFrame에 적용 (초기화 시 1회 호출)
 */
Frame.prototype.updateAllSettings = function() {
    if (!this.cameraFrame) return;
    
    // TAA
    this.cameraFrame.taa.enabled = this.taaEnabled;
    this.cameraFrame.taa.jitter = this.taaJitter;

    // Rendering
    this.cameraFrame.rendering.samples = this.samples;
    this.cameraFrame.rendering.toneMapping = this.toneMapping;
    this.cameraFrame.rendering.sharpness = this.sharpness;

    // Bloom
    this.cameraFrame.bloom.enabled = this.bloomEnabled;
    this.cameraFrame.bloom.intensity = this.bloomIntensity;
    this.cameraFrame.bloom.threshold = this.bloomThreshold;
    this.cameraFrame.bloom.blurLevel = this.bloomBlurLevel;

    // Vignette
    this.cameraFrame.vignette.enabled = this.vignetteEnabled;
    this.cameraFrame.vignette.intensity = this.vignetteIntensity;
    this.cameraFrame.vignette.inner = this.vignetteInner;
    this.cameraFrame.vignette.outer = this.vignetteOuter;
    this.cameraFrame.vignette.curvature = this.vignetteCurvature;
    
    // Grading
    this.cameraFrame.grading.enabled = this.gradingEnabled;
    this.cameraFrame.grading.saturation = this.gradingSaturation;
    this.cameraFrame.grading.brightness = this.gradingBrightness;
    this.cameraFrame.grading.contrast = this.gradingContrast;

    // Color LUT
    this.cameraFrame.colorLUT.enabled = this.lutEnabled;
    this.cameraFrame.colorLUT.texture = this.lutTexture ? this.lutTexture.resource : null;
    this.cameraFrame.colorLUT.intensity = this.lutIntensity;

    // DOF
    this.cameraFrame.dof.enabled = this.dofEnabled;
    this.cameraFrame.dof.focusDistance = this.dofFocusDistance;
    this.cameraFrame.dof.aperture = this.dofAperture;

    // SSAO
    this.cameraFrame.ssao.enabled = this.ssaoEnabled;
    this.cameraFrame.ssao.intensity = this.ssaoIntensity;
    this.cameraFrame.ssao.radius = this.ssaoRadius;

    // Fringing
    this.cameraFrame.fringing.enabled = this.fringingEnabled;
    this.cameraFrame.fringing.intensity = this.fringingIntensity;
    
    // 최종 업데이트
    this.cameraFrame.update();
};


/**
 * 'attr' 이벤트가 발생했을 때, 변경된 속성 1개만 CameraFrame에 적용
 */
Frame.prototype.updateSetting = function(name, value) {
    if (!this.cameraFrame) return;

    // 변경된 속성(name)에 따라 올바른 위치에 값을 업데이트합니다.
    switch (name) {
        // TAA
        case 'taaEnabled': this.cameraFrame.taa.enabled = value; break;
        case 'taaJitter': this.cameraFrame.taa.jitter = value; break;

        // Rendering
        case 'samples': this.cameraFrame.rendering.samples = value; break;
        case 'toneMapping': this.cameraFrame.rendering.toneMapping = value; break;
        case 'sharpness': this.cameraFrame.rendering.sharpness = value; break;

        // Bloom
        case 'bloomEnabled': this.cameraFrame.bloom.enabled = value; break;
        case 'bloomIntensity': this.cameraFrame.bloom.intensity = value; break;
        case 'bloomThreshold': this.cameraFrame.bloom.threshold = value; break;
        case 'bloomBlurLevel': this.cameraFrame.bloom.blurLevel = value; break;

        // Vignette
        case 'vignetteEnabled': this.cameraFrame.vignette.enabled = value; break;
        case 'vignetteIntensity': this.cameraFrame.vignette.intensity = value; break;
        case 'vignetteInner': this.cameraFrame.vignette.inner = value; break;
        case 'vignetteOuter': this.cameraFrame.vignette.outer = value; break;
        case 'vignetteCurvature': this.cameraFrame.vignette.curvature = value; break;

        // Grading
        case 'gradingEnabled': this.cameraFrame.grading.enabled = value; break;
        case 'gradingSaturation': this.cameraFrame.grading.saturation = value; break;
        case 'gradingBrightness': this.cameraFrame.grading.brightness = value; break;
        case 'gradingContrast': this.cameraFrame.grading.contrast = value; break;

        // Color LUT
        case 'lutEnabled': this.cameraFrame.colorLUT.enabled = value; break;
        case 'lutTexture': this.cameraFrame.colorLUT.texture = value ? value.resource : null; break;
        case 'lutIntensity': this.cameraFrame.colorLUT.intensity = value; break;

        // DOF
        case 'dofEnabled': this.cameraFrame.dof.enabled = value; break;
        case 'dofFocusDistance': this.cameraFrame.dof.focusDistance = value; break;
        case 'dofAperture': this.cameraFrame.dof.aperture = value; break;

        // SSAO
        case 'ssaoEnabled': this.cameraFrame.ssao.enabled = value; break;
        case 'ssaoIntensity': this.cameraFrame.ssao.intensity = value; break;
        case 'ssaoRadius': this.cameraFrame.ssao.radius = value; break;

        // Fringing
        case 'fringingEnabled': this.cameraFrame.fringing.enabled = value; break;
        case 'fringingIntensity': this.cameraFrame.fringing.intensity = value; break;
    }

    // (!!!) 값을 변경한 후, cameraFrame.update()를 "반드시" 호출해야
    // 시각적인 변경 사항이 적용됩니다.
    this.cameraFrame.update();
};


/**
 * (!!!) 에디터에서만 작동: 'Enabled' 토글 상태에 따라 세부 속성을 숨기거나 표시
 */
Frame.prototype.updateAttributeVisibility = function() {
    // 이 기능은 PlayCanvas 에디터 내부에서만 작동합니다 (런타임에서는 _editorAttrs가 없음)
    if (!this.app.editor) {
        return;
    }

    // this._editorAttrs는 스크립트가 에디터에서 실행될 때만 존재하는
    // '속성 이름'과 '인스펙터 UI 요소'를 연결하는 맵(Map)입니다.
    
    // TAA
    this.app.editor.setAttribute('taaJitter:hidden', !this.taaEnabled);
    this.app.editor.setAttribute('samples:hidden', this.taaEnabled);

    // Bloom
    this.app.editor.setAttribute('bloomIntensity:hidden', !this.bloomEnabled);
    this.app.editor.setAttribute('bloomThreshold:hidden', !this.bloomEnabled);
    this.app.editor.setAttribute('bloomBlurLevel:hidden', !this.bloomEnabled);

    // Vignette
    this.app.editor.setAttribute('vignetteIntensity:hidden', !this.vignetteEnabled);
    this.app.editor.setAttribute('vignetteInner:hidden', !this.vignetteEnabled);
    this.app.editor.setAttribute('vignetteOuter:hidden', !this.vignetteEnabled);
    this.app.editor.setAttribute('vignetteCurvature:hidden', !this.vignetteEnabled);

    // Grading
    this.app.editor.setAttribute('gradingSaturation:hidden', !this.gradingEnabled);
    this.app.editor.setAttribute('gradingBrightness:hidden', !this.gradingEnabled);
    this.app.editor.setAttribute('gradingContrast:hidden', !this.gradingEnabled);

    // Color LUT
    this.app.editor.setAttribute('lutTexture:hidden', !this.lutEnabled);
    this.app.editor.setAttribute('lutIntensity:hidden', !this.lutEnabled);

    // DOF
    this.app.editor.setAttribute('dofFocusDistance:hidden', !this.dofEnabled);
    this.app.editor.setAttribute('dofAperture:hidden', !this.dofEnabled);

    // SSAO
    this.app.editor.setAttribute('ssaoIntensity:hidden', !this.ssaoEnabled);
    this.app.editor.setAttribute('ssaoRadius:hidden', !this.ssaoEnabled);

    // Fringing
    this.app.editor.setAttribute('fringingIntensity:hidden', !this.fringingEnabled);
};