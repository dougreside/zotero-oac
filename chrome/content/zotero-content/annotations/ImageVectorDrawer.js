var drawer;
var noteArray=[];
var selShape = "";
function build(mode, scale, old) {
	
	drawer = new VectorDrawer({initScale: scale, overElm: $("#imgContainer")});
	drawer.setDrawMode("s");
	drawer.setPenColor("#00FF00");

		sm = new itemTable({
			"tableName": "image",
			"container": "#shape-marker-container",
			"title": "Regions",
			"rowLabel": "type",
			"noteLabel": "note",
			"saveButton": "Save",
			"delButton": "Delete"
			
		});
		$("body").eq(0).bind("shapeImported",function(e,obj){
		
		noteObj = {"id": obj.id, "name": obj.type, "note":obj.note};
		sm.importRow(noteObj);
		noteArray.push({"id": obj.id, "note":obj.note});
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
		selShape=shapeInfo.substring("image_".length);
		drawer.changeColor(selShape,"FF0000");
	});
	$("body").eq(0).bind("rowDeleted",function(e,rId){
		
		var deadShape = rId.substring("itemRow_image_".length);
	
		drawer.deleteShape(deadShape);

	});
	$("body").eq(0).bind("noteChanged",function(e,rId,noteText){
		var nId = rId.substring("itemRow_image_".length);
	
	thisNote = _.detect(noteArray, function(o){
				return (o.id == nId);
			});
			alert(thisNote);
				if (thisNote) {
			
				thisNote.note = noteText;
				
			}
		
	});
}
function addShape(obj){
	
	var rowObj = {"id":obj.id,"name":obj.type}
	noteArray.push({"id":obj.id,"note": "Click here to add a note"});
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
			
	
			if (noteArray[i].id == response[o].id) {
				
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
