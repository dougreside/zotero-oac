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
	var nPosY = pos.y+$(document).scrollTop();
	var nPosX = pos.x+$(document).scrollLeft();
	this._cont.css({left: nPosX, top: nPosY, position: "absolute"});
	this._disp.text(old || " ");
	this._area.val(old);

	var self = this;
	this._cont.mousedown(function (e) {e.stopPropagation();});
	this._cont.mouseup(function (e) {e.stopPropagation();});
	this._cont.keydown(function (e) {e.stopPropagation();});
	this._disp.click(function (e) {
		self._disp.css("display", "none");
		self._edit.css("display", "block");
		self._area.focus();
	});
	function awayEdit(e){
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
var noteArray=[];
var selShape = "";
function build(mode, scale, old) {
	
	drawer = new VectorDrawer({initScale: scale, overElm: $("#imgContainer")});
	drawer.setDrawMode("s");
	drawer.setPenColor("#00FF00");

		sm = new itemTable({
			"container": "#shape-marker-container"
		});
		$("body").eq(0).bind("shapeImported",function(e,obj){
		
		noteObj = {"id": obj.id, "name": obj.type, "note":obj.note};
		sm.importRow(noteObj);
	});
	if (old) {
		drawer.importShapes(old);
		
	}

	$("body").eq(0).bind("shapeSelected",function(){
		showNote($("#selBB"));	
	});
	$("body").eq(0).bind("shapeDrawn",function(e,obj){
		addShape(obj);	
	});
	$("body").eq(0).bind("itemSelect",function(e,shapeInfo){
		drawer.changeColor(selShape,"00FF00");
		selShape=shapeInfo;
		drawer.changeColor(shapeInfo,"FF0000");
	});
	$("body").eq(0).bind("rowDeleted",function(e,shapeInfo,rId){
		var deadShape = rId.substring(8);
		drawer.deleteShape(deadShape);

	});
	$("body").eq(0).bind("noteChanged",function(e,rId,noteText){
		var nId = rId.substring(8);
		thisNote = _.detect(noteArray,function(o){
			return (o.id == nId);
		});
		if (thisNote){
			
			thisNote.note = noteText;
		}
		else{
			noteArray.push({
				"id": rId,
				"note": noteText
			});
		}
	});
}
function addShape(obj){
	alert(JSON.stringify(obj));
	var rowObj = {"id":obj.id,"name":obj.type}
	sm.addRow(rowObj);
	
}
function showNote(selBB){
	var top = $(selBB).css("top");
	$(selBB).css({"top":"cyan"});
}
function savable() {
	response = drawer.exportShapes();
	for (o in response){
	
		for (i = 0; i < noteArray.length; i++) {
			
	
			if (noteArray[i].id.substring(8) == response[o].id) {
				
				response[o]["note"] = noteArray[i].note;
			}
		}
	}
	return JSON.stringify(response);
}
function zoomIn(){
		$(".vd-container").width(1.25*parseFloat($(".vd-container").width()));
		$(".vd-container").height(1.25*parseFloat($(".vd-container").height()));
		$("#to-mark").css("width",(1.25*parseFloat($("#to-mark").width()))+'px');
	
		
		//zooming in
		drawer.scale(1.25); 

}
function zoomOut(){
			$(".vd-container").width(.75*parseFloat($(".vd-container").width()));
		$(".vd-container").height(.75*parseFloat($(".vd-container").height()));
		$("#to-mark").css("width",(.75*parseFloat($("#to-mark").width()))+'px');

		//zooming in
		drawer.scale(.75); 
}
function scale(s) {
	drawer.scale(s);
}

function mode(m) {
	
	drawer.setDrawMode(m);
}
