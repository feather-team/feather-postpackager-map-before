'use strict';

module.exports = function(ret){
    var deps = ret.feather.deps = ret.feather.deps || {};

    feather.util.map(ret.map.pkg || {}, function(key, pkg){
        var file = ret.pkg[ret.feather.uriMap[pkg.uri]];
        var deps = [];

        pkg.has.forEach(function(has){
            var tmpFile = ret.ids[has];
            var tmpRequires = tmpFile.requires;

            deps.push.apply(deps, tmpRequires);

            tmpFile.requires.forEach(function(require){
                file.addRequire(require);
            });
        });
    });

    feather.util.map(feather.util.merge(feather.util.merge({}, ret.src), ret.pkg), function(subpath, file){     
        if(file.isCssLike || file.isJsLike){
            var requires = [];

            (file.requires || []).forEach(function(require){
                var tmpFile = feather.file.wrap(require);

                if(tmpFile._isText && !(tmpFile.isCssLike || tmpFile.isJsLike || tmpFile.isJsonLike)) return;

                if(tmpFile.exists() && (tmpFile.isCssLike || tmpFile.isJsLike)){
                    require = tmpFile.subpath;
                }else{
                    require = require;
                }

                requires.push(require);
            });

            if(requires.length){
                deps[subpath] = feather.util.unique(requires);
            }
        }
    });
};
