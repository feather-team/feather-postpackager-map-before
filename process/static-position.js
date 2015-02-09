module.exports = function(ret, conf, setting, opt){
    var suffix = '.' + feather.config.get('template.suffix');

    feather.util.map(ret.src, function(subpath, file){    
        var file = ret.src[subpath];

        if(file && file.isHtmlLike){
            var content = file.getContent(), debug = opt.dest == 'preview';

            if(file.isPageletLike){
                content = [
                    "<!--FEATHER STATIC POSITION:HEAD-->",
                    "<?php ", 
                    "$this->load('/component/resource/usestyle" + suffix + "', $this->get('FEATHER_USE_STYLES'));",
                    "$this->load('/component/resource/usescript" + suffix + "', $this->get('FEATHER_USE_HEAD_SCRIPTS'));?>",
                    "<!--FEATHER STATIC POSITION END-->",
                ].join("") + content  + "<!--FEATHER STATIC POSITION:BOTTOM--><?php $this->load('/component/resource/usescript" + suffix + "', $this->get('FEATHER_USE_BOTTOM_SCRIPTS'));?><!--FEATHER STATIC POSITION END-->";
            }else{
                content = content.replace(/<\/head>/i, function(){
                    return [
                        "<!--FEATHER STATIC POSITION:HEAD--><?php ", 
                        debug ? "if(!$this->get('FEATHER_HEAD_RESOURCE_LOADED')){" : "",
                        "$this->load('/component/resource/usestyle" + suffix + "', $this->get('FEATHER_USE_STYLES'));",
                        "$this->load('/component/resource/usescript" + suffix + "', $this->get('FEATHER_USE_HEAD_SCRIPTS'));",
                        debug ? "}" : "",
                        "?><!--FEATHER STATIC POSITION END-->",
                        "</head>"
                    ].join("");
                }).replace(/<\/body>/i, function(){
                    return [
                        "<!--FEATHER STATIC POSITION:BOTTOM--><?php " + (debug ? " if(!$this->get('FEATHER_BOTTOM_RESOURCE_LOADED')){" : ""),
                        "$this->load('/component/resource/usescript" + suffix + "', $this->get('FEATHER_USE_BOTTOM_SCRIPTS'));" + (debug ? "}" : "") + "?>",
                        "<!--FEATHER STATIC POSITION END--></body>"
                    ].join("");
                });
            }

            file.setContent(content);
        }
    });
};