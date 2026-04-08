var InitScene = pc.createScript('initScene');

// initialize code called once per entity
InitScene.prototype.initialize = function() {
    this.searchAll();
};

InitScene.prototype.searchAll = function() {
    for (let c of this.entity.children) {
        if (c.name === "Button") {
            this.loadButtons(c)
        } else if (c.name === "ScrollView") {
            this.loadScrollViews(c)
        } else if (c.name === "CarEntity") {{
            this.loadCarEntity(c)
        }}
    }
    // this.loadEntitys();
    this.loadAssets();
}

// 에디터에서 자동차 모델 엔티티들을 불러오는 함수
InitScene.prototype.loadEntitys = function() {
    this.app.entityList = []
    for (let parts of this.app.extEntity.children) {
        for (let part of parts.children) {
            this.app.entityList.push(part)
        }
    }
}

InitScene.prototype.loadAssets = function() {
    this.app.entMatMap = {}

    const assetMatList = this.app.assets.filter(asset => {
        return asset.type === "material" || asset.type === "cubemap" || asset.type === "container"
    })

    this.app.assetMatMap = {}
    for (const mat of assetMatList) {
        if (mat.type === "cubemap") {
            if (mat.name === "DAY_cubemap.png") {
                this.app.assetMatMap["DAY_cubemap"] = mat
            } else if (mat.name === "NIGHT_cubemap.png") {
                this.app.assetMatMap["NIGHT_cubemap"] = mat
            } else if (mat.name === "BLACKLINE_cubemap.png") {
                this.app.assetMatMap["BLACKLINE_cubemap"] = mat
            }
            continue
        } else if (mat.type === "container" && mat.name.endsWith(".glb")) {
            if(mat.name.endsWith("EXT.glb")) {
                this.app.extAsset = mat
            } else if (mat.name.endsWith("DUMMY.glb")) {
                this.app.dummyAsset = mat
            }
        }
        if (mat.name.endsWith("_DOME")) {
            var matName = mat.name.slice(0,-5)
            this.app.assetMatMap[matName] = mat
            continue
        }
        var matName = mat.name
        this.app.assetMatMap[matName] = mat
    }

    for (const rootNode of this.app.entityList) {
        this.nodeDFS(rootNode);
    }

    this.nodeDFS(this.app.dummyEntity);
};

InitScene.prototype.loadButtons = function(buttonEntity) {
    const buttonMap = {
        "prevModelButton": "prevModelButton",
        "prevColorButton": "prevColorButton",
        "nextModelButton": "nextModelButton",
        "nextColorButton": "nextColorButton",
        "modelNameButton": "modelNameButton",
        "colorNameButton": "colorNameButton",
        "fscButton": "fscButton",
        "colorText" : "colorText",
        "bg": "bg",
    };

    for (let child of buttonEntity.children) {
        const name = child.name;
        if (buttonMap[name]) {
            this.app[buttonMap[name]] = child;
        }
    }
}

InitScene.prototype.loadScrollViews = function(scrollEntity) { 
    scrollMap = {
        "modelScrollView": "modelScrollView",
        "colorScrollView": "colorScrollView",
        "inputText" : "inputText",
        "lineX" : "lineX",
        "lineY" : "lineY",
    }
    for (let child of scrollEntity.children) {
        const name = child.name;
        if (scrollMap[name]) {
            this.app[scrollMap[name]] = child;
        }
    }
}

InitScene.prototype.loadCarEntity = function(carEntity) {
    for (let c of carEntity.children) {
        if (c.name.endsWith("_EXT")) {
            this.app.extEntity = c
        } else if (c.name.endsWith("_DUMMY")) {
            this.app.dummyEntity = c
        } else if (c.name === "WhiteStudio") {
            this.app.dome = c
        } else if (c.name.endsWith("_PIVOT")) {
            this.app.focusEntity = c.children[0]
        }
    }
}

InitScene.prototype.nodeDFS = function(node) {
    for (const child of node.children) {
        if (child.render && child.render.material) {
            let matName = child.render.material.name;
            if (matName.endsWith("@")) {
                matName = matName.slice(0, -1);
            }

            if (Object.keys(this.app.assetMatMap).includes(matName)) {
                child.render.material.copy(this.app.assetMatMap[matName].resource);
                child.render.material.update();
            }

            if (!this.app.entMatMap[matName]) {
                this.app.entMatMap[matName] = [];
            }

            if (!this.app.entMatMap[matName].includes(child)) {
                this.app.entMatMap[matName].push(child);
            }
        }
        this.nodeDFS(child); 
    }
};