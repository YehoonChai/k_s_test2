var BackgroundManager = pc.createScript('backgroundManager');
// 속성 추가

// 초기화 함수
BackgroundManager.prototype.initialize = function () {
    this.envIdx = 0;

    // 테스트로 초기 큐브맵 설정
    this.changeCubeMap('WHITEROOM');

    this.app.on(
        "CHANGE_ENVIRONMENT",
        function (n) {
            n && this.changeEnvironment(n);
        }, this
    );

    this.app.on(
        "CHANGE_CUBEMAP",
        function (n) {
            n && this.changeCubeMap(n);
        }, this
    );
};


// 씬 전체의 큐브맵 변경
BackgroundManager.prototype.changeCubeMap = function (name) {
    if (name === "WHITEROOM") {
        this.app.scene.setSkybox(this.app.assetMatMap["BLACKLINE_cubemap"].resources)
    }
    if (name === "DAY") {
        this.app.scene.setSkybox(this.app.assetMatMap["DAY_cubemap"].resources)
    }
    if (name === "NIGHT") {
        this.app.scene.setSkybox(this.app.assetMatMap["NIGHT_cubemap"].resources)
    }
};

BackgroundManager.prototype.changeEnvironment = function (env) {
    if (env === 'WHITEROOM') {
        if (this.app.assetMatMap["MAT_WHITE"]) {
            this.app.assetMatMap["MAT_WHITE"].ready(function (asset) {
                const mat_whiteroom = asset.resource;
                this.applyToDome(mat_whiteroom);
                this.changeCubeMap(env); // 큐브맵 변경 함수
                this.app.fire('CHANGE_COLOR', "DRL");
            }.bind(this));
            this.app.assets.load(this.app.assetMatMap["MAT_WHITE"]); // 필수!
        }
    } else if (env === 'DAY') {
        if (this.app.assetMatMap["MAT_DAY"]) {
            this.app.assetMatMap["MAT_DAY"].ready(function (asset) {
                const mat_day = asset.resource;
                this.applyToDome(mat_day);
                this.changeCubeMap(env); // 큐브맵 변경 함수
                this.app.fire('CHANGE_COLOR', "DRL");
            }.bind(this));
            this.app.assets.load(this.app.assetMatMap["MAT_DAY"]); // 필수!
        }
    } else if (env === 'NIGHT') {
        if (this.app.assetMatMap["MAT_NIGHT"]) {
            this.app.assetMatMap["MAT_NIGHT"].ready(function (asset) {
                const mat_night = asset.resource;
                this.applyToDome(mat_night);
                this.changeCubeMap(env); // 큐브맵 변경 함수
                this.app.fire('CHANGE_COLOR', "ON");
            }.bind(this));
            this.app.assets.load(this.app.assetMatMap["MAT_NIGHT"]); // 필수!
        }
    }
}



BackgroundManager.prototype.applyToDome = function (material) {
    const domeEntity = this.app.dome.children[0];
    if (!domeEntity) return;

    const meshInstances = domeEntity.model
        ? domeEntity.model.meshInstances
        : domeEntity.render
            ? domeEntity.render.meshInstances
            : null;

    if (!meshInstances) return;

    meshInstances.forEach(function (mi) {
        mi.material = material;
    });
}