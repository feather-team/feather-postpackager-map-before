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
    var deps = ret.feather.deps = ret.feather.deps || {};

    feather.util.map(ret.map.pkg || {}, function(key, pkg){
        var file = ret.pkg[ret.feather.uriMap[pkg.uri]];

        (pkg.deps || []).forEach(function(dep){
            file.addRequire(dep);
        });
    });

    feather.util.map(feather.util.merge(feather.util.merge({}, ret.src), ret.pkg), function(subpath, file){     
        if(file.isHtmlLike || file.isCssLike || file.isJsLike){
            var requires = [];

            (file.requires || []).forEach(function(require){
                var tmpFile = feather.file.wrap(require);

                if(tmpFile._isText && !(tmpFile.isCssLike || tmpFile.isJsLike || tmpFile.isJsonLike)) return;

                if(tmpFile.exists() && (tmpFile.isCssLike || tmpFile.isJsLike)){
                    require = tmpFile.subpath;
                }else{
                    require = getRealPath(require);
                }

                if(file.isJsLike && !file.isMod){
                    if(require.replace(/\.css$/, '.js') != subpath){
                        requires.push(require);
                    }
                }else{
                    requires.push(require);
                }
            });

            if(file.isHtmlLike){
                feather.util.map(ret.feather.resource[subpath], function(type, rs){
                    if(type == 'headJs' || type == 'bottomJs'){
                        requires.forEach(function(require){
                            var index = rs.indexOf(require);

                            if(index > -1){
                                rs.splice(index, 1);
                            }
                        });
                    }

                });
            }

            requires.forEach(function(require){
                if(!feather.util.isRemoteUrl(require) && !ret.feather.urlMap[require]){
                    feather.console.warn(file.subpath + ':require ' + require + ' is not exists!');
                }
            });

            if(requires.length){
                deps[subpath] = feather.util.unique(requires);
            }
        }
    });
};