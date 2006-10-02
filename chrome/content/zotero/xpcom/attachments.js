Zotero.Attachments = new function(){
	this.LINK_MODE_IMPORTED_FILE = 0;
	this.LINK_MODE_IMPORTED_URL = 1;
	this.LINK_MODE_LINKED_FILE = 2;
	this.LINK_MODE_LINKED_URL = 3;
	
	this.importFromFile = importFromFile;
	this.linkFromFile = linkFromFile;
	this.importSnapshotFromFile = importSnapshotFromFile;
	this.importFromURL = importFromURL;
	this.linkFromURL = linkFromURL;
	this.linkFromDocument = linkFromDocument;
	this.importFromDocument = importFromDocument;
	
	var self = this;
	
	function importFromFile(file, sourceItemID){
		var title = file.leafName;
		
		Zotero.DB.beginTransaction();
		
		try {
			// Create a new attachment
			var attachmentItem = Zotero.Items.getNewItemByType(Zotero.ItemTypes.getID('attachment'));
			attachmentItem.setField('title', title);
			attachmentItem.save();
			var itemID = attachmentItem.getID();
			
			// Create directory for attachment files within storage directory
			var destDir = Zotero.getStorageDirectory();
			destDir.append(itemID);
			destDir.create(Components.interfaces.nsIFile.DIRECTORY_TYPE, 0644);
			
			file.copyTo(destDir, null);
			
			// Point to copied file
			var newFile = Components.classes["@mozilla.org/file/local;1"]
							.createInstance(Components.interfaces.nsILocalFile);
			newFile.initWithFile(destDir);
			newFile.append(title);
			
			var mimeType = Zotero.MIME.getMIMETypeFromFile(newFile);
			
			_addToDB(newFile, null, null, this.LINK_MODE_IMPORTED_FILE,
				mimeType, null, sourceItemID, itemID);
			
			Zotero.DB.commitTransaction();
			
			// Determine charset and build fulltext index
			_postProcessFile(itemID, newFile, mimeType);
		}
		catch (e){
			// hmph
			Zotero.DB.rollbackTransaction();
			
			// Clean up
			if (itemID){
				var itemDir = Zotero.getStorageDirectory();
				itemDir.append(itemID);
				if (itemDir.exists()){
					itemDir.remove(true);
				}
			}
			throw (e);
		}
		return itemID;
	}
	
	
	function linkFromFile(file, sourceItemID){
		var title = file.leafName;
		var mimeType = Zotero.MIME.getMIMETypeFromFile(file);
		
		var itemID = _addToDB(file, null, title, this.LINK_MODE_LINKED_FILE, mimeType,
			null, sourceItemID);
		
		// Determine charset and build fulltext index
		_postProcessFile(itemID, file, mimeType);
		
		return itemID;
	}
	
	
	function importSnapshotFromFile(file, url, title, mimeType, charset, sourceItemID){
		var charsetID = Zotero.CharacterSets.getID(charset);
		
		Zotero.DB.beginTransaction();
		
		try {
			// Create a new attachment
			var attachmentItem = Zotero.Items.getNewItemByType(Zotero.ItemTypes.getID('attachment'));
			attachmentItem.setField('title', title);
			attachmentItem.setField('url', url);
			// TODO: access date
			attachmentItem.save();
			var itemID = attachmentItem.getID();
			
			var storageDir = Zotero.getStorageDirectory();
			file.parent.copyTo(storageDir, itemID);
			
			// Point to copied file
			var newFile = Components.classes["@mozilla.org/file/local;1"]
							.createInstance(Components.interfaces.nsILocalFile);
			newFile.initWithFile(storageDir);
			newFile.append(itemID);
			newFile.append(file.leafName);
			
			_addToDB(newFile, url, null, this.LINK_MODE_IMPORTED_URL, mimeType,
				charsetID, sourceItemID, itemID);
			Zotero.DB.commitTransaction();
			
			// Determine charset and build fulltext index
			_postProcessFile(itemID, newFile, mimeType);
		}
		catch (e){
			Zotero.DB.rollbackTransaction();
			
			// Clean up
			if (itemID){
				var itemDir = Zotero.getStorageDirectory();
				itemDir.append(itemID);
				if (itemDir.exists()){
					itemDir.remove(true);
				}
			}
			throw (e);
		}
		return itemID;
	}
	
	
	function importFromURL(url, sourceItemID){
		Zotero.Utilities.HTTP.doHead(url, function(obj){
			var mimeType = obj.channel.contentType;
			
			var nsIURL = Components.classes["@mozilla.org/network/standard-url;1"]
						.createInstance(Components.interfaces.nsIURL);
			nsIURL.spec = url;
			var ext = nsIURL.fileExtension;
			
			// If we can load this internally, use a hidden browser (so we can
			// get the charset and title)
			if (Zotero.MIME.hasInternalHandler(mimeType, ext)){
				var browser = Zotero.Browser.createHiddenBrowser();
				browser.addEventListener("pageshow", function(){
					Zotero.Attachments.importFromDocument(browser.contentDocument, sourceItemID);
					browser.removeEventListener("pageshow", arguments.callee, true);
					Zotero.Browser.deleteHiddenBrowser(browser);
				}, true);
				browser.loadURI(url);
			}
			
			// Otherwise use a remote web page persist
			else {
				var fileName = _getFileNameFromURL(url, mimeType);
				var title = fileName;
				
				const nsIWBP = Components.interfaces.nsIWebBrowserPersist;
				var wbp = Components
					.classes["@mozilla.org/embedding/browser/nsWebBrowserPersist;1"]
					.createInstance(nsIWBP);
				//wbp.persistFlags = nsIWBP.PERSIST_FLAGS...;
				var encodingFlags = false;
				
				Zotero.DB.beginTransaction();
				
				try {
					// Create a new attachment
					var attachmentItem = Zotero.Items.getNewItemByType(Zotero.ItemTypes.getID('attachment'));
					attachmentItem.setField('title', title);
					attachmentItem.setField('url', url);
					attachmentItem.setField('accessDate', "CURRENT_TIMESTAMP");
					attachmentItem.save();
					var itemID = attachmentItem.getID();
					
					// Create a new folder for this item in the storage directory
					var destDir = Zotero.getStorageDirectory();
					destDir.append(itemID);
					destDir.create(Components.interfaces.nsIFile.DIRECTORY_TYPE, 0644);
					
					var file = Components.classes["@mozilla.org/file/local;1"].
							createInstance(Components.interfaces.nsILocalFile);
					file.initWithFile(destDir);
					file.append(fileName);
					
					wbp.saveURI(nsIURL, null, null, null, null, file);	
					
					_addToDB(file, url, title, Zotero.Attachments.LINK_MODE_IMPORTED_URL,
						mimeType, null, sourceItemID, itemID);
					
					Zotero.DB.commitTransaction();
				}
				catch (e){
					Zotero.DB.rollbackTransaction();
					throw (e);
				}
			}
		});
	}
	
	
	function linkFromURL(url, sourceItemID, mimeType, title){
		// If no title provided, figure it out from the URL
		if (!title){
			title = url.substring(url.lastIndexOf('/')+1);
		}
		
		// If we have the title and mime type, skip loading
		if (title && mimeType){
			_addToDB(null, url, title, this.LINK_MODE_LINKED_URL, mimeType,
				null, sourceItemID);
			return;
		}
		
		// Otherwise do a head request for the mime type
		Zotero.Utilities.HTTP.doHead(url, function(obj){
			_addToDB(null, url, title, Zotero.Attachments.LINK_MODE_LINKED_URL,
				obj.channel.contentType, null, sourceItemID);
		});
	}
	
	
	// TODO: what if called on file:// document?
	function linkFromDocument(document, sourceItemID){
		var url = document.location;
		var title = document.title; // TODO: don't use Mozilla-generated title for images, etc.
		var mimeType = document.contentType;
		var charsetID = Zotero.CharacterSets.getID(document.characterSet);
		
		var itemID = _addToDB(null, url, title, this.LINK_MODE_LINKED_URL,
			mimeType, charsetID, sourceItemID);
		
		// Run the fulltext indexer asynchronously (actually, it hangs the UI
		// thread, but at least it lets the menu close)
		setTimeout(function(){
			Zotero.Fulltext.indexDocument(document, itemID);
		}, 50);
		
		return itemID;
	}
	
	
	function importFromDocument(document, sourceItemID){
		var url = document.location;
		var title = document.title;
		var mimeType = document.contentType;
		var charsetID = Zotero.CharacterSets.getID(document.characterSet);
		
		const nsIWBP = Components.interfaces.nsIWebBrowserPersist;
		var wbp = Components
			.classes["@mozilla.org/embedding/browser/nsWebBrowserPersist;1"]
			.createInstance(nsIWBP);
		//wbp.persistFlags = nsIWBP.PERSIST_FLAGS...;
		var encodingFlags = false;
		
		Zotero.DB.beginTransaction();
		
		// Create a new attachment
		var attachmentItem = Zotero.Items.getNewItemByType(Zotero.ItemTypes.getID('attachment'));
		attachmentItem.setField('title', title);
		attachmentItem.setField('url', url);
		attachmentItem.setField('accessDate', "CURRENT_TIMESTAMP");
		attachmentItem.save();
		var itemID = attachmentItem.getID();
		
		// Create a new folder for this item in the storage directory
		var destDir = Zotero.getStorageDirectory();
		destDir.append(itemID);
		destDir.create(Components.interfaces.nsIFile.DIRECTORY_TYPE, 0644);
		
		var file = Components.classes["@mozilla.org/file/local;1"].
				createInstance(Components.interfaces.nsILocalFile);
		file.initWithFile(destDir);
		var fileName = _getFileNameFromURL(url, mimeType);
		
		// This is a hack to make sure the file is opened in the browser when
		// we use loadURI(), since Firefox's internal detection mechanisms seem
		// to sometimes get confused
		// 		(see #192, https://chnm.gmu.edu/trac/zotero/ticket/192)
		if (mimeType=='text/html' &&
				(fileName.substr(fileName.length-5)!='.html'
					&& fileName.substr(fileName.length-4)!='.htm')){
			fileName += '.html';
		}
		
		file.append(fileName);
		
		wbp.saveDocument(document, file, destDir, mimeType, encodingFlags, false);
		
		_addToDB(file, url, title, this.LINK_MODE_IMPORTED_URL, mimeType,
			charsetID, sourceItemID, itemID);
		
		Zotero.DB.commitTransaction();
		
		// Run the fulltext indexer asynchronously (actually, it hangs the UI
		// thread, but at least it lets the menu close)
		setTimeout(function(){
			Zotero.Fulltext.indexDocument(document, itemID);
		}, 50);
		
		return itemID;
	}
	
	
	function _getFileNameFromURL(url, mimeType){
		var nsIURL = Components.classes["@mozilla.org/network/standard-url;1"]
					.createInstance(Components.interfaces.nsIURL);
		nsIURL.spec = url;
		
		if (nsIURL.fileName){
			return nsIURL.fileName;
		}
		
		if (mimeType){
			var ext = Components.classes["@mozilla.org/mime;1"]
				.getService(Components.interfaces.nsIMIMEService)
				.getPrimaryExtension(mimeType, nsIURL.fileExt ? nsIURL.fileExt : null);
		}
		
		return nsIURL.host + (ext ? '.' + ext : '');
	}
	
	
	/**
	* Create a new item of type 'attachment' and add to the itemAttachments table
	*
	* Passing an itemID causes it to skip new item creation and use the specified
	* item instead -- used when importing files (since we have to know
	* the itemID before copying in a file and don't want to update the DB before
	* the file is saved)
	*
	* Returns the itemID of the new attachment
	**/
	function _addToDB(file, url, title, linkMode, mimeType, charsetID, sourceItemID, itemID){
		if (file){
			// Path relative to Zotero directory for external files and relative
			// to storage directory for imported files
			var refDir = (linkMode==this.LINK_MODE_LINKED_FILE)
				? Zotero.getZoteroDirectory() : Zotero.getStorageDirectory();
			var path = file.getRelativeDescriptor(refDir);
		}
		
		Zotero.DB.beginTransaction();
		
		if (sourceItemID){
			var sourceItem = Zotero.Items.get(sourceItemID);
			if (!sourceItem){
				Zotero.DB.commitTransaction();
				throw ("Cannot set attachment source to invalid item " + sourceItemID);
			}
			if (sourceItem.isAttachment()){
				Zotero.DB.commitTransaction();
				throw ("Cannot set attachment source to another file (" + sourceItemID + ")");
			}
		}
		
		// If an itemID is provided, use that
		if (itemID){
			var attachmentItem = Zotero.Items.get(itemID);
			if (!attachmentItem.isAttachment()){
				throw ("Item " + itemID + " is not a valid attachment in _addToDB()");
			}
		}
		// Otherwise create a new attachment
		else {
			var attachmentItem = Zotero.Items.getNewItemByType(Zotero.ItemTypes.getID('attachment'));
			attachmentItem.setField('title', title);
			if (linkMode==self.LINK_MODE_IMPORTED_URL
				|| linkMode==self.LINK_MODE_LINKED_URL){
				attachmentItem.setField('url', url);
				attachmentItem.setField('accessDate', "CURRENT_TIMESTAMP");
			}
			attachmentItem.save();
		}
		
		var sql = "INSERT INTO itemAttachments (itemID, sourceItemID, linkMode, "
			+ "mimeType, charsetID, path) VALUES (?,?,?,?,?,?)";
		var bindParams = [
			attachmentItem.getID(),
			(sourceItemID ? {int:sourceItemID} : null),
			{int:linkMode},
			{string:mimeType},
			(charsetID ? {int:charsetID} : null),
			(path ? {string:path} : null)
		];
		Zotero.DB.query(sql, bindParams);
		Zotero.DB.commitTransaction();
		
		if (sourceItemID){
			sourceItem.incrementAttachmentCount();
			Zotero.Notifier.trigger('modify', 'item', sourceItemID);
		}
		
		Zotero.Notifier.trigger('add', 'item', attachmentItem.getID());
		
		return attachmentItem.getID();
	}
	
	
	/*
	 * Since we have to load the content into the browser to get the
	 * character set (at least until we figure out a better way to get
	 * at the native detectors), we create the item above and update
	 * asynchronously after the fact
	 */
	function _postProcessFile(itemID, file, mimeType){
		var ext = Zotero.File.getExtension(file);
		if (mimeType.substr(0, 5)!='text/' ||
			!Zotero.MIME.hasInternalHandler(mimeType, ext)){
			return false;
		}
		
		var browser = Zotero.Browser.createHiddenBrowser();
		
		Zotero.File.addCharsetListener(browser, new function(){
			return function(charset, id){
				var charsetID = Zotero.CharacterSets.getID(charset);
				if (charsetID){
					var sql = "UPDATE itemAttachments SET charsetID=" + charsetID
						+ " WHERE itemID=" + itemID;
					Zotero.DB.query(sql);
				}
				
				// Chain fulltext indexer inside the charset callback,
				// since it's asynchronous and a prerequisite
				Zotero.Fulltext.indexDocument(browser.contentDocument, itemID);
				Zotero.Browser.deleteHiddenBrowser(browser);
			}
		}, itemID);
		
		var url = Components.classes["@mozilla.org/network/protocol;1?name=file"]
					.getService(Components.interfaces.nsIFileProtocolHandler)
					.getURLSpecFromFile(file);
		browser.loadURI(url);
	}
}