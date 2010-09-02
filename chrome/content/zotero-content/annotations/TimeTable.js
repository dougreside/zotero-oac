// dependencies: jQuery, underscore.js
(function ($, _) {

var rootNS = this;

rootNS.TimeTable = function (opts) {
	// opts:
	//  container = JQuery DOM object where table should be inserted
	

	var self = this;

	self._container = $(opts.container);

	self._container.html(
		"<h3>Marked Moments</h3>"
		+"<table id='momentTable' class='time-marker-moment-list'>"
		+"<tr class='time-marker-moment-header'>"
		+"			<th>Time</th>"
		+"			<th>Note</th>"
		+"		</tr>"
		+" </table>");


		

};

jQuery.extend(rootNS.TimeTable.prototype, {
	addRow: function(mom){
		self=this;
		
		mom = ""+mom;
		momID = mom.replace(/\./g,"_");
		if ($("#mom"+momID).size()>0){
		
		self.selectRow(momID);	
		}
		else{
		$("#momentTable").append("<tr id='mom"+momID+"'><td class='momentTD'>"+mom+"</td><td class='momNote'>Click here to add a note</td></tr>");				
		$(".momentTD").click(function(e){
		
		self.selectRow($(this).parent().attr("id").substring(3));
		})
		};
	},
	deleteNote: function(mom){
		$("#mom"+mom).remove();
	},
	selectRow: function(mom){
		var momName = "#mom"+mom;
		$(".selectedTime").removeClass("selectedTime");
		//$(momName).css({"background-color":"cyan"});
		$(momName).addClass("selectedTime");

		var sendMom = mom.replace(/_/g,".")
		$(momName).trigger("timeSelect",[sendMom]);
	}
});

})(jQuery, _);
