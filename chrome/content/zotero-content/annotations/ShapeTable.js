// dependencies: jQuery, underscore.js
(function ($, _) {

var rootNS = this;

rootNS.itemTable = function (opts) {
	// opts:
	//  container = JQuery DOM object where table should be inserted
	

	var self = this;

	self._container = $(opts.container);

	self._container.html(
		"<h3>items</h3>"
		+"<table id='itemTable' class='time-marker-item-list'>"
		+"<tr class='time-marker-item-header'>"
		+"			<th>item</th>"
		+"			<th>Note</th>"
		+"			<th>Save</th>"
		+"			<th>Delete</th>"
		+"		</tr>"
		+" </table>");


		

};

jQuery.extend(rootNS.itemTable.prototype, {

	addRow: function(itemObj){
		self=this;
		//itemObj = JSON.parse(itemJSON);
		var itemName = itemObj.name;
		var itemId = itemObj.id;
		
		if ($("#itemRow_"+itemId).size()>0){
		
		self.selectRow(sid);	
		}
		else{
		var lastRow = $("#itemTable").find("tr").size()-1;
		if (lastRow>0){
			var lastId = $("#itemTable").find("tr").eq(lastRow).find(".itemNote").eq(0).attr("id");
			var lastNum = parseInt(lastId.split("_")[1]);
			lastNum++;
			
			 
		}
		else{
			lastNum=0;
		}
		$("#itemTable").append("<tr id='itemRow_"+itemId+"'><td class='itemTD'>"+itemName+"</td><td class='itemNote' id='note_"+lastNum+"'>Click here to add a note</td><td class='saveButton'>save</td><td class='deleteButton'>delete</td></tr>");				
		$(".itemTD").unbind("click");
		$(".itemTD").click(function(e){
		
		self.selectRow($(this).parent().attr("id").substring(8));
		});
		$(".itemNote").unbind("click");
		$(".itemNote").click(function(e){
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
	deleteRow: function(item){
		rId = item.parent().attr("id");
		mId = item.parent().find('td').eq(1).attr("id");
		
		mNum = parseInt(mId.split("_")[1]);
		item.parent().remove();
		var allTR = $("#itemTable").find("tr");
		$.each(allTR,function(key,value){
			$(value).find('td').eq(1).attr("id","note_"+key);
		});
		
		$("#itemTable").trigger("rowDeleted",[mNum,rId]);
	},
	importRow:function(o){
		this.addRow(o);
		$("#itemTable").find("tr:last").find("td.itemNote").eq(0).text(o.note);
		
	},
	selectRow: function(itemRow){
		
		self =this;
		var itemName = "#itemRow_"+itemRow;
		$(".selectedRow").removeClass("selectedRow");

		$(itemName).addClass("selectedRow");

		
		$(itemName).trigger("itemSelect",[itemRow]);
		
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
			nId = $(noteParent).parent().attr("id");
			$("#itemTable").trigger("noteChanged",[nId,noteText]);		
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
	deleteitem:function(note){
		
	}
});

})(jQuery, _);
