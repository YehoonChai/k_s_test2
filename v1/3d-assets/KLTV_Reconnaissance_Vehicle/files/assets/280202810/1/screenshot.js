var Screenshot = pc.createScript('screenshot');

Screenshot.attributes.add('cameraEntity', {
    type: 'entity',
    description: '스크린샷을 찍을 때 사용할 카메라 엔터티입니다.'
});

Screenshot.attributes.add('modelEntity', {
    type: 'entity',
    title: '촬영할 모델 엔터티'
});

Screenshot.prototype.initialize = function () {
    this.device = this.app.graphicsDevice;
    this.imageWidth = 3840;
    this.imageHeight = 2160;

    this.setupRenderTarget();
    this.setupCanvas();

    this.app.on("screenshot", () => this.onScreenshot("capture"));
};

Screenshot.prototype.setupRenderTarget = function () {
    const colorBuffer = new pc.Texture(this.device, {
        width: this.imageWidth,
        height: this.imageHeight,
        format: pc.PIXELFORMAT_R8_G8_B8_A8,
        autoMipmap: false
    });

    const depthBuffer = new pc.Texture(this.device, {
        width: this.imageWidth,
        height: this.imageHeight,
        format: pc.PIXELFORMAT_DEPTHSTENCIL
    });

    this.renderTarget = new pc.RenderTarget({
        colorBuffer: colorBuffer,
        depthBuffer: depthBuffer
    });

    this.cameraEntity.camera.renderTarget = this.renderTarget;
    this.cameraEntity.camera.clearColor = new pc.Color(0, 0, 0, 0);
    this.cameraEntity.camera.clearColorBuffer = true;
};

Screenshot.prototype.setupCanvas = function () {
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.imageWidth;
    this.canvas.height = this.imageHeight;
    this.context = this.canvas.getContext('2d');
};

Screenshot.prototype.takeScreenshot = function (filename) {
    return new Promise((resolve, reject) => {
        try {
            const colorBuffer = this.renderTarget.colorBuffer;
            const gl = this.app.graphicsDevice.gl;
            const fb = gl.createFramebuffer();
            const pixels = new Uint8Array(this.imageWidth * this.imageHeight * 4);

            gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, colorBuffer._glTexture, 0);
            gl.readPixels(0, 0, this.imageWidth, this.imageHeight, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            gl.deleteFramebuffer(fb);

            const imageData = this.context.createImageData(this.imageWidth, this.imageHeight);

            for (let y = 0; y < this.imageHeight; y++) {
                for (let x = 0; x < this.imageWidth; x++) {
                    const src = ((this.imageHeight - y - 1) * this.imageWidth + x) * 4;
                    const dst = (y * this.imageWidth + x) * 4;
                    imageData.data[dst] = pixels[src];
                    imageData.data[dst + 1] = pixels[src + 1];
                    imageData.data[dst + 2] = pixels[src + 2];
                    imageData.data[dst + 3] = pixels[src + 3];
                }
            }

            this.context.putImageData(imageData, 0, 0);

            this.canvas.toBlob((blob) => {
                if (!blob) {
                    reject(new Error('Blob 생성 실패'));
                    return;
                }

                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;
                link.download = `${filename}.webp`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);

                resolve();
            }, "image/webp", 0.9);

        } catch (error) {
            reject(error);
        }
    });
};


Screenshot.prototype.setupCanvas = function () {
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.imageWidth;
    this.canvas.height = this.imageHeight;
    this.context = this.canvas.getContext('2d');
};

Screenshot.prototype.onScreenshot = async function (filename) {
    if (this.capturer) {
        console.warn("이미 녹화가 진행 중입니다.");
        return;
    }

    const meshInstances = this.modelEntity.render?.meshInstances;
    if (!meshInstances || meshInstances.length === 0) {
        console.warn("모델 엔터티에 렌더링할 메쉬(meshInstances)가 없습니다.");
        return;
    }

    // CCapture.js 라이브러리를 초기화합니다.
    this.capturer = new CCapture({
        format: 'webm',    // 동영상 포맷
        framerate: 20,      // 초당 프레임
        quality: 100,        // 품질 (0-100)
        verbose: false       // 콘솔에 진행 상황 출력
    });

    // 녹화를 시작합니다.
    this.capturer.start();
    console.log("동영상 녹화를 시작합니다...");

    // 모델의 경계 상자(bounding box)를 계산하여 중심점을 찾습니다.
    const bounds = meshInstances.reduce((aabb, mi) => {
        if (aabb) {
            aabb.add(mi.aabb);
            return aabb;
        }
        return mi.aabb.clone();
    }, null);

    const center = bounds.center.clone();
    const radius = this.cameraEntity.getPosition().clone().sub(center).length();

    const totalFrames = 120;
    for (let i = 0; i <= totalFrames; i++) {
        const angleRad = pc.math.DEG_TO_RAD * (i * 3);
        const x = center.x + radius * Math.cos(angleRad);
        const z = center.z + radius * Math.sin(angleRad);
        const y = this.cameraEntity.getPosition().y;

        this.cameraEntity.setPosition(x, y, z);
        this.cameraEntity.lookAt(center);

        if (i === 0) {
            await new Promise(r => this.app.once('postrender', r));
            continue;
        }

        await this.takeScreenshot(); // 1~120 프레임 캡처
    }

    console.log("녹화를 종료하고 파일을 저장합니다.");
    this.capturer.stop();
    this.capturer.save((blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${filename}.webm`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        this.capturer = null;
        console.log("동영상 저장이 완료되었습니다.");

    });
    location.reload()
};

Screenshot.prototype.takeScreenshot = function () {
    return new Promise((resolve) => {
        const colorBuffer = this.renderTarget.colorBuffer;
        const gl = this.app.graphicsDevice.gl;
        const fb = gl.createFramebuffer();
        const pixels = new Uint8Array(this.imageWidth * this.imageHeight * 4);

        // 렌더 타겟에서 픽셀 데이터를 읽어옵니다.
        gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D,
            colorBuffer._glTexture, 0);
        gl.readPixels(0, 0, this.imageWidth, this.imageHeight, gl.RGBA, gl.UNSIGNED_BYTE,
            pixels);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.deleteFramebuffer(fb);

        // 픽셀 데이터를 캔버스에 그리기 위해 ImageData를 생성합니다.
        const imageData = this.context.createImageData(this.imageWidth, this.imageHeight);

        // PlayCanvas의 픽셀 데이터는 상하가 반전되어 있으므로, 바로잡아줍니다.
        for (let y = 0; y < this.imageHeight; y++) {
            for (let x = 0; x < this.imageWidth; x++) {
                const src = ((this.imageHeight - y - 1) * this.imageWidth + x) * 4;
                const dst = (y * this.imageWidth + x) * 4;
                imageData.data[dst]     = pixels[src];
                imageData.data[dst + 1] = pixels[src + 1];
                imageData.data[dst + 2] = pixels[src + 2];
                imageData.data[dst + 3] = pixels[src + 3];
            }
        }

        this.context.putImageData(imageData, 0, 0);

if (this.capturer) {
    const scaledCanvas = document.createElement('canvas');
    scaledCanvas.width = 1920;
    scaledCanvas.height = 1080;
    const scaledCtx = scaledCanvas.getContext('2d');

    scaledCtx.drawImage(this.canvas, 0, 0, this.canvas.width, this.canvas.height,
                                      0, 0, scaledCanvas.width, scaledCanvas.height);

    this.capturer.capture(scaledCanvas);
}

        this.app.once('postrender', resolve);
    });
};
