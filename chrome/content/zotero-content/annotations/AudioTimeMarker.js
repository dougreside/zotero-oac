
var tm = null, ui = null, oldAnnos = null;

var allTimes ={"moments":[]};
function build(old) {
	
		
	oldAnnos = old;
	
	p = PInstance[0].playerObject;
	//setupTM();
tm = new TimeTable({
		container: $("#time-marker-container")
	});
	if (old.length>0) {
		for (i = 0; i < old.length; i++) {
			tm.importRow(old[i]);
		}
	}
	$("body").eq(0).bind("timeSelect",function(e,time){
		
	
		PInstance[0].playerObject.setPause(true);
		PInstance[0].playerObject.setSeek(time);
		PInstance[0].playerObject.setPlay(true);
	});
	
}

function setupTM() {
	//if (tm || !ui || oldAnnos === null) return;
	if (tm || oldAnnos === null) return;
	
	tm = new TimeMarker({
		container: $("#time-marker-container"),
		player: p,
		initState: oldAnnos,
		//formatTime: function (t) {return ui.formatTime(t);}
	});
}

function savable() {

	allNotes = $(".momNote");

	$.each($(allNotes),function(i,mN){
		allTimes.moments[i].note = $(mN).html();
	
	});
	allTimesStr = JSON.stringify(allTimes.moments);
	return allTimesStr;
}

function markNow() {
	var pos = PInstance[0].playerObject.getPosition();
	$(".selectedTime").removeClass("selectedTime");	

	if (!(allTimes.moments["pos"])){

		newMom = allTimes.moments.push({"time": pos, "note":"Click here to add a note."});
		tm.addRow(pos);
	
	
	
	}
}

function markStartEnd() {
	tm.markStartEnd();
}

var inited = false;

function amReady() {
	p = PInstance[0].playerObject;
	if (inited) return;
	inited = true;
	//ui = new PlayerUI({container: $("#player-ui-container"), player: p});
	//setupTM();
	
	
}



