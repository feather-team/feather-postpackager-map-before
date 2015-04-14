'use strict';

/*
分析页面静态资源
*/
function collectResource(ret, opt){
    var resource = {}, uriMap = ret.feather.uriMap, urlMap = ret.feather.urlMap;

    feather.util.map(ret.src, function(subpath, file){
        if(file.isHtmlLike){
            var rs = resource[subpath] = {};

            ['headJs', 'bottomJs', 'css'].forEach(function(type){
                (file.extras[type] || []).forEach(function(url, key){
                    if(!uriMap[url] && !urlMap[url] && !feather.util.isRemoteUrl(url)){
                        feather.console.warn(subpath + ':[' + url + '] is not exists!');
                    }

                    file.extras[type][key] = uriMap[url] || url;
                });

                rs[type] = feather.util.unique(file.extras[type]);
            });
        }
    });

    return resource;
}

/*
map.json转成
{
    url+md5+domain: subpath
}
格式

这种形式便于以后后端借助 map表生成静态资源，并对其进行更平滑的版本更新
*/
function getFeatherUriMap(ret, opt){
    var uriMap = {};
    var _ = feather.util.merge(feather.util.merge({}, ret.src), ret.pkg);

    feather.util.map(_, function(subpath, item){
        if(item.isJsLike || item.isCssLike){
            uriMap[item.getUrl(opt.md5, opt.domain)] = subpath;
        }
    });

    return uriMap;
}

/*
feather 使用的新MAP表，根据SUBPATH 获取任意版本url
*/
function getFeatherUrlMap(ret, opt){  
    var urlMap = {}, modulename = feather.config.get('project.modulename');
    var _ = feather.util.merge(feather.util.merge({}, ret.src), ret.pkg);

    feather.util.map(_, function(subpath, item){
        if(item.isCssLike || item.isJsLike || item.isHtmlLike){
            var obj = urlMap[subpath] = {
                moduleName: modulename
            };

            if(!item.isHtmlLike){
                obj.url = item.getUrl();
                obj.md5Url = item.getUrl(opt.md5);
                obj.domainUrl = item.getUrl(opt.md5, opt.domain);

                var map = ret.map.res[item.id];

                if(map){
                    if(map.pkg){
                        obj.pkg = ret.feather.uriMap[ret.map.pkg[map.pkg].uri];
                    }
                }else{
                    obj.isPkg = 1;
                }

                if(item.isMod){
                    obj.isMod = item.isMod;
                }

                if(item.isJsLike){
                    obj.isJsLike = item.isJsLike;
                }

                if(item.isCssLike){
                    obj.isCssLike = item.isCssLike;
                }
            }else{
                obj.isHtmlLike = item.isHtmlLike;

                if(item.isPageletLike){
                    obj.isPageletLike = item.isPageletLike;
                }
            }

            if(item.isComponentLike){
                obj.isComponentLike = item.isComponentLike;
            }
        }
    });

    return urlMap;
}

module.exports = function(ret, conf, setting, opt){
    var modulename = feather.config.get('project.modulename');

    if(!modulename || modulename == 'common'){
        //内置loadjs 直接生成
        ['feather.js', 'pagelet.js'].forEach(function(item){
            var file = feather.file.wrap(feather.project.getProjectPath() + '/static/' + item);
            var content = feather.util.read(__dirname + '/../vendor/js/' + item);

            if(item == 'feather.js'){
                var _file = feather.file.wrap(feather.project.getProjectPath() + '/static/feather.config.js');
                var _config = 'require.config=' + feather.util.json(feather.config.get('require.config'));
                content += ';' + _config;
            }

            if(opt.optimize){
                content = require('uglify-js').minify(content, {fromString: true}).code;
            }

            file.setContent(content);
            ret.pkg[file.subpath] = file;
            ret.map.res[file.id] = {
                uri: file.getUrl(opt.md5, opt.domain)
            };  
        });
    }

    ret.feather.commonResource = {bottomJs: [], css: []};

    if(feather.config.get('moduleLoader')){
        ret.feather.commonResource.headJs = ['/static/feather.js'];
    }

    opt.live && ret.feather.commonResource.bottomJs.push('http://127.0.0.1:8132/livereload.js');

    ret.feather.uriMap = feather.util.merge(ret.feather.uriMap || {}, getFeatherUriMap(ret, opt));
    ret.feather.urlMap = feather.util.merge(ret.feather.urlMap || {}, getFeatherUrlMap(ret, opt));
    ret.feather.resource = feather.util.merge(ret.feather.resource || {}, collectResource(ret, opt)); 
};
