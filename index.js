'use strict';

module.exports = function(ret, conf, setting, opt){
    var commonMap = {}, modulename = feather.config.get('project.modulename'), ns = feather.config.get('project.ns');

    //查找是否有common模块
    if(modulename && modulename != 'common'){
        var root = feather.project.getTempPath() + '/release/' + feather.config.get('project.ns') + '/common.json';

        if(feather.util.exists(root)){
            commonMap = feather.util.readJSON(root);
        }
    }

    ret.feather = commonMap;

    //process start
    var process = ['collect-resource', 'collect-deps', 'clean-same-domain-incss'];

    if(!feather.config.get('inlineMode')){
        //非inline模式
        process.push('collect-component');
        process.push('static-position');
    }

    process.forEach(function(process){
        require('./process/' + process + '.js')(ret, conf, setting, opt); 
    });
};