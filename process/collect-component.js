//收集所有的component

'use strict';

module.exports = function(ret){
    var components = ret.feather.components = ret.feather.components || {};

    feather.util.map(ret.src, function(subpath, file){     
        if(file.isHtmlLike){
            var requires = [];

            (file.requires || []).forEach(function(require){
                var file = feather.file.wrap(require);

                if(file._isText && !file.isJsonLike && !file.isCssLike && !file.isJsLike){
                    if(file.exists()){
                        requires.push(file.subpath);
                    }else{
                        if(ret.feather.urlMap[require]){
                            requires.push(require);
                        }else{
                            feather.console.warn(subpath + ':load ' + require + ' is not exists!');
                        }
                    }
                }
            });
            
            if(requires.length){
                components[subpath] = requires;
            }
        }        
    });
};