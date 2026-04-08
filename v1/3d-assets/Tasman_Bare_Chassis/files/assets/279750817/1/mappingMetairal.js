var MappingMetairal = pc.createScript('mappingMetairal');

MappingMetairal.prototype.initialize = function() {
    var renderComponents = this.app.root.findComponents('render');
    
    this.app.targetMeshInstances = []; 
    
    this.loadAssets();

    renderComponents.forEach(component => {
        component.meshInstances.forEach((meshInstance) => {
            let matName = meshInstance.material.name; 
            
            if (matName.endsWith("@")) {
                if (matName === "Mat_Camo_Pattern@") {
                    this.app.targetMeshInstances.push(meshInstance);
                }

                matName = matName.slice(0, -1);        
                const newMatAsset = this.app.matMap[matName];
                
                if (newMatAsset) {
                    meshInstance.material = newMatAsset.resource;
                    meshInstance.material.update();
                }
            }
        });
    });
};

MappingMetairal.prototype.loadAssets = function() {
    this.app.matMap = {};
    const assetMatList = this.app.assets.filter(asset => {
        return asset.type === "material";
    });

    for (const mat of assetMatList) {
        this.app.matMap[mat.name] = mat;
    }
};