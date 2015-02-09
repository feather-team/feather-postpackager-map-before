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
    ret.feather.requires = ret.feather.requires || {};

    feather.util.map(ret.map.pkg || {}, function(key, pkg){
        var file = ret.pkg[ret.feather.uriMap[pkg.uri]];
        var requires = [];

        pkg.has.forEach(function(has){
        	var tmpFile = ret.ids[has];
            var tmpRequires = (tmpFile.isMod ? tmpFile.requires : tmpFile.extras.requires) || [];

            requires.push.apply(requires, tmpRequires);
        });

        file.extras.requires = requires;
    });

    feather.util.map(feather.util.merge(feather.util.merge({}, ret.src), ret.pkg), function(subpath, file){     
        if(file.isHtmlLike || file.isCssLike || file.isJsLike){
            var requires = [];

            //所有的mod文件，将自己的requires都转成extras.requires，防止被后面的deps收集到
            if(file.isMod && file.requires.length){
                file.extras.requires = file.requires;
                file.requires = [];
            }

            (file.extras.requires || []).forEach(function(require){
                var tmpFile = feather.file.wrap(require);

                if(tmpFile._isText && !(tmpFile.isCssLike || tmpFile.isJsLike || tmpFile.isJsonLike)) return;

                if(tmpFile.exists() && (tmpFile.isCssLike || tmpFile.isJsLike)){
                    require = tmpFile.subpath;
                }else{
                    require = getRealPath(require);
                }

                requires.push(require);
            });

            requires.forEach(function(require){
                if(!feather.util.isRemoteUrl(require) && !ret.feather.urlMap[require]){
                    feather.console.warn(file.subpath + ':require [' + require + '] is not exists!');
                }
            });

            if(requires.length){
                ret.feather.requires[subpath] = feather.util.unique(requires);
            }
        }
    });
};