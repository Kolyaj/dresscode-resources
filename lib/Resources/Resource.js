Resources.Resource = Bricks.inherit({
    constructor: function(mime, data) {
        this._mime = mime;
        this._data = data;
    },

    toString: function() {
        return this._data;
    },

    datauri: function(tpl) {
        var uri = 'data:' + this._mime + ';base64,' + this._data;
        return tpl ? tpl.replace('%s', uri) : uri;
    }
});
