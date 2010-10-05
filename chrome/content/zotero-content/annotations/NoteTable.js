// dependencies: jQuery, underscore.js
(function ($, _) {

var rootNS = this;

rootNS.itemTable = function (opts) {
	// opts:
	//  container = JQuery DOM object where table should be inserted

	var self = this;
	this.childTables = [];
	this._container = $(opts.container);
	this.name = opts.tableName;
	this._container.html(
		"<table id='itemTable_"+this.name+"' class='marker-item-list'>"
		+"<tr class='marker-item-header'>"
		+"			<th>"+opts.rowLabel+"</th>"
		+"			<th>"+opts.noteLabel+"</th>"
		+"			<th>"+opts.saveButton+"</th>"
		+"			<th>"+opts.delButton+"</th>"
		+"		</tr>"
		+" </table>");


		

};

jQuery.extend(rootNS.itemTable.prototype, {

	addRow: function(itemObj){
		var self=this;
		var noteText="Click to add a note";
		if (itemObj.note){
			noteText=itemObj.note
		}
		//itemObj = JSON.parse(itemJSON);
		var itemName = itemObj.name;
		var itemId = self.name+"_"+itemObj.id;
		var rowClass = "childRow";
		if (self.name.indexOf("childTable")>=0){
			rowClass="itemRow";
		}
		if ($("#itemRow_"+itemId).size()>0){
		//self.selectRow(itemId);	
		}
		else{
			
		var lastRow = $("#itemTable_"+self.name).find("tr").size()-1;

		if (lastRow>0){
			var lastId = $("#itemTable_"+self.name).find("tr").eq(lastRow).find(".itemNote").eq(0).attr("id");
			var pieces = lastId.split("_");
			var lastNum = parseInt(pieces[pieces.length-1]);
			lastNum++;
			
			 
		}
		else{
			lastNum=0;
		
		}
		
		$("#itemTable_"+self.name).append("<tr id='itemRow_"+itemId+"'><td id='itemTD_"+itemId+"' class='itemTD'>"+itemName+"</td><td class='itemNote' id='note_"+itemId+"_"+lastNum+"'>"+noteText+"</td><td class='saveButton_"+self.name+"'>save</td><td class='deleteButton_"+self.name+"'>delete</td></tr>");				
		$("#itemTD_"+itemId).unbind("click");
		$("#itemTD_"+itemId).click(function(e){
		
		self.selectRow($(this).parent().attr("id").substring(self.name));
		});
		$("#note_"+itemId+"_"+lastNum).unbind("click");
		$("#note_"+itemId+"_"+lastNum).click(function(e){
			
			self.saveNote();
			self.editNote($(this).attr("id"));
		});
		$(".saveButton_"+self.name).unbind("click");
		$(".saveButton_"+self.name).click(function(e){
			self.saveNote();
			
		});
		$(".deleteButton_"+self.name).unbind("click");
		$(".deleteButton_"+self.name).click(function(e){
			
			self.saveNote();
			self.deleteRow($(this));
		});
		};
		
	},
	deleteRow: function(item){	
		rId = item.parent().attr("id");	
		$("body").eq(0).trigger("rowDeleted",[rId]);
		if (item.parent().next().hasClass("tableRow")){
			item.parent().next().remove();
		}
		item.parent().remove();		
		
	},
	importRow:function(o){
		var self=this;
		this.addRow(o);
		//alert("o id"+o.id);
		//$("#itemTable_"+self.name).find("tr:last").find("td.itemNote").eq(0).text(o.note);		
	},
	selectRow: function(itemRow){
	
		var self =this;

		var itemName = "#"+itemRow;
			$(".selectedRow").removeClass("selectedRow");
		if (!(self.name.indexOf("childTable") == 0)) {
		
			$(itemName).addClass("selectedRow");
			$(itemName).trigger("itemSelect", [itemRow]);
		}
		else{
			
			$(".selectedChild").removeClass("selectedChild");
			if (itemName.indexOf("childTable") >= 0) {
				$(itemName).addClass("selectedChild");
				//alert($(itemName).parent().parent().parent().prev().html());
				$(itemName).parent().parent().parent().prev().addClass("selectedRow");
				$(itemName).trigger("childSelect", [itemRow]);
			}
		}
		
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
			$("#itemTable_"+self.name).trigger("noteChanged",[nId,noteText]);		
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

	addChild:function(o,s){
		var self = this;
		
		var selR = o.row;
		var selId = o.id;

		var childId = "child_"+selId;
		var curTable = null;
		
		if ($("#"+childId).size() == 0) {
			
			selR.after("<tr id='" + childId + "' class='tableRow'></tr>");
			
			var childRow = $("#" + childId)
			
			
			var opts = {
				"tableName": "childTable_" + selId,
				"container": childRow,
				"rowLabel": "shapes",
				"noteLabel": "notes",
				"saveButton": "<span>Save</span>",
				"delButton": "Delete"
			};
			
			 curTable = new itemTable(opts);
			self.childTables.push(curTable);
			
		}
		else{
	
			curTable = _.detect(self.childTables,function(o){
			return (o.name == "childTable_"+selId);
			
			});
		
		}
			
		if (curTable){
			
			if (s.note){
				curTable.importRow(s);
			}else{
				
				curTable.addRow(s);
			
			}
		
		}
		else{
			throw "Error generating child table";
		}
		
	}
});

})(jQuery, _);
