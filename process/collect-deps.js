'use strict';

function getRealPath(path){
    if(feather.util.isRemoteUrl(path)) return path;

    var config = feather.config.get('require.config') || {}, baseurl = config.baseurl || '';

    (config.rules || []).forEach(function(item){
        path = path.replace(item[0], item[1]);  
    });

    if(baseurl && path[0] != '/'){
        path = baseurl + '/' + path;
    }
    
    return path.replace(/\/+/g, '/');
}

module.exports = function(ret){
    var deps = ret.feather.deps = ret.feather.deps || {}, async = ret.feather.async = ret.feather.async || {};

    // feather.util.map(ret.src, function(subpath, file){
    //     if(file.isJsLike && !file.isMod){
    //         file.requires.length = 0;

    //         (file.extras.deps || []).forEach(function(require){
    //             file.addRequire(require);
    //         });
    //     }
    // });

    feather.util.map(ret.map.pkg || {}, function(key, pkg){
        var file = ret.pkg[ret.feather.uriMap[pkg.uri]];
        var async = file.extras.async || [];

        if(file.isJsLike){
            file.requires.length = 0;

            pkg.has.forEach(function(has){
                var tmpFile = ret.ids[has];

                (tmpFile.extras.async || []).forEach(function(item){
                    async.push(item);
                });

                (tmpFile.requires || []).forEach(function(require){
                    file.addRequire(require);
                });
            });

            file.extras.async = feather.util.unique(async);
        }
    });

    feather.util.map(feather.util.merge(feather.util.merge({}, ret.src), ret.pkg), function(subpath, file){     
        if(file.isHtmlLike || file.isCssLike || file.isJsLike){
            var requires = [], asyncs = [];

            (file.requires || []).forEach(function(require){
                var tmpFile = feather.file.wrap(require);

                if(tmpFile._isText && !(tmpFile.isCssLike || tmpFile.isJsLike || tmpFile.isJsonLike)) return;

                if(tmpFile.exists() && (tmpFile.isCssLike || tmpFile.isJsLike)){
                    require = tmpFile.subpath;
                }else{
                    require = getRealPath(require);
                }

                requires.push(require);
            });

            if(requires.length){
                deps[subpath] = feather.util.unique(requires);
            }

            (file.extras.async || []).forEach(function(async){
                var tmpFile = feather.file.wrap(async);

                if(tmpFile._isText && !(tmpFile.isCssLike || tmpFile.isJsLike || tmpFile.isJsonLike)) return;

                if(tmpFile.exists() && (tmpFile.isCssLike || tmpFile.isJsLike)){
                    async = tmpFile.subpath;
                }else{
                    async = getRealPath(async);
                }

                asyncs.push(async);
            });

            if(asyncs.length){
                async[subpath] = feather.util.unique(asyncs);
            }
        }
    });
};
