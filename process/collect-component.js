//收集所有的component

'use strict';

module.exports = function(ret){
    ret.feather.components = ret.feather.components || {};

    feather.util.map(ret.src, function(subpath, file){     
        if(file.isHtmlLike){
            var components = [];

            (file.extras.components || []).forEach(function(component){
                var file = feather.file.wrap(component);

                if(file._isText && !file.isJsonLike && !file.isCssLike && !file.isJsLike){
                    if(file.exists()){
                        components.push(file.subpath);
                    }else{
                        if(ret.feather.urlMap[component]){
                            components.push(component);
                        }else{
                            feather.console.warn(subpath + ':load component [' + component + '] is not exists!');
                        }
                    }
                }
            });
            
            if(components.length){
                ret.feather.components[subpath] = components;
            }
        }        
    });
};
