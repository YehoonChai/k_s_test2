var MappingMetairal = pc.createScript('mappingMetairal');

MappingMetairal.prototype.initialize = function () {
    // material name -> material asset
    this.app.matMap = {};

    // 1. 모든 material asset 수집
    this.collectMaterialAssets();

    // 2. 모델/렌더 에셋 로드 완료 후 적용
    this.bindRenderAssets();
};

/**
 * 모든 material asset을 수집해서 map 생성
 */
MappingMetairal.prototype.collectMaterialAssets = function () {
    const materials = this.app.assets.filter(a => a.type === 'material');

    materials.forEach(asset => {
        if (asset.resource) {
            this.app.matMap[asset.name] = asset;
        } else {
            asset.ready(() => {
                this.app.matMap[asset.name] = asset;
            });
            this.app.assets.load(asset);
        }
    });
};

/**
 * Render / Model 컴포넌트의 asset 로딩을 기다렸다가 material 적용
 */
MappingMetairal.prototype.bindRenderAssets = function () {
    const renders = this.entity.findComponents('render');
    const models  = this.entity.findComponents('model');

    // Render Component
    renders.forEach(render => {
        if (!render.asset) return;

        const asset = this.app.assets.get(render.asset);
        asset.ready(() => {
            this.applyMaterials(render.meshInstances);
        });
        this.app.assets.load(asset);
    });

    // Model Component (구버전 대응)
    models.forEach(model => {
        if (!model.asset) return;

        const asset = this.app.assets.get(model.asset);
        asset.ready(() => {
            this.applyMaterials(model.meshInstances);
        });
        this.app.assets.load(asset);
    });
};

/**
 * meshInstance들의 material 교체
 */
MappingMetairal.prototype.applyMaterials = function (meshInstances) {
    if (!meshInstances) return;

    meshInstances.forEach(mi => {
        const mat = mi.material;
        if (!mat || !mat.name) return;

        if (mat.name.endsWith('@')) {
            const baseName = mat.name.slice(0, -1);
            const matAsset = this.app.matMap[baseName];

            if (matAsset && matAsset.resource) {
                mi.material = matAsset.resource;
                mi.material.update();
            }
        }
    });
};
