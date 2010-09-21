
var tm = null, ui = null, oldAnnos = null;

var allTimes ={"moments":[]};
function build(old){


	oldAnnos = old;
	
	p = PInstance[0].playerObject;
	
	tm = new itemTable({
		"tableName": "audio",
		"title": "Timestamps",
		"container": $("#time-marker-container"),
		"rowLabel": "Time",
		"noteLabel": "Note",
		"delButton": "Delete",
		"saveButton": "Save"
	
	});
	if (old.length > 0) {
		for (i = 0; i < old.length; i++) {
			tm.importRow(old[i]);
			allTimes.moments.push(old[i]);
		}
	}
	$("body").eq(0).bind("itemSelect", function(e, selRowId){
	
		time = selRowId.substring(selRowId.lastIndexOf("_") + 1);
		
		
		var t = time.replace(/-/g, ".");
		
		t = parseFloat(t);
		
		PInstance[0].pause();
		PInstance[0].playerObject.setSeek(t);
		PInstance[0].play();
	});
	
	$("body").eq(0).bind("noteChanged", function(e, selRowId, noteText){
		nId = selRowId.substring(selRowId.lastIndexOf("_") + 1);

		thisNote = _.detect(allTimes.moments, function(o){
			return (o.id == nId);
		});
		if (thisNote) {
			thisNote.note = noteText;			
		}
		
	});
	
	
	
}

function savable() {

	allNotes = $(".itemNote");

	$.each($(allNotes),function(i,mN){
		allTimes.moments[i].note = $(mN).html();
	
	});
	allTimesStr = JSON.stringify(allTimes.moments);
	return allTimesStr;
}

function markNow() {
	//PInstance[0].playerObject.setPause(true);
	var pos = PInstance[0].playerObject.getPosition()+"";
	
	pid=pos.replace(/\./g,"-");
	
	$(".selectedTime").removeClass("selectedTime");	
	if (!(allTimes.moments["pos"])){
		
		newMom = allTimes.moments.push({"name": pos, "id": pid, "note":"Click here to add a note."});
		tm.addRow({
			"name": pos,
			"id": pid
		});
		
	
	
	}
	return;
}



var inited = false;

function amReady() {
	p = PInstance[0].playerObject;
	if (inited) return;
	inited = true;

	
	
}



