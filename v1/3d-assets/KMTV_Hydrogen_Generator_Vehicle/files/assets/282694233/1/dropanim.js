var DropAnim = pc.createScript('dropAnim');

DropAnim.attributes.add('delay', { type: 'number', default: 0.3 });
DropAnim.attributes.add('height', { type: 'number', default: 3 });
DropAnim.attributes.add('duration', { type: 'number', default: 1.3 });
DropAnim.attributes.add('bounceHeight', { type: 'number', default: 0.05 });
DropAnim.attributes.add('bounceDuration', { type: 'number', default: 0.3 });

DropAnim.attributes.add('ghostEntity', {
    type: 'entity',
    title: 'Ghost Object'
});

DropAnim.attributes.add('ghostFadeSoftness', {
    type: 'number',
    default: 0.35,
    title: 'Ghost Fade Softness'
});

DropAnim.attributes.add('ghostMinOpacity', {
    type: 'number',
    default: 0,
    min: 0,
    max: 1,
    title: 'Ghost Min Opacity'
});

DropAnim.attributes.add('overlapStartOffset', {
    type: 'number',
    default: 0.1,
    title: 'Overlap Start Offset'
});

DropAnim.prototype.initialize = function () {
    this.targetPos = this.entity.getPosition().clone();

    this.startPos = this.targetPos.clone();
    this.startPos.y += this.height;

    this.entity.setPosition(this.startPos);

    this.wait = 0;
    this.t = 0;
    this.state = 0;

    this.ghostParts = [];
    this.ghostTopY = -999999;
    this.ghostBottomY = 999999;

    if (this.ghostEntity) {
        this.collectGhostParts(this.ghostEntity);
    }

    for (var i = 0; i < this.ghostParts.length; i++) {
        this.ghostParts[i].material.opacity = this.ghostParts[i].startOpacity;
        this.ghostParts[i].material.update();
    }

    console.log('ghostParts:', this.ghostParts.length, 'top:', this.ghostTopY, 'bottom:', this.ghostBottomY);
};

DropAnim.prototype.collectGhostParts = function (entity) {
    if (entity.render && entity.render.meshInstances) {
        for (var i = 0; i < entity.render.meshInstances.length; i++) {
            var mi = entity.render.meshInstances[i];
            var mat = mi.material;

            if (!mat) continue;

            var y = 0;

            if (mi.aabb && mi.aabb.center) {
                y = mi.aabb.center.y;
            } else {
                y = entity.getPosition().y;
                var parent = entity.parent;
                while (parent) {
                    y += parent.getPosition().y;
                    parent = parent.parent;
                }
            }

            this.ghostParts.push({
                material: mat,
                y: y,
                startOpacity: (mat.opacity !== undefined ? mat.opacity : 1)
            });

            if (y > this.ghostTopY) this.ghostTopY = y;
            if (y < this.ghostBottomY) this.ghostBottomY = y;
        }
    }

    if (entity.model && entity.model.meshInstances) {
        for (var j = 0; j < entity.model.meshInstances.length; j++) {
            var mi2 = entity.model.meshInstances[j];
            var mat2 = mi2.material;

            if (!mat2) continue;

            var y2 = 0;

            if (mi2.aabb && mi2.aabb.center) {
                y2 = mi2.aabb.center.y;
            } else {
                y2 = entity.getPosition().y;
                var parent2 = entity.parent;
                while (parent2) {
                    y2 += parent2.getPosition().y;
                    parent2 = parent2.parent;
                }
            }

            this.ghostParts.push({
                material: mat2,
                y: y2,
                startOpacity: (mat2.opacity !== undefined ? mat2.opacity : 1)
            });

            if (y2 > this.ghostTopY) this.ghostTopY = y2;
            if (y2 < this.ghostBottomY) this.ghostBottomY = y2;
        }
    }

    for (var k = 0; k < entity.children.length; k++) {
        this.collectGhostParts(entity.children[k]);
    }
};

DropAnim.prototype.updateGhostFadeByOverlap = function () {
    if (this.ghostParts.length === 0) return;

    var offsetY = this.entity.getPosition().y - this.targetPos.y;
    var colorBottomY = this.ghostBottomY + offsetY - this.overlapStartOffset;

    for (var i = 0; i < this.ghostParts.length; i++) {
        var part = this.ghostParts[i];

        var t = (part.y - colorBottomY) / this.ghostFadeSoftness;
        t = pc.math.clamp(t, 0, 1);

        var opacity = pc.math.lerp(part.startOpacity, this.ghostMinOpacity, t);

        part.material.opacity = opacity;
        part.material.update();
    }
};

DropAnim.prototype.update = function (dt) {
    if (this.state === 0) {
        this.wait += dt;

        if (this.wait >= this.delay) {
            this.state = 1;
            this.t = 0;
        }

        return;
    }

    if (this.state === 1) {
        this.t += dt;
        var a = this.t / this.duration;
        if (a > 1) a = 1;

        var pos = new pc.Vec3();
        pos.lerp(this.startPos, this.targetPos, a);
        this.entity.setPosition(pos);

        if (this.ghostEntity) {
            this.updateGhostFadeByOverlap();
        }

        if (a >= 1) {
            this.state = 2;
            this.t = 0;
        }

        return;
    }

    if (this.state === 2) {
        this.t += dt;

        var a2 = this.t / this.bounceDuration;

        if (a2 >= 1) {
            this.entity.setPosition(this.targetPos);
            this.state = 3;

            if (this.ghostEntity) {
                this.ghostEntity.enabled = false;
            }

            return;
        }

        var bounce = Math.sin(a2 * Math.PI) * this.bounceHeight;

        var pos2 = this.targetPos.clone();
        pos2.y += bounce;
        this.entity.setPosition(pos2);

        if (this.ghostEntity) {
            this.updateGhostFadeByOverlap();
        }
    }
};
// uncomment the swap method to enable hot-reloading for this script
// update the method body to copy state from the old instance
// DropAnim.prototype.swap = function(old) { };

// learn more about scripting here:
// https://developer.playcanvas.com/user-manual/scripting/