function checkFlash(){try {
            try {
                var axo = new ActiveXObject("ShockwaveFlash.ShockwaveFlash.6");
                try {
                    axo.AllowScriptAccess = "always"
                } 
                catch (e) {
                    return "6,0,0"
                }
            } 
            catch (e) {
            }
            return new ActiveXObject("ShockwaveFlash.ShockwaveFlash").GetVariable("$version").replace(/\D+/g, ",").match(/^,?(.+),?$/)[1]
        } 
        catch (e) {
            try {
				
                if (navigator.mimeTypes["application/x-shockwave-flash"].enabledPlugin) {
                    return (navigator.plugins["Shockwave Flash 2.0"] || navigator.plugins["Shockwave Flash"]).description.replace(/\D+/g, ",").match(/^,?(.+),?$/)[1]
                }
            } 
            catch (e) {
            }
        }
        return "0,0,0"
    }

	
		
	
		
