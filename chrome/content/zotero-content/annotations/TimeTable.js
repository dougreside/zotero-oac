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
		+"			<th>Save</th>"
		+"			<th>Delete</th>"
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
		var lastRow = $("#momentTable").find("tr").size()-1;
		if (lastRow>0){
			var lastId = $("#momentTable").find("tr").eq(lastRow).find(".momNote").eq(0).attr("id");
			var lastNum = parseInt(lastId.split("_")[1]);
			lastNum++;
			
			 
		}
		else{
			lastNum=0;
		}
		$("#momentTable").append("<tr id='mom"+momID+"'><td class='momentTD'>"+mom+"</td><td class='momNote' id='note_"+lastNum+"'>Click here to add a note</td><td class='saveButton'>save</td><td class='deleteButton'>delete</td></tr>");				
		$(".momentTD").unbind("click");
		$(".momentTD").click(function(e){
		
		self.selectRow($(this).parent().attr("id").substring(3));
		});
		$(".momNote").unbind("click");
		$(".momNote").click(function(e){
			self.saveNote();
			self.editNote($(this).attr("id"));
		});
		$(".saveButton").unbind("click");
		$(".saveButton").click(function(e){
			self.saveNote();
			
		});
		$(".deleteButton").unbind("click");
		$(".deleteButton").click(function(e){
			
			self.saveNote();
			self.deleteRow($(this));
		});
		};
		
	},
	deleteRow: function(mom){
		
		mId = mom.parent().find('td').eq(1).attr("id");
		mNum = parseInt(mId.split("_")[1]);
		mom.parent().remove();
		var allTR = $("#momentTable").find("tr");
		$.each(allTR,function(key,value){
			$(value).find('td').eq(1).attr("id","note_"+momID);
		});
		
		$("#momentTable").trigger("rowDeleted",[mNum]);
	},
	importRow:function(o){
		this.addRow(o.time);
		$("#momentTable").find("tr:last").find("td.momNote").eq(0).text(o.note);
		
	},
	selectRow: function(mom){
		self =this;
		var momName = "#mom"+mom;
		$(".selectedTime").removeClass("selectedTime");
		//$(momName).css({"background-color":"cyan"});
		$(momName).addClass("selectedTime");

		var sendMom = mom.replace(/_/g,".")
		$(momName).trigger("timeSelect",[sendMom]);
		
	},
	saveNote: function(){
			if ($("input").size() > 0) {
			
			noteText = $("input").eq(0).val();
			noteParent = $("input").eq(0).parent();
			$(noteParent).html(noteText);
			var noteId = $(noteParent).attr("id")
			$(noteParent).click(function(e){
				self.saveNote();
				self.editNote(noteId);
			});
			
		}
	},
	editNote:function(noteId){
		self = this;
			var note = $("#"+noteId);

			var noteText = note.text();
			
			note.html("<input id='editNote' type='text' size='40'></input>");
			note.find("input").eq(0).val(noteText);
			note.unbind("click");
		
	},
	deleteShape:function(note){
		
	}
});

})(jQuery, _);
