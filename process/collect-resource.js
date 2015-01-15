'use strict';

var RESOURCE_REG = /[\r\n]*(?:<!--[\s\S]*?-->|<script([^>]*?src=(['"])((?:<\?[\s\S]+?\?>)?.+?)\2[\s\S]*?)>\s*<\/script>|<link([^>]*?href=(['"])((?:<\?[\s\S]+?\?>)?.+?)\5[\s\S]*?)>)[\r\n]*/ig;
var FIXED = /\b(?:feather-position|data|data-position)-fixed\b/i, HEAD = /\b(?:feather-position|data|data-position)-head\b/i, BOTTOM = /\b(?:feather-position|data|data-position)-bottom\b/i, DESTIGNORE = /\b(?:feather-position|data|data-position)-ignore\b/i;
var ISCSS = /rel=["']?stylesheet['"]?/i;

var unique = feather.util.unique;

/*
分析页面静态资源
*/
function analyseResource(ret, opt){
    var resource = {}, uriMap = ret.feather.uriMap, urlMap = ret.feather.urlMap;

    feather.util.map(ret.src, function(subpath, file){
        if(file.isHtmlLike){
            var headJs = [], bottomJs = [], css = [], content = file.getContent();

            content = content.replace(RESOURCE_REG, function(_0, _1, _2, _3, _4, _5, _6){
                //如果是fixed 跳过
                if(_1 && !FIXED.test(_1)){
                    if(opt.dest != 'preview'){
                        if(DESTIGNORE.test(_1)) return '';
                    }

                    if(!uriMap[_3] && !urlMap[_3] && !feather.util.isRemoteUrl(_3)){
                        feather.console.warn(subpath + ':' + _3 + ' is not exists!');
                    }

                    //头部js
                    if(HEAD.test(_1)){
                        headJs.push(uriMap[_3] || _3);
                    }else{
                        //尾部js
                        bottomJs.push(uriMap[_3] || _3);
                    }

                    return '';
                }else if(_4 && !FIXED.test(_4) && ISCSS.test(_4)){
                    if(opt.dest != 'preview'){
                        if(DESTIGNORE.test(_4)) return '';
                    }

                    if(!uriMap[_6] && !urlMap[_6] && !feather.util.isRemoteUrl(_6)){
                        feather.console.warn(subpath + ':' + _6 + ' is not exists!');
                    }

                    //css
                    css.push(uriMap[_6] || _6);
                    return '';
                }

                return _0;
            });

            file.setContent(content);

            var rs = resource[subpath] = {};

            if(headJs.length){
                rs.headJs = unique(headJs);
            }

            if(bottomJs.length){
                rs.bottomJs = unique(bottomJs);
            }

            if(css.length){
                rs.css = unique(css);
            }
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
function getPaffeUriMap(ret, opt){
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
function getPaffeUrlMap(ret, opt){  
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

            if(opt.optimize){
                content = require('uglify-js').minify(content, {fromString: true}).code;
            }

            file.setContent(content);
            ret.pkg[file.subpath] = file;
            ret.map.res[file.id] = {
                uri: file.getUrl(opt.md5, opt.domain)
            };  
        });

        var file = feather.file.wrap(feather.project.getProjectPath() + '/static/feather.config.js');
        var config = feather.config.get('require.config');
        var content = require('uglify-js').minify('require.config=' + feather.util.json(config), {fromString: true}).code;

        file.setContent(content);
        ret.pkg[file.subpath] = file;
        ret.map.res[file.id] = {
            uri: file.getUrl(opt.md5, opt.domain)
        };
    }

    ret.feather.commonResource = {headJs: ['/static/feather.js', '/static/feather.config.js'], bottomJs: [], css: []};
    opt.live && ret.feather.commonResource.bottomJs.push('http://127.0.0.1:8132/livereload.js');

    ret.feather.uriMap = feather.util.merge(ret.feather.uriMap || {}, getPaffeUriMap(ret, opt));
    ret.feather.urlMap = feather.util.merge(ret.feather.urlMap || {}, getPaffeUrlMap(ret, opt));
    ret.feather.resource = feather.util.merge(ret.feather.resource || {}, analyseResource(ret, opt)); 
};