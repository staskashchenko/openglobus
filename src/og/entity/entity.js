goog.provide('og.Entity');
goog.provide('og.entity');

goog.require('og.math.Vector3');
goog.require('og.Billboard');
goog.require('og.Label');
goog.require('og.LonLat');
goog.require('og.Extent');
goog.require('og.shape.Sphere');
goog.require('og.Polyline');
goog.require('og.PointCloud');
goog.require('og.Geometry');


/**
 * Entity instances aggregate multiple forms of visualization into a single high-level object.
 * They can be created manually and added to entity collection.
 *
 * @class
 * @param {Object} [options] - Entity options:
 * @param {string} [options.name] - A human readable name to display to users. It does not have to be unique.
 * @param {og.math.Vector3|Array.<number>} [options.cartesian] - Spatial entities like billboard, label, sphere etc. cartesian position.
 * @param {og.LonLat} [options.lonlat] - Geodetic coordiantes for an entities like billboard, label, sphere etc.
 * @param {boolean} [options.aground] - True for entities that have to be placed on the relief.
 * @param {boolean} [options.visibility] - Entity visibility.
 * @param {*} [options.billboard] - Billboard options(see {@link og.Billboard}).
 * @param {*} [options.label] - Label options(see {@link og.Label}).
 * @param {*} [options.sphere] - Sphere options(see {@link og.shape.Sphere}).
 * @param {*} [options.box] - Sphere options(see {@link og.shape.Box}).
 * @param {*} [options.Polyline] - Polyline options(see {@link og.Polyline}).
 * @param {*} [options.pointCloud] - Point cloud options(see {@link og.PointCloud}).
 * @param {*} [options.geometry] - Geometry options (see {@link og.Geometry}), available for vector layer only.
 * @param {Object} [properties] - Entity custom properties.
 */
og.Entity = function (options, properties) {

    options = options || {};

    /**
     * Unic identifier.
     * @public
     * @readonly
     */
    this.id = og.Entity.__staticCounter++;

    /**
     * Entity user defined properties.
     * @public
     * @type {Object}
     */
    this.properties = properties || {};

    /**
     * Entity name.
     * @public
     * @type {string}
     */
    this.properties.name = this.properties.name || "noname";

    /**
     * Children entities.
     * @public
     * @type {Array.<og.Entity>}
     */
    this.childrenNodes = [];

    /**
     * Parent entity.
     * @public
     * @type {og.Entity}
     */
    this.parent = null;

    /**
     * Entity cartesian position.
     * @protected
     * @type {og.math.Vector3}
     */
    this._cartesian = og.utils.createVector3(options.cartesian);

    /**
     * Geodetic entity coordiantes.
     * @protected
     * @type {og.LonLat}
     */
    this._lonlat = og.utils.createLonLat(options.lonlat);

    /**
     * World Mercator entity coordinates.
     * @protected
     * @type {og.LonLat}
     */
    this._lonlatMerc = null;

    /**
     * Entity visible terrain altitude.
     * @protected
     * @type {number}
     */
    this._altitude = options.altitude || 0.0;

    /**
     * Visibility flag.
     * @protected
     * @type {boolean}
     */
    this._visibility = options.visibility != undefined ? options.visibility : true;

    /**
     * Entity collection that this entity belongs to.
     * @protected
     * @type {og.EntityCollection}
     */
    this._entityCollection = null;

    /**
     * Entity collection array store index.
     * @protected
     * @type {number}
     */
    this._entityCollectionIndex = -1;

    /**
     * Assigned vector layer pointer.
     * @protected
     * @type {og.layer.Vector}
     */
    this._vectorLayer = null;

    /**
     * Assigned vector layer entity array index.
     * @protected
     * @type {number}
     */
    this._vectorLayerIndex = -1;

    /**
     * Picking color.
     * @protected
     * @type {og.math.Vector3}
     */
    this._pickingColor = new og.math.Vector3(0, 0, 0);

    this._featureConstructorArray = {
        "billboard": [og.Billboard, this.setBillboard],
        "label": [og.Label, this.setLabel],
        "sphere": [og.shape.Sphere, this.setShape],
        "box": [og.shape.Box, this.setShape],
        "polyline": [og.Polyline, this.setPolyline],
        "pointCloud": [og.PointCloud, this.setPointCloud],
        "geometry": [og.Geometry, this.setGeometry],
    };

    /**
     * Billboard entity.
     * @public
     * @type {og.Billboard}
     */
    this.billboard = this._createOptionFeature('billboard', options.billboard);

    /**
     * Text label entity.
     * @public
     * @type {og.Label}
     */
    this.label = this._createOptionFeature('label', options.label);

    /**
     * Shape entity.
     * @public
     * @type {og.shape.BaseShape}
     */
    this.shape = this._createOptionFeature('sphere', options.sphere || options.box);

    /**
     * Polyline entity.
     * @public
     * @type {og.Polyline}
     */
    this.polyline = this._createOptionFeature('polyline', options.polyline);

    /**
     * PointCloud entity.
     * @public
     * @type {og.PointCloud}
     */
    this.pointCloud = this._createOptionFeature('pointCloud', options.pointCloud);

    /**
     * Geometry entity(available only for vector layer).
     * @public
     * @type {og.Geometry}
     */
    this.geometry = this._createOptionFeature('geometry', options.geometry);


    //this.model = null;
    //...
};

/**
 * Instantiates an og.Entity object.
 * @function
 * @param {Object} [options] - Entity options:
 * @param {string} [options.name] - A human readable name to display to users. It does not have to be unique.
 * @param {og.math.Vector3|Array.<number>} [options.cartesian] - Spatial entities like billboard, lanel, sphere etc. cartesian position.
 * @param {og.LonLat} [options.lonlat] - Geidetic coordiantes for an entities like billboard, lanel, sphere etc. cartesian position.
 * @param {boolean} [options.aground] - Geodetic type entity replaces over a relief.
 * @param {boolean} [options.visibility] - Entity visibility.
 * @param {*} [options.billboard] - Billboard options.
 * @param {*} [options.label] - Label options.
 * @param {*} [options.polyline] - polyline options.
 * @param {*} [options.sphere] - Sphere shape options.
 * @param {*} [options.box] - Box shape options.
 * @param {*} [options.pointCloud] - Point cloud options.
 * @param {*} [options.geometry] - Geometry options (see {@link og.Geometry}), available for vector layer only.
 * @param {*} [properties] - Entity custom properties.
 */
og.entity = function (options, properties) {
    return new og.Entity(options, properties);
};

og.Entity.__staticCounter = 0;

og.Entity.prototype._createOptionFeature = function (featureName, options) {
    if (options) {
        var c = this._featureConstructorArray[featureName];
        return c[1].call(this, new c[0](options));
    }
    return null;
};

/**
 * Adds current entity into the specified entity collection.
 * @public
 * @param {og.EntityCollection|og.layer.Vector} collection - Specified entity collection or vector layer.
 * @param {Boolean} [rightNow=false] - Entity insertion option for vector layer.
 */
og.Entity.prototype.addTo = function (collection, rightNow) {
    collection.add(this, rightNow);
    return this;
};

/**
 * Removes current entity from collection and layer.
 * @public
 */
og.Entity.prototype.remove = function () {
    this._vectorLayer && this._vectorLayer.removeEntity(this);
    this._entityCollection && this._entityCollection.removeEntity(this);
};

/**
 * Sets the entity visibility.
 * @public
 * @param {boolean} visibilty - Entity visibility.
 */
og.Entity.prototype.setVisibility = function (visibility) {
    this._visibility = visibility;

    //billboards
    this.billboard && this.billboard.setVisibility(visibility);

    //labels
    this.label && this.label.setVisibility(visibility);

    //shape
    this.shape && this.shape.setVisibility(visibility);

    //polyline
    this.polyline && this.polyline.setVisibility(visibility);

    //geometry
    this.geometry && this.geometry.setVisibility(visibility);

    for (var i = 0; i < this.childrenNodes.length; i++) {
        this.childrenNodes[i].setVisibility(visibility);
    }
};

/**
 * Returns entity visibility.
 * @public
 * @returns {boolean}
 */
og.Entity.prototype.getVisibility = function () {
    return this._visibility;
};

/**
 * Sets entity cartesian position.
 * @public
 * @param {og.math.Vector3} position - Cartesian position in 3d space.
 */
og.Entity.prototype.setCartesian3v = function (cartesian) {
    this.setCartesian(cartesian.x, cartesian.y, cartesian.z);
};

/**
 * Sets entity cartesian position.
 * @public
 * @param {number} x - 3d space X - position.
 * @param {number} y - 3d space Y - position.
 * @param {number} z - 3d space Z - position.
 */
og.Entity.prototype.setCartesian = function (x, y, z) {

    var p = this._cartesian;

    p.x = x;
    p.y = y;
    p.z = z;

    //billboards
    this.billboard && this.billboard.setPosition3v(p);

    //labels
    this.label && this.label.setPosition3v(p);

    //shape
    this.shape && this.shape.setPosition3v(p);

    for (var i = 0; i < this.childrenNodes.length; i++) {
        this.childrenNodes[i].setCartesian(x, y, z);
    }

    var ec = this._entityCollection;

    if (ec && ec.renderNode && ec.renderNode.ellipsoid) {

        this._lonlat = ec.renderNode.ellipsoid.cartesianToLonLat(p);
        
        if (Math.abs(this._lonlat.lat) < og.mercator.MAX_LAT) {
            this._lonlatMerc = this._lonlat.forwardMercator();
        } else {
            this._lonlatMerc = null;
        }
    }

    ec && ec.events.dispatch(ec.events.entitymove, this);
};

/**
 * Sets entity cartesian position without moveentity event dispatching.
 * @protected
 * @param {og.math.Vector3} position - Cartesian position in 3d space.
 */
og.Entity.prototype._setCartesian3vSilent = function (cartesian) {

    var p = this._cartesian;

    p.x = cartesian.x;
    p.y = cartesian.y;
    p.z = cartesian.z;

    //billboards
    this.billboard && this.billboard.setPosition3v(p);

    //labels
    this.label && this.label.setPosition3v(p);

    //shape
    this.shape && this.shape.setPosition3v(p);

    for (var i = 0; i < this.childrenNodes.length; i++) {
        this.childrenNodes[i].setCartesian(x, y, z);
    }
};

/**
 * Gets entity geodetic coordinates.
 * @public
 * @returns {og.LonLat}
 */
og.Entity.prototype.getLonLat = function () {
    return this._lonlat.clone();
};

/**
 * Sets geodetic coordinates of the entity point object.
 * @public
 * @param {og.LonLat} lonlat - WGS84 coordinates.
 */
og.Entity.prototype.setLonLat = function (lonlat) {
    var l = this._lonlat;

    l.lon = lonlat.lon;
    l.lat = lonlat.lat;
    l.height = lonlat.height;

    var ec = this._entityCollection;
    if (ec && ec.renderNode && ec.renderNode.ellipsoid) {

        if (Math.abs(lonlat.lat) < og.mercator.MAX_LAT) {
            this._lonlatMerc = lonlat.forwardMercator();
        } else {
            this._lonlatMerc = null;
        }

        this._cartesian = ec.renderNode.ellipsoid.lonLatToCartesian(lonlat);
        this.setCartesian3v(this._cartesian);
    }
};

/**
 * Sets entity altitude over the planet.
 * @public
 * @param {number} altitude - Altitude.
 */
og.Entity.prototype.setAltitude = function (altitude) {
    this._altitude = altitude;
};

/**
 * Returns carteain position.
 * @public
 * @returns {og.math.Vector3}
 */
og.Entity.prototype.getCartesian = function () {
    return this._cartesian;
};

/**
 * Sets entity billboard.
 * @public
 * @param {og.Billboard} billboard - Billboard image.
 */
og.Entity.prototype.setBillboard = function (billboard) {
    if (this.billboard) {
        this.billboard.remove();
    }
    this.billboard = billboard;
    this.billboard._entity = this;
    this.billboard.setPosition3v(this._cartesian);
    this.billboard.setVisibility(this._visibility);
    this._entityCollection && this._entityCollection._billboardHandler.add(billboard);
    return billboard;
};

/**
 * Sets entity label.
 * @public
 * @param {og.Label} label - Text label.
 */
og.Entity.prototype.setLabel = function (label) {
    if (this.label) {
        this.label.remove();
    }
    this.label = label;
    this.label._entity = this;
    this.label.setPosition3v(this._cartesian);
    this.label.setVisibility(this._visibility);
    this._entityCollection && this._entityCollection._labelHandler.add(label);
    return label;
};

/**
 * Sets entity shape.
 * @public
 * @param {og.BaseShape} shape - Shape object.
 */
og.Entity.prototype.setShape = function (shape) {
    if (this.shape) {
        this.shape.remove();
    }
    this.shape = shape;
    this.shape._entity = this;
    this.shape.setPosition3v(this._cartesian);
    this.shape.setVisibility(this._visibility);
    this._entityCollection && this._entityCollection._shapeHandler.add(shape);
    return shape;
};

/**
 * Sets entity polyline.
 * @public
 * @param {og.Polyline} polyline - Polyline object.
 */
og.Entity.prototype.setPolyline = function (polyline) {
    if (this.polyline) {
        this.polyline.remove();
    }
    this.polyline = polyline;
    this.polyline._entity = this;
    this.polyline.setVisibility(this._visibility);
    this._entityCollection && this._entityCollection._polylineHandler.add(polyline);
    return polyline;
};

/**
 * Sets entity pointCloud.
 * @public
 * @param {og.PointCloud} pointCLoud - PointCloud object.
 */
og.Entity.prototype.setPointCloud = function (pointCloud) {
    if (this.pointCloud) {
        this.pointCloud.remove();
    }
    this.pointCloud = pointCloud;
    this.pointCloud._entity = this;
    this.pointCloud.setVisibility(this._visibility);
    this._entityCollection && this._entityCollection._pointCloudHandler.add(pointCloud);
    return pointCloud;
};

/**
 * Sets entity geometry.
 * @public
 * @param {og.Geometry} geometry - Geometry object.
 */
og.Entity.prototype.setGeometry = function (geometry) {
    if (this.geometry) {
        this.geometry.remove();
    }
    this.geometry = geometry;
    this.geometry._entity = this;
    this.geometry.setVisibility(this._visibility);
    this._vectorLayer && this._vectorLayer.add(this);
    return geometry;
};

/**
 * Append child entity.
 * @public
 * @param {og.Entity} entity - Child entity.
 */
og.Entity.prototype.appendChild = function (entity) {
    entity._entityCollection = this._entityCollection;
    entity._pickingColor = this._pickingColor;
    entity.parent = this;
    this.childrenNodes.push(entity);
    this._entityCollection && this._entityCollection._addRecursively(entity);
};

/**
 * Appends entity items(billboard, label etc.) picking color.
 * @public
 */
og.Entity.prototype.setPickingColor = function () {

    var c = this._pickingColor;

    //billboard
    this.billboard && this.billboard.setPickingColor3v(c);

    //label
    this.label && this.label.setPickingColor3v(c);

    //shape
    this.shape && this.shape.setPickingColor3v(c);

    //polyline
    this.polyline && this.polyline.setPickingColor3v(c);

    for (var i = 0; i < this.childrenNodes.length; i++) {
        this.childrenNodes[i].setPickingColor();
    }
};

/**
 * Return geodethic extent.
 * @returns {og.Extent}
 */
og.Entity.prototype.getExtent = function () {
    var res;
    var c = this._lonlat;
    if (this.billboard || this.label) {
        res = new og.Extent(new og.LonLat(c.lon, c.lat), new og.LonLat(c.lon, c.lat));
    } else {
        res = new og.Extent(new og.LonLat(180.0, 90.0), new og.LonLat(-180.0, -90.0));
    }

    var sw = res.southWest,
        ne = res.northEast;

    if (this.polyline) {
        var e = this.polyline.getExtent();
        if (e.southWest.lon < sw.lon) sw.lon = e.southWest.lon;
        if (e.southWest.lat < sw.lat) sw.lat = e.southWest.lat;
        if (e.northEast.lon > ne.lon) ne.lon = e.northEast.lon;
        if (e.northEast.lat > ne.lat) ne.lat = e.northEast.lat;
    }

    if (this.geometry) {
        var e = this.geometry.getExtent();
        if (e.southWest.lon < sw.lon) sw.lon = e.southWest.lon;
        if (e.southWest.lat < sw.lat) sw.lat = e.southWest.lat;
        if (e.northEast.lon > ne.lon) ne.lon = e.northEast.lon;
        if (e.northEast.lat > ne.lat) ne.lat = e.northEast.lat;
    }

    for (var i = 0; i < this.childrenNodes.length; i++) {
        var e = this.childrenNodes[i].getExtent();
        if (e.southWest.lon < sw.lon) sw.lon = e.southWest.lon;
        if (e.southWest.lat < sw.lat) sw.lat = e.southWest.lat;
        if (e.northEast.lon > ne.lon) ne.lon = e.northEast.lon;
        if (e.northEast.lat > ne.lat) ne.lat = e.northEast.lat;
    }

    return res;
};
