var Frame = pc.createScript('frame');

Frame.attributes.add('samples', { type: 'number', default: 4, title: 'Samples(TAA없을때)' });
Frame.attributes.add('toneMapping', {
    type: 'number',
    enum: [
        { 'Linear': pc.TONEMAP_LINEAR },
        { 'ACES': pc.TONEMAP_ACES },
        { 'Filmic': pc.TONEMAP_FILMIC },
        { 'Hejl': pc.TONEMAP_HEJL },
        { 'None': pc.TONEMAP_NONE }
    ],
    default: pc.TONEMAP_LINEAR,
    title: 'Tone Mapping(TAA없을때)'
});

Frame.attributes.add('bloomIntensity', { type: 'number', default: 0.02, title: 'Bloom Intensity' });
Frame.attributes.add('bloomBlurLevel', { type: 'number', default: 4, title: 'Bloom Blur Level' });

Frame.attributes.add('vignetteInner', { type: 'number', default: 0.5, title: 'Vignette Inner' });
Frame.attributes.add('vignetteOuter', { type: 'number', default: 1, title: 'Vignette Outer' });
Frame.attributes.add('vignetteCurvature', { type: 'number', default: 0.5, title: 'Vignette Curvature' });
Frame.attributes.add('vignetteIntensity', { type: 'number', default: 0.5, title: 'Vignette Intensity' });

Frame.attributes.add('taaEnabled', { type: 'boolean', default: true, title: 'TAA켜기' });
Frame.attributes.add('taaJitter', { type: 'number', default: 0.8, title: 'TAA 강도' });

Frame.attributes.add('sharpness', { type: 'number', default: 1.2, title: '선명도' });


Frame.prototype.initialize = function() {
    setTimeout(() => {
        this.cameraFrame = new pc.CameraFrame(this.app, this.entity.camera);

        this.cameraFrame.rendering.samples = this.samples;
        this.cameraFrame.rendering.toneMapping = this.toneMapping;
        this.cameraFrame.rendering.sharpness = this.sharpness;

        this.cameraFrame.bloom.intensity = this.bloomIntensity;
        this.cameraFrame.bloom.blurLevel = this.bloomBlurLevel;

        this.cameraFrame.vignette.inner = this.vignetteInner;
        this.cameraFrame.vignette.outer = this.vignetteOuter;
        this.cameraFrame.vignette.curvature = this.vignetteCurvature;
        this.cameraFrame.vignette.intensity = this.vignetteIntensity;

        this.cameraFrame.taa.enabled = this.taaEnabled;
        this.cameraFrame.taa.jitter = this.taaJitter;

        this.cameraFrame.update();
    }, 1);
};

// update code called every frame
Frame.prototype.update = function(dt) {

};