/*
如果image和css是同域，则去掉domain部分，1做大小优化，2解决有可能css和js为动态域名，css中的image一样会被替换成动态域名导致加载异常的情况
因csssprite为package时段处理，有可能会替换image的url，故postpackage处理该段内容
*/

var REG = /\/\*[\s\S]*?(?:\*\/|$)|(?:@import\s+)?\burl\s*\(\s*("(?:[^\\"\r\n\f]|\\[\s\S])*"|'(?:[^\\'\n\r\f]|\\[\s\S])*'|[^)}\s]+)\s*\)(\s*;?)/g;

module.exports = function(ret, conf, setting, opt){
	var sources = feather.util.merge(feather.util.merge({}, ret.src), ret.pkg);

	feather.util.map(sources, function(subpath, file){
		if(file.isCssLike && !file.isThird){
			file.getUrl(true, true);

			var domain = file.domain.replace(/\/+$/, ''), len = domain.length, content = file.getContent();

			content = content.replace(REG, function(all, url, last){
		        if(url){
		        	if(url.substring(0, len) == domain){
		        		url = url.substring(len);
		        	}

		            if(all.indexOf('@') === 0){
		                all = '@import url(' + url + ')' + last;
		            } else {
		               	all = 'url(' + url + ')' + last;
		            }
		        }

		        return all;
		    });

		    file.setContent(content);
		}
	});
};