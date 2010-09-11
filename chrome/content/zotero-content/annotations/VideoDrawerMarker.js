//var p = PInstance[0].playerObject;
var tm = null, ui = null, oldAnnos = null;
var allShapes = [];
var annoMode = false;
//var oldAudio = {"moments":[],"ranges":[]};
oldAudio = null;
var selTime = null;
var links = [];
var moments, ranges = null;
var allTimes ={"moments":[]};
var curTime = 0;
function markNow() {
	PInstance[0].playerObject.setPause(true);
	var pos = PInstance[0].playerObject.getPosition();
	$(".selectedTime").removeClass("selectedTime");	
	setDrawMode();
	if (!(allTimes.moments["pos"])){

		newMom = allTimes.moments.push({"time": pos, "shapes":[], "note":"Click here to add a note."});
		tm.addRow(pos);
		installHandlers();
	
	
	}
	
	
	
	return;
	

}

function markStartEnd() {
	if (self._start !== null) {
		if ($(".selectedTime").length == 0) {
			sId = 0;
		}
		else {
		
			sId = $(".selectedTime:first").attr("id");
		}
		saveSelectedShapes();
	}
	tm.markStartEnd();
	if (self._start !== null) {
		installHandlers();
		
		$(".selectedTime").removeClass("selectedTime");
		selRange = tm._ranges[tm._ranges.length - 1];
		$("#" + selRange.id).addClass("selectedTime");
	}

}

$(document).bind("mediaPaused",function(e){
	
});
$(document).bind("mediaTimeChange",function(e,time){
	if (!moments&&!ranges){
	timesArray = tm.savable();
	times = timesArray[0];
	moments = times.moments;
	ranges = times.ranges;
	}
	_.detect(moments,function(m){
		if (((parseInt(time)-parseInt(m.time))<2)&&((parseInt(time)-parseInt(m.time))>=0)){
		
		   if (drawer._allObjs.length == 0) {
		    
		   	showShapes("mom_" + m.id, false);
		   }
		}
		else{
			drawer.clearObjs();
			drawer._paper.clear();
			drawer._allObjs=[];
		}
	})
});
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
function installHandlers(){
	
	$(".time-marker-moment>td").unbind("click");
	$(".time-marker-range>td").unbind("click");
	$(".startTime").click(function(e){
		timeClick($(this))
	});
	PInstance[0].addListener("start",function(e){
		console.log("START");
		//saveSelectedShapes();
		clearShapes();
	//	drawer.clearObjs();
	//	drawer._paper.clear();
	});
	PInstance[0].addListener("play",function(e){
		console.log("PLAY");
		
		//saveSelectedShapes();
		
		clearShapes();
		//saveSelectedShapes(sId);
		//drawer.clearObjs();
		//drawer._paper.clear();
	});
	PInstance[0].addListener("seek",function(e){
		console.log("SEEK");
		//saveSelectedShapes();
		sId = PInstance[0].playerObject.getPosition();
		curTime = sId;
		showShapes(sId);
		console.log(sId);
		clearShapes();
	
		});
	PInstance[0].addListener("pause",function(e){
		console.log("paused");
		curTime = PInstance[0].playerObject.getPosition();
	});	
	
	$("body").eq(0).bind("shapeDrawn",function(e,shape){
		console.log("shapeDrawn");
		saveSelectedShapes();
	});
	$("body").eq(0).bind("shapeChanged",function(e,shape){
		saveSelectedShapes();
	});
	$("body").eq(0).bind("timeSelect",function(e,time){
		
		//var t = parseFloat(time);
		//saveSelectedShapes();
		clearShapes();
		curTime = time;
		PInstance[0].playerObject.setPause(true);
		PInstance[0].playerObject.setSeek(time);
		showShapes(time);
	});
	
	
}

function clearShapes(){
	drawer.clearShapes();
}	

function showShapes(tId){
	
	clearShapes();
	var exists = _.detect(allTimes.moments,function(item){return item.time==tId;});
	if (!(_.isUndefined(exists))) {
		if (!(_.isUndefined(exists.shapes))) {
			
			drawer.importShapes(exists.shapes);
		}
	}
	
	
}
function saveSelectedShapes(){

	var exists = _.detect(allTimes.moments,function(item){
		console.log(JSON.stringify(item));
		return item.time==curTime;
		
		});
	
	momentShapes = drawer.exportShapes();
	if (!(_.isUndefined(exists))) {
		console.log("Is there: "+exists.time);	
		
		exists.shapes = JSON.stringify(momentShapes);
		console.log(exists.shapes);	
			
	}
	else{

		markNow();
		allTimes.moments[allTimes.moments.length-1].shapes = momentShapes;
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

//------image
function Note(old, pos) {
	this._cont = $("<div class=\"note-container\">" +
			"<div class=\"display\"></div>" +
			"<form class=\"edit\">" +
				"<textarea></textarea>" +
				"<div class=\"button-row\">" +
					"<input type=\"button\" value=\"Save\" class=\"save\" />" +
					"<input type=\"button\" value=\"Cancel\" class=\"cancel\" />" +
				"</div>" +
			"</form>" +
		"</div>");
	this._disp = $(".display", this._cont);
	this._edit = $(".edit", this._cont);
	this._area = $("textarea", this._cont);
	var save = $(".save", this._cont);
	var cancel = $(".cancel", this._cont);

	this._cont.appendTo(".vd-container");
	this._cont.css({left: pos.x, top: pos.y, position: "absolute"});
	this._disp.text(old || " ");
	this._area.val(old);

	var self = this;
	this._cont.mousedown(function (e) {e.stopPropagation();});
	this._cont.mouseup(function (e) {e.stopPropagation();});
	this._cont.keydown(function (e) {e.stopPropagation();});
	this._disp.click(function (e) {
		if (drawer) {
			drawer.disableKeyListener();
		}
		self._disp.css("display", "none");
		self._edit.css("display", "block");
		self._area.focus();
	});
	function awayEdit(e){
		if (drawer) {
			
			drawer.enableKeyListener();
		}
		self._disp.css("display", "block");
		self._edit.css("display", "none");
	};
	save.click(awayEdit);
	cancel.click(awayEdit);

	save.click(function (e) {
		self._disp.text(self._area.val() || " ");
		self._disp.focus();
	});
}

$.extend(Note.prototype, {
	close: function (){
		var ret = this._area.val();
		this._cont.remove();
		return ret;
	}
});

var drawer;
function scale(s) {
	drawer.scale(s);
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
function build(mode, scale,old) {
	
	self = this;
	links = [];
	tm = new TimeTable({
		container: $("#time-marker-container")
	});
	projID= $(".projekktor").eq(0).attr("id");
	overID = "#"+projID+"_media_clickcatcher";
	$(overID).css({"z-index": "2"})
	drawer = new VectorDrawer({
		initScale: scale,
		overElm: $(overID).eq(0)
	});
	$("body").eq(0).unbind("rowDeleted");
	$("body").eq(0).bind("rowDeleted",function(e,mId){
		allTimes.moments.splice(mId,1);	
	});
	$("body").eq(0).unbind("unassignedClick");
	$("body").eq(0).bind("unassignedClick",function(e){
		$(".vd-container").css({"z-index":"1"});
		drawer.setDrawMode("m");
	});
	if (old) {
		
		
		_.each(old,function(o){
			 if (o) {

				allTimes.moments.push(o);	
				tm.importRow(o);
				
				installHandlers();
				} 
		});
	}
	


			/*
			 * args:
			 * 	overElm:  Element over which to place the canvas
			 *  initScale:  initial scale of canvas
			 */
	//drawer = new VectorDrawer(mode, scale, [], $(".projekktor").eq(0), Note);
	
	installHandlers();
}




