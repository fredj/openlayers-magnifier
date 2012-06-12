/* Copyright (c) 2006-2011 by OpenLayers Contributors (see authors.txt for
 * full list of contributors). Published under the Clear BSD license.
 * See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */

/**
 * @requires OpenLayers/Control.js
 * @requires OpenLayers/Handler/Drag.js
 * @requires OpenLayers/Handler/MouseWheel.js
 * @requires OpenLayers/Map.js
 */

/**
 * Class: OpenLayers.Control.Magnifier
 *
 * Inerits from:
 *  - <OpenLayers.Control>
 */
OpenLayers.Control.Magnifier = OpenLayers.Class(OpenLayers.Control, {

    /**
     * Property: mmap
     * {<OpenLayers.Map>}
     */
    mmap: null,

    /**
     * APIProperty: draggable
     * {Boolean}
     */
    draggable: true,

    /**
     * APIProperty: zoomable
     * {Boolean}
     */
    zoomable: true,

    /**
     * APIProperty: delta
     * {Integer}
     */
    delta: 1,

    /**
     * APIProperty: followCursor
     * {Boolean}
     */
    followCursor: false,

    changelayer: function(evt) {
        // TODO: overkill, we know that we have only one layer (?)
        for (var i = 0, len = this.mmap.layers.length; i < len; i++) {
            this.mmap.removeLayer(this.mmap.layers[i]);
        }
        this.mmap.addLayer(evt.layer.clone());
    },

    draw: function(px) {
        OpenLayers.Control.prototype.draw.apply(this, arguments);
        this.factorDisplay = new OpenLayers.Control({
            displayClass: 'olMagnifierFactorDisplay'
        });
        this.mmap = new OpenLayers.Map(this.div, OpenLayers.Util.applyDefaults({
            controls: [this.factorDisplay],
            layers: [this.map.baseLayer.clone()],
            eventListeners: {
                zoomend: this.updateFactorDisplay,
                scope: this
            }
        }, this.map.initialOptions));

        this.handlers = this.handlers || {};
        if (this.draggable) {
            this.handlers.drag = new OpenLayers.Handler.Drag(this, {
                move: this.drag
            });
            this.handlers.drag.setMap(this.mmap);
            this.handlers.drag.activate();
        }

        if (this.zoomable) {
            this.handlers.wheel = new OpenLayers.Handler.MouseWheel(this, {
                up: this.zoom,
                down: this.zoom
            });
            this.handlers.wheel.setMap(this.mmap);
            this.handlers.wheel.activate();
        }

        this.map.events.on({
            move: this.update,
            changebaselayer: this.changelayer,
            scope: this
        });

        if (this.followCursor) {
            this.map.events.on({
                zoomend: this.update,
                mousemove: this.updateFromCursor,
                scope: this
            });
        }

        return this.div;
    },

    updateFactorDisplay: function() {
        var p = this.map.getResolution() / this.mmap.getResolution();
        this.factorDisplay.div.innerHTML = p + 'x';
    },

    zoom: function(evt, delta) {
        this.delta = Math.max(this.delta + delta, 0);
        this.mmap.zoomTo(this.map.getZoom() + this.delta);
    },

    drag: function(px) {
        var left = this.div.offsetLeft - (this.handlers.drag.start.x - px.x);
        var top = this.div.offsetTop - (this.handlers.drag.start.y - px.y);
        this.div.style.left = left + "px";
        this.div.style.top = top + "px";
        this.update();
    },

    update: function() {
        var px = {
            x: this.div.offsetLeft + (this.div.offsetWidth / 2),
            y: this.div.offsetTop + (this.div.offsetHeight / 2)
        };
        this.mmap.updateSize();
        this.mmap.moveTo(this.map.getLonLatFromPixel(px),
                         this.map.getZoom() + this.delta);
    },

    updateFromCursor: function(evt) {
        this.mmap.moveTo(this.map.getLonLatFromPixel(evt.xy),
                         this.map.getZoom() + this.delta);
    },

    destroy: function() {
        if (this.mmap) {
            this.mmap.destroy();
        }
        this.map.events.un({
            move: this.update,
            changebaselayer: this.changelayer,
            scope: this
        });

        if (this.followCursor) {
            this.map.events.un({
                zoomend: this.update,
                mousemove: this.updateFromCursor,
                scope: this
            });
        }
        OpenLayers.Control.prototype.destroy.apply(this, arguments);
    },

    CLASS_NAME: 'OpenLayers.Control.Magnifier'
});
