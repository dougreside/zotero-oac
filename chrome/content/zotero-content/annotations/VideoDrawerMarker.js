var tm = null, ui = null, oldAnnos = null;
var allShapes = [];
var annoMode = false;
oldAudio = null;
var selTime = null;
var links = [];
var moments = null;
var allTimes = {
    "moments": []
};
var curTime = 0;
var selShape = null;
var overVideo = false;
// Event to trigger for XUL radio object to switch to movie mode
var element = document.createElement("eventElem");
document.documentElement.appendChild(element);
var evt = document.createEvent("Events");
evt.initEvent("setMovieMode", true, false);
function markNow(){
    PInstance[0].pause();
    var pos = PInstance[0].getPosition() + ""; 
    pid = pos.replace(/\./g, "-"); 
    $(".selectedTime").removeClass("selectedTime");
    setDrawMode();
    timeExists = false;
    for (var i = 0; i < allTimes.moments.length; i++) {
        if (allTimes.moments[i].id == pid) {
            timeExists = true;
            break;
        }
    }  
    if (!(timeExists)) {
        newMom = allTimes.moments.push({
            "name": pos,
            "id": pid,
            "shapes": [],
            "note": "Click here to add a note."
        });
        tm.addRow({
            "name": pos,
            "id": pid
        });       
    } 
    return;
}
function savable(){
    allTimesStr = JSON.stringify(allTimes.moments); 
    return allTimesStr; 
}
function setDrawMode(){
    $(".vd-container").css({
        "z-index": "13"
    });
}
function setMovieMode(){
    mode("m");
    $(".vd-container").eq(0)[0].dispatchEvent(evt);
}
function clearShapes(){
    drawer.clearShapes();
}
function showShapes(tId){
    clearShapes();
    var time = tId.substring(tId.indexOf("_") + 1);
    
    var exists = _.detect(allTimes.moments, function(item){
        return item.id == (time);
    });
    
    if (!(_.isUndefined(exists))) {
        if (!(_.isUndefined(exists.shapes))) {
        
            if (typeof exists.shapes === "string") {
                drawer.importShapes(JSON.parse(exists.shapes));
            }
            else {
                drawer.importShapes(exists.shapes);
            }
        }
        else {
            alert("No shapes to show.");
        }
    }
    else {
    
    }
    return;
    
}
function saveSelectedShapes(){
    curTime = PInstance[0].getPosition();
    
    var index = false;
    for (var i = 0; i < allTimes.moments.length; i++) {
    
        if (allTimes.moments[i].name == curTime) {
        
            index = i;
        }
    }
    momentShapes = drawer.exportShapes();
    var shapeStr = JSON.stringify(momentShapes);
    
    if (index) {
    
    
        allTimes.moments[index].shapes = shapeStr;
        
        
    }
    else {
        if (momentShapes.length > 0) {         
            allTimes.moments[allTimes.moments.length - 1].shapes = shapeStr;
        }
    }
    
}
var inited = false;
function amReady(){
    if (inited) 
        return;
    inited = true; 
}
function toggleMode(){
    if (annoMode) {
        annoMode = false;
        
        $(".vd-container").css({
            "z-index": "9"
        });
    }
    else {
        annoMode = true;
        
        $(".vd-container").css({
            "z-index": "13"
        });
    }
}
function mode(m){
    if (m == "m") {
        $(".vd-container").css({
            "z-index": "1"
        });
    }
    else {
        PInstance[0].playerObject.setPause(true);
        $(".vd-container").css({
            "z-index": "3"
        });
        drawer.setDrawMode(m);
    }
    
}
function jumpToTime(t){
    curTime = t;
    PInstance[0].seekScan(parseFloat(t));
    curTime = t;
    PInstance[0].pause();
    return true;
}
function selectRow(selRowId){
    time = selRowId.substring(selRowId.lastIndexOf("_") + 1);
    var t = time.replace(/-/g, ".");
    t = parseFloat(t);
    curTime = t;
    if (!(PInstance[0].getIsStarted())) {
    
        PInstance[0].play();
        
        PInstance[0].addListener("time", function(e){
            PInstance[0].playerObject.mediaElement.api_attribute("ontimeupdate", false);
            var jumpReturn = false;
            jumpReturn = jumpToTime(t);
            if (jumpReturn) {
                showShapes(selRowId.substring("itemRow_".length));
            }
            
        });
        
    }
    else {
        jumpReturn = false;
        jumpReturn = jumpToTime(t);
        if (jumpReturn) {
			showShapes(selRowId.substring("itemRow_".length));
		}     
    }
}
function build(mode, scale, old){
    self = this;
    links = [];
    tm = new itemTable({
        "tableName": "video",
        "title": "Timestamps",
        "container": $("#time-marker-container"),
        "rowLabel": "Time",
        "noteLabel": "Note",
        "delButton": "Delete",
        "saveButton": "Save"
    
    });
    projID = $(".projekktor").eq(0).attr("id");
    
    overID = "#" + projID + "_media_clickcatcher";
    $(overID).css({
        "z-index": "2"
    })
    drawer = new VectorDrawer({
        initScale: scale,
        overElm: $(overID).eq(0)
    });
    drawer.setPenColor("#00FF00");
    $("body").eq(0).unbind("rowDeleted");
    $("body").eq(0).bind("rowDeleted", function(e, mId){
    
    
        if (mId.indexOf("childTable") < 0) {
        
            delId = mId.substring(mId.lastIndexOf("_") + 1);
            
            for (var i = 0; i < allTimes.moments.length; i++) {
                thisMoment = allTimes.moments[i];
                
                if (thisMoment.id == delId) {
                
                    shapesObj = JSON.parse(allTimes.moments[i].shapes);
                    for (var j = 0; j < shapesObj.length; j++) {          
                        drawer.deleteShape(shapesObj[j].id);   
                    }
                    
                    allTimes.moments.splice(i, 1);
                }
                
            }
        }
        else {
            // Hack.  Fix someday ~ DLR
            var rel = mId.substring("itemRow_childTable_itemRow_video_".length);
            
            var time = rel.substring(0, rel.indexOf("_"));
            var sId = rel.substring(rel.indexOf("_") + 1);
            
            for (var i = 0; i < allTimes.moments.length; i++) {
                if (allTimes.moments[i].id == time) {
                
                    var shapesObj = JSON.parse(allTimes.moments[i].shapes);
                    
                    for (var j = 0; j < shapesObj.length; j++) {
                    
                        if (shapesObj[j].id == sId) {
                            drawer.deleteShape(sId);
                            shapesObj.splice(j, 1);
                            
                        }
                    }
                    allTimes.moments[i].shapes = JSON.stringify(shapesObj);
                    
                }
                
                
            }
            
        }
        
        
    });
    $("body").eq(0).unbind("unassignedClick");
    $("body").eq(0).bind("unassignedClick", function(e){
        $(".vd-container").css({
            "z-index": "1"
        });
        drawer.setDrawMode("m");
    });
    $("body").eq(0).unbind("shapeDrawn");
    $("body").eq(0).bind("shapeDrawn", function(e, shape){
        var shapeObj = {
            "id": shape.id,
            "name": shape.type
        }
        curTime = PInstance[0].getPosition();        
        var timeId = "itemRow_video_" + ("" + curTime).replace(/\./g, "-");
        var shapeRow = $("#" + timeId);
        var shapeRowId = timeId;
        var rowObj = {
            "row": shapeRow,
            "id": shapeRowId
        };
        tm.addChild(rowObj, shapeObj);
        saveSelectedShapes();      
    });
    $(".vd-container").mousedown(function(e){
        if (drawer._drawMode != "m") {
        
            markNow();
        }
    });
    $("body").eq(0).unbind("noteChanged");
    $("body").eq(0).bind("noteChanged", function(e, rId, noteText){
        
        if (rId.indexOf("itemRow_video") == 0) {
            var nId = rId.substring("itemRow_video".length + 1);
            
            thisNote = _.detect(allTimes.moments, function(o){
            
                return (o.id == nId);
            });
            
            if (thisNote) {
            
                thisNote.note = noteText;
                
            }
        }
        else {    
            //This is really hacky string stuff, maybe could be improved later	
            var relevant = rId.substring(33);
            var endPoint = relevant.lastIndexOf("_", relevant.lastIndexOf("_") - 1);
            var tId = relevant.substring(0, endPoint);
            var sId = relevant.substring(endPoint + 1);           
            for (var i = 0; i < allTimes.moments.length; i++) {
                if (allTimes.moments[i].id == tId) {
                
                    var shapesObj = allTimes.moments[i].shapes;
                    
                    if (typeof shapesObj === "string") {
                        shapesObj = JSON.parse(shapesObj);
                    }
                    for (var j = 0; j < shapesObj.length; j++) {
                    
                        if (shapesObj[j].id == sId) {
                        
                            shapesObj[j]["note"] = noteText;
                            
                        }
                    }
                    allTimes.moments[i].shapes = JSON.stringify(shapesObj);                   
                }            
            }
        
        }   
    }); 
    PInstance[0].addListener('testcard', function(){
		// This is kind of a hack to reload the page
		// if the media didn't load properly.  Usually this 
		// is because Flash didn't load in when the XUL page was first 
		// generated.  It would be nice to fix this more elegantly someday.
		location.reload(true);
    });
    
    $("body").eq(0).unbind("shapeChanged");
    $("body").eq(0).bind("shapeChanged", function(e, shape){
        saveSelectedShapes();
    });
    $("body").eq(0).unbind("childSelect");
    $("body").eq(0).bind("childSelect", function(e, selRowId){
    
        var relevant = selRowId.substring(19);
        
        var endPoint = relevant.lastIndexOf("_", relevant.lastIndexOf("_") - 1);
        
        var tId = relevant.substring(0, endPoint);
        selectRow("#itemTD_" + tId.substring("itemRow_".length));
        
        var start = selRowId.lastIndexOf("_", selRowId.lastIndexOf("_") - 1) + 1;
        var shapeId = selRowId.substring(start);
        if (selShape) {
            drawer.changeColor(selShape, "00FF00");
        }
        selShape = shapeId;
        drawer.changeColor(shapeId, "FF0000");
        
    });
    
    $("body").eq(0).unbind("itemSelect");
    $("body").eq(0).bind("itemSelect", function(e, selRowId){
    
        if (selShape) {
            drawer.changeColor(selShape, "00FF00");
        }
        selShape = null;
        $(".selectedChild").removeClass("selectedChild");
        selectRow(selRowId);
        
        
    });
    
    
    
    
    if (old) {
    
    
        _.each(old, function(o){
            if (o) {
            
                allTimes.moments.push(o);
                
                tm.importRow(o);
                if (o.shapes.length > 2) {
                    var shapes = JSON.parse(o.shapes);
                    for (var s in shapes) {
                        var shape = shapes[s];
                        
                        var shapeObj = {
                            "id": shape.id,
                            "name": shape.type,
                        
                        }
                        if (shape.note) {
                            shapeObj.note = shape.note;
                        }
                        var shapeRow = $("#itemRow_video_" + o.id);
                        var shapeId = "itemRow_video_" + o.id;
                        var optObj = {
                            "row": shapeRow,
                            "id": shapeId
                        };
                        tm.addChild(optObj, shapeObj);
                    }
                }
                
            }
        });
    }
    
    
    
    
    PInstance[0].addListener("start", function(e){
    
    
        clearShapes();
        
    });
    PInstance[0].addListener("play", function(e){    
        clearShapes();
    });
    
    $("#player-ui-container").bind("mouseover", function(){
        overVideo = true;
    });
    $("#player-ui-container").bind("mouseout", function(){
    
        overVideo = false;
    });
    $("html").unbind("click");
    $("html").bind("click", function(e){
    
        if (!(overVideo)) {
        
            setMovieMode();
        }
        
    });
    
}
