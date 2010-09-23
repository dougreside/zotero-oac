//var p = PInstance[0].playerObject;
var tm = null, ui = null, oldAnnos = null;
var allShapes = [];
var annoMode = false;
//var oldAudio = {"moments":[],"ranges":[]};
oldAudio = null;
var selTime = null;
var links = [];
var moments = null;
var allTimes ={"moments":[]};
var curTime = 0;
var selShape = null;
function markNow() {
	PInstance[0].pause();
	var pos = PInstance[0].getPosition()+"";
	
	pid=pos.replace(/\./g,"-");
	
	$(".selectedTime").removeClass("selectedTime");	
	setDrawMode();
	if (!(allTimes.moments["pos"])){
		
		newMom = allTimes.moments.push({"name": pos, "id": pid, "shapes":[], "note":"Click here to add a note."});
		tm.addRow({
			"name": pos,
			"id": pid
		});
		
	
	
	}
	return;
}

function savable() {
	

	allNotes = $(".momNote");

	$.each($(allNotes),function(i,mN){
		allTimes.moments[i].note = $(mN).html();
	
	});
	allTimesStr = JSON.stringify(allTimes.moments);
	return allTimesStr;
	
	
}
function setDrawMode(){
	$(".vd-container").css({
			"z-index": "13"
		});
}
function setMovieMode(){
		$(".vd-container").css({
			"z-index": "9"
		});
}

function timeClick(clicked){
		for (n in PInstance[0].playerObject){
			console.log(n);
		}
		if (timeVal != "undefined") {
			var timeVal = parseFloat(clicked.html());
			PInstance[0].playerObject.setPlay(true);
			PInstance[0].playerObject.setSeek(timeVal);
			PInstance[0].playerObject.setPause(true);
			
		}
		
		
}


function clearShapes(){
	drawer.clearShapes();
}	

function showShapes(tId){
	
	clearShapes();
	var time = tId.substring(tId.indexOf("_")+1);


	var exists = _.detect(allTimes.moments,function(item){return item.id==(time);});
	if (!(_.isUndefined(exists))) {
		if (!(_.isUndefined(exists.shapes))) {
		
			if (exists.shapes.length > 2) {
				drawer.importShapes(JSON.parse(exists.shapes));
			}
		}
	}
	else{
	}
	
	
}
function saveSelectedShapes(){
	
	var exists = _.detect(allTimes.moments,function(item){
		
		return item.name==curTime;
		
		});
	
	momentShapes = drawer.exportShapes();
	if (!(_.isUndefined(exists))) {
	
		exists.shapes = JSON.stringify(momentShapes);
					

	}
	else{
		if (momentShapes.length > 0) {
			markNow();
			allTimes.moments[allTimes.moments.length - 1].shapes = momentShapes;
		}
	}
	
}

var inited = false;

function amReady() {
		
	if (inited) return;
	inited = true;
	
		
	
	
}
function toggleMode(){
	if (annoMode){
		annoMode = false;

		$(".vd-container").css({"z-index":"9"});
	}
	else{
		annoMode = true;
	
		$(".vd-container").css({"z-index":"13"});
	}
}



function mode(m) {
		if (m == "m") {
			$(".vd-container").css({"z-index":"1"});
		}
		else {
			PInstance[0].playerObject.setPause(true);
			$(".vd-container").css({"z-index":"3"});
			drawer.setDrawMode(m);
		}
	
}
function jumpToTime(t){
		
		saveSelectedShapes();		
		clearShapes();
		curTime = t;
		PInstance[0].pause(true);
		PInstance[0].playerObject.setSeek(t);

		return true;
		//showShapes(selRowId);
}
function build(mode, scale,old) {
	
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
	projID= $(".projekktor").eq(0).attr("id");
	
	overID = "#"+projID+"_media_clickcatcher";
	$(overID).css({"z-index": "2"})
	drawer = new VectorDrawer({
		initScale: scale,
		overElm: $(overID).eq(0)
	});
	drawer.setPenColor("#00FF00");
	$("body").eq(0).unbind("rowDeleted");
	$("body").eq(0).bind("rowDeleted",function(e,mId){
		
		
		if (mId.indexOf("childTable") < 0) {
			///alert(mId);
			delId = mId.substring(mId.lastIndexOf("_") + 1);
			//alert(delId);
			for (var i = 0; i < allTimes.moments.length; i++) {
				thisMoment = allTimes.moments[i];
				
				if (thisMoment.id == delId) {
					//alert("gotcha");
					allTimes.moments.splice(i, 1);
				}
			}
		}
		else{
			// Hack.  Fix someday ~ DLR
			
			var rel = mId.substring("itemRow_childTable_itemRow_video_".length);
		
			var time = rel.substring(0,rel.indexOf("_"));
			var sId = rel.substring(rel.indexOf("_")+1);
		
			for (var i = 0; i < allTimes.moments.length; i++) {
				if (allTimes.moments[i].id==time){
					
					var shapesObj = JSON.parse(allTimes.moments[i].shapes);
					for (var j=0;j<shapesObj.length;j++){
					
						if (shapesObj[j].id == sId) {
							
							shapesObj.splice(j,1);
						
						}
					}
					allTimes.moments[i].shapes=JSON.stringify(shapesObj);
					
				}
	
			
			}
			
		}
		
			
	});
	$("body").eq(0).unbind("unassignedClick");
	$("body").eq(0).bind("unassignedClick",function(e){
		$(".vd-container").css({"z-index":"1"});
		drawer.setDrawMode("m");
	});
		$("body").eq(0).unbind("shapeDrawn");
	$("body").eq(0).bind("shapeDrawn",function(e,shape){
		var rowObj = {"id":shape.id,"name":shape.type}
	
		tm.addChild(rowObj);
		saveSelectedShapes();
	});
	
	$("body").eq(0).unbind("noteChanged");
	$("body").eq(0).bind("noteChanged",function(e,rId,noteText){
		if (rId.indexOf("itemRow_video") == 0) {
			var nId = rId.substring(14);
		
			thisNote = _.detect(allTimes.moments, function(o){
				return (o.id == nId);
			});
				if (thisNote) {
			
				thisNote.note = noteText;
				
			}
		}
		else{
			//This is really hacky string stuff, maybe could be improved later	
			var relevant = rId.substring(33);
			var endPoint = relevant.lastIndexOf("_",relevant.lastIndexOf("_")-1);
			var tId = relevant.substring(0,endPoint);
			var sId = relevant.substring(endPoint+1);
	
			var thisMoment = _.detect(allTimes.moments, function(o){
				return (o.id == tId);
			});
			for (var i = 0; i < allTimes.moments.length; i++) {
				if (allTimes.moments[i].id==tId){
					
					var shapesObj = JSON.parse(allTimes.moments[i].shapes);
					for (var j=0;j<shapesObj.length;j++){
					
						if (shapesObj[j].id == sId) {
							
							shapesObj[j]["note"] = noteText;
						
						}
					}
					allTimes.moments[i].shapes=JSON.stringify(shapesObj);
					
				}
	
			
			}
		

			
			
		}	
		
		

		

	});
		PInstance[0].addListener("pause",function(e){
	
		curTime = PInstance[0].playerObject.getPosition();
	});	
	PInstance[0].addListener('testcard', function(){ 
	//if (confirm("It appears the media didn't load completely, reload this page?")) {
		location.reload(true);
	//}
	});
	$("body").eq(0).unbind("shapeChanged");
	$("body").eq(0).bind("shapeChanged",function(e,shape){
		saveSelectedShapes();
	});
	$("body").eq(0).unbind("childSelect");
	$("body").eq(0).bind("childSelect",function(e,selRowId){
		
			var relevant = selRowId.substring(19);
	
			var endPoint = relevant.lastIndexOf("_",relevant.lastIndexOf("_")-1);
		
			var tId = relevant.substring(0,endPoint);
			$("#itemTD_"+tId).click();
			//$("#itemTable_video").trigger("itemSelect",[tId]);
		var start = selRowId.lastIndexOf("_",selRowId.lastIndexOf("_")-1)+1;
		var shapeId = selRowId.substring(start);
		if (selShape) {
			drawer.changeColor(selShape, "00FF00");
		}
		selShape=shapeId;
		drawer.changeColor(shapeId,"FF0000");
		
		});
		
	$("body").eq(0).unbind("itemSelect");
	$("body").eq(0).bind("itemSelect",function(e,selRowId){
			
			time = selRowId.substring(selRowId.lastIndexOf("_") + 1);
			var t = time.replace(/-/g, ".");
			t = parseFloat(t);
			//alert(t);
			if (!(PInstance[0].getIsStarted())) {
			
				PInstance[0].play();
				
				PInstance[0].addListener("time",function(e){
					PInstance[0].playerObject.mediaElement.api_attribute("ontimeupdate", false);

					PInstance[0].pause();
					jumpReturn=false;
					jumpReturn = jumpToTime(t);
					if (jumpReturn) {
						showShapes(selRowId.substring("itemRow_".length));
						//alert("quack");
					}
					else{
						//alert("why");
					}
	
				});
				
			}
			else {	
				jumpReturn=false;		
				jumpReturn = jumpToTime(t);			
					if (jumpReturn) {
						showShapes(selRowId.substring("itemRow_".length));
						//alert("quack2");
					}
					else{
						//alert("why2");
					}
			}
		
	});
	if (old) {
		
		
		_.each(old,function(o){
			 if (o) {

				allTimes.moments.push(o);	
				
				tm.importRow(o);
				if (o.shapes.length>2){
					var shapes = JSON.parse(o.shapes);
					for (var s in shapes) {
						var shape = shapes[s];
						
						var rowObj = {
							"id": shape.id,
							"name": shape.type,
							
						}
						if (shape.note){
							rowObj.note = shape.note;
						}
						var shapeRow = $("#itemRow_video_"+o.id);
						var shapeId = "itemRow_video_"+o.id;
						var optObj = {"row":shapeRow,"id":shapeId};
						tm.addChild(rowObj,optObj);
					}
				}
				
				} 
		});
	}
	


		
	PInstance[0].addListener("start",function(e){


		clearShapes();

	});
	PInstance[0].addListener("play",function(e){


		
		clearShapes();
		//saveSelectedShapes(sId);

	});
	PInstance[0].addListener("seek",function(e){
	
		//saveSelectedShapes();
		sId = PInstance[0].playerObject.getPosition();
		curTime = sId;
		showShapes(sId);
		console.log(sId);
		clearShapes();
	
		});
	/*PInstance[0].play();
				
		PInstance[0].addListener("time",function(e){
				PInstance[0].playerObject.mediaElement.api_attribute("ontimeupdate", false);

					PInstance[0].pause();
					
			
	
				});*/
}




