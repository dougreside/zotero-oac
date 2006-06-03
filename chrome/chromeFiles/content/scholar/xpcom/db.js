/*
 * DB connection and schema management class
 */
Scholar.DB = new function(){
	// Private members
	var _connection;
	var _transactionRollback;
	var _transactionNestingLevel = 0;
	
	// Privileged methods
	this.query = query;
	this.valueQuery = valueQuery;
	this.rowQuery = rowQuery;
	this.columnQuery = columnQuery;
	this.statementQuery = statementQuery;
	this.getColumns = getColumns;
	this.getColumnHash = getColumnHash;
	this.updateSchema = updateSchema;
	this.beginTransaction = beginTransaction;
	this.commitTransaction = commitTransaction;
	this.rollbackTransaction = rollbackTransaction;
	this.transactionInProgress = transactionInProgress;
	
	/////////////////////////////////////////////////////////////////
	//
	// Privileged methods
	//
	/////////////////////////////////////////////////////////////////
	
	/*
	 * Run an SQL query
	 *
	 *  Optional _params_ is an array of bind parameters in the form
	 *		[{'int':2},{'string':'foobar'}]
	 *
	 * 	Returns:
	 *  	 - Associative array (similar to mysql_fetch_assoc) for SELECT's
	 *	 - lastInsertId for INSERT's
	 *	 - TRUE for other successful queries
	 *	 - FALSE on error
	 */
	function query(sql,params){
		var db = _getDBConnection();
		
		try {
			// Parse out the SQL command being used
			var op = sql.match(/^[^a-z]*[^ ]+/i);
			if (op){
				op = op.toString().toLowerCase();
			}
			
			// If SELECT statement, return result
			if (op=='select'){
				// Until the native dataset methods work (or at least exist),
				// we build a multi-dimensional associative array manually
				
				var statement = statementQuery(sql,params);
				
				var dataset = new Array();
				while (statement.executeStep()){
					var row = new Array();
					for(var i=0; i<statement.columnCount; i++) {
						row[statement.getColumnName(i)] = statement.getUTF8String(i);
					}
					dataset.push(row);
				}
				statement.reset();
				
				return dataset.length ? dataset : false;
			}
			else {
				if (params){
					var statement = statementQuery(sql,params);
					statement.execute();
				}
				else {
					Scholar.debug(sql,5);
					db.executeSimpleSQL(sql);
				}
				
				if (op=='insert'){
					return db.lastInsertRowID;
				}
				// DEBUG: Can't get affected rows for UPDATE or DELETE?
				else {
					return true;
				}
			}
		}
		catch (e){
			throw(e + ' [QUERY: ' + sql + '] [ERROR: ' + db.lastErrorString + ']');
		}
	}
	
	
	/*
	 * Query a single value and return it
	 */
	function valueQuery(sql,params){
		var db = _getDBConnection();
		try {
			var statement = statementQuery(sql,params);
		}
		catch (e){
			throw(db.lastErrorString);
		}
		
		// No rows
		if (!statement.executeStep()){
			statement.reset();
			return false;
		}
		if (sql.indexOf('SELECT COUNT(*)') > -1){
			var value = statement.getInt32(0);
		}
		else {
			var value = statement.getUTF8String(0);
		}
		statement.reset();
		return value;
	}
	
	
	/*
	 * Run a query and return the first row
	 */
	function rowQuery(sql,params){
		var result = query(sql,params);
		if (result){
			return result[0];
		}
	}
	
	
	/*
	 * Run a query and return the first column as a numerically-indexed array
	 */
	function columnQuery(sql,params){
		var statement = statementQuery(sql,params);
		
		if (statement){
			var column = new Array();
			while (statement.executeStep()){
				column.push(statement.getUTF8String(0));
			}
			statement.reset();
			return column.length ? column : false;
		}
		return false;
	}
	
	
	/*
	 * Run a query, returning a mozIStorageStatement for direct manipulation
	 *
	 *  Optional _params_ is an array of bind parameters in the form
	 *		[{'int':2},{'string':'foobar'}]
	 */
	function statementQuery(sql,params){
		var db = _getDBConnection();
		
		try {
			Scholar.debug(sql,5);
			var statement = db.createStatement(sql);
		}
		catch (e){
			throw('[QUERY: ' + sql + '] [ERROR: ' + db.lastErrorString + ']');
		}
		
		if (statement && params){
			for (var i=0; i<params.length; i++){
				// Int
				if (typeof params[i]['int'] != 'undefined'){
					Scholar.debug('Binding parameter ' + (i+1) + ' of type int: ' +
						params[i]['int'],5);
					statement.bindInt32Parameter(i,params[i]['int']);
				}
				// String
				else if (typeof params[i]['string'] != 'undefined'){
					Scholar.debug('Binding parameter ' + (i+1) + ' of type string: "' +
						params[i]['string'] + '"',5);
					statement.bindUTF8StringParameter(i,params[i]['string']);
				}
				// Null
				else if (typeof params[i]['null'] != 'undefined'){
					Scholar.debug('Binding parameter ' + (i+1) + ' of type NULL', 5);
					statement.bindNullParameter(i);
				}
			}
		}
		return statement;
	}
	
	
	function beginTransaction(){
		var db = _getDBConnection();
		
		if (db.transactionInProgress){
			_transactionNestingLevel++;
			Scholar.debug('Transaction in progress -- increasing level to '
				+ _transactionNestingLevel, 5);
		}
		else {
			Scholar.debug('Beginning DB transaction', 5);
			db.beginTransaction();
		}
	}
	
	
	function commitTransaction(){
		var db = _getDBConnection();
		
		if (_transactionNestingLevel){
			_transactionNestingLevel--;
			Scholar.debug('Decreasing transaction level to ' + _transactionNestingLevel, 5);
		}
		else if (_transactionRollback){
			Scholar.debug('Rolling back previously flagged transaction', 5);
			db.rollbackTransaction();
		}
		else {
			Scholar.debug('Committing transaction',5);
			db.commitTransaction();
		}
	}
	
	
	function rollbackTransaction(){
		var db = _getDBConnection();
		
		if (_transactionNestingLevel){
			Scholar.debug('Flagging nested transaction for rollback', 5);
			_transactionRollback = true;
		}
		else {
			Scholar.debug('Rolling back transaction', 5);
			_transactionRollback = false;
			db.rollbackTransaction();
		}
	}
	
	
	function transactionInProgress(){
		var db = _getDBConnection();
		return db.transactionInProgress;
	}
	
	
	function getColumns(table){
		var db = _getDBConnection();
		
		try {
			var sql = "SELECT * FROM " + table + " LIMIT 1";
			var statement = statementQuery(sql);
			
			var cols = new Array();
			for (var i=0,len=statement.columnCount; i<len; i++){
				cols.push(statement.getColumnName(i));
			}
			return cols;
		}
		catch (e){
			Scholar.debug(e,1);
			return false;
		}
	}
	
	
	function getColumnHash(table){
		var cols = getColumns(table);
		var hash = new Array();
		if (cols.length){
			for (var i=0; i<cols.length; i++){
				hash[cols[i]] = true;
			}
		}
		return hash;
	}
	
	/*
	 * Checks if the DB schema exists and is up-to-date, updating if necessary
	 */
	function updateSchema(){
		var DBVersion = _getDBVersion();
		
		if (DBVersion > SCHOLAR_CONFIG['DB_VERSION']){
			throw("Scholar DB version is newer than config version");
		}
		else if (DBVersion < SCHOLAR_CONFIG['DB_VERSION']){
			if (!DBVersion){
				Scholar.debug('Database does not exist -- creating\n');
				return _initializeSchema();
			}
			
			return _migrateSchema(DBVersion);
		}
		else if (SCHOLAR_CONFIG['DB_REBUILD']){
			if (confirm('Erase all data and recreate database from schema?')){
				return _initializeSchema();
			}
		}
	}
	
	
	
	/////////////////////////////////////////////////////////////////
	//
	// Private methods
	//
	/////////////////////////////////////////////////////////////////
	
	/*
	 * Retrieve a link to the data store
	 */
	function _getDBConnection(){
		if (_connection){
			return _connection;
		}
		
		// Get the storage service
		var store = Components.classes["@mozilla.org/storage/service;1"].
			getService(Components.interfaces.mozIStorageService);
		
		// Get the profile directory
		var file = Components.classes["@mozilla.org/file/directory_service;1"]
			.getService(Components.interfaces.nsIProperties)
			.get("ProfD", Components.interfaces.nsILocalFile);
		
		// This makes file point to PROFILE_DIR/<scholar database file>
		file.append(SCHOLAR_CONFIG['DB_FILE']);
		
		_connection = store.openDatabase(file);
		
		return _connection;
	}
	
	
	/*
	 * Retrieve the DB schema version
	 */
	function _getDBVersion(){
		if (_getDBConnection().tableExists('version')){
			return valueQuery("SELECT version FROM version;");
		}
		return false;
	}
	
	
	/*
	 * Load in SQL schema
	 *
	 * Returns an _array_ of SQL statements for feeding into query()
	 */
	function _getSchemaSQL(){
		// We pull the schema from an external file so we only have to process
		// it when necessary
		var file = Components.classes["@mozilla.org/extensions/manager;1"]
                    .getService(Components.interfaces.nsIExtensionManager)
                    .getInstallLocation(SCHOLAR_CONFIG['GUID'])
                    .getItemLocation(SCHOLAR_CONFIG['GUID']); 
		file.append('schema.sql');
		
		// Open an input stream from file
		var istream = Components.classes["@mozilla.org/network/file-input-stream;1"]
			.createInstance(Components.interfaces.nsIFileInputStream);
		istream.init(file, 0x01, 0444, 0);
		istream.QueryInterface(Components.interfaces.nsILineInputStream);
		
		var line = {}, sql = '', hasmore;
		
		// Fetch the schema version from the first line of the file
		istream.readLine(line);
		var schemaVersion = line.value.match(/-- ([0-9]+)/)[1];
		
		do {
			hasmore = istream.readLine(line);
			sql += line.value + "\n";
		} while(hasmore);
		
		istream.close();
		
		if (schemaVersion!=SCHOLAR_CONFIG['DB_VERSION']){
			throw("Scholar config version does not match schema version");
		}
		
		return sql;
	}
	
	
	/*
	 * Retrieve the version attribute of the schema SQL XML
	 */
	function _getSchemaSQLVersion(){
		var file = Components.classes["@mozilla.org/extensions/manager;1"]
                    .getService(Components.interfaces.nsIExtensionManager)
                    .getInstallLocation(SCHOLAR_CONFIG['GUID'])
                    .getItemLocation(SCHOLAR_CONFIG['GUID']); 
		file.append('schema.sql');
		
		// Open an input stream from file
		var istream = Components.classes["@mozilla.org/network/file-input-stream;1"]
			.createInstance(Components.interfaces.nsIFileInputStream);
		istream.init(file, 0x01, 0444, 0);
		istream.QueryInterface(Components.interfaces.nsILineInputStream);
		
		var line = {};
		
		// Fetch the schema version from the first line of the file
		istream.readLine(line);
		var schemaVersion = line.value.match(/-- ([0-9]+)/)[1];
		istream.close();
		
		return schemaVersion;
	}
	
	
	/*
	 * Create new DB schema
	 */
	function _initializeSchema(){
		try {
			beginTransaction();
			var sql = _getSchemaSQL();
			query(sql);
			query("INSERT INTO version VALUES (" + SCHOLAR_CONFIG['DB_VERSION'] + ")");
			commitTransaction();
		}
		catch(e){
			alert(e);
			rollbackTransaction();
		}
	}
	
	
	/*
	 * Migrate schema from an older version, preserving data
	 */
	function _migrateSchema(fromVersion){
		var toVersion = SCHOLAR_CONFIG['DB_VERSION'];
		var schemaVersion = _getSchemaSQLVersion();
		
		if (toVersion!=schemaVersion){
			throw("Scholar config version does not match schema version");
		}
		
		Scholar.debug('Updating DB from version ' + fromVersion + ' to ' + toVersion + '\n');
		
		// Step through version changes until we reach the current version
		//
		// Each block performs the changes necessary to move from the
		// previous revision to that one.
		//
		// N.B. Be sure to call _updateDBVersion(i) at the end of each block and
		// update SCHOLAR_CONFIG['DB_VERSION'] to the target version
		for (var i=parseInt(fromVersion) + 1; i<=toVersion; i++){
			
			if (i==9){
				Scholar.DB.query("DROP TABLE IF EXISTS objectCreators; "
					+ "DROP TABLE IF EXISTS objectData; DROP TABLE IF EXISTS objectKeywords; "
					+ "DROP TABLE IF EXISTS objectTypeFields; DROP TABLE IF EXISTS objectTypes; "
					+ "DROP TABLE IF EXISTS objects; DROP TABLE IF EXISTS treeOrder;");
				_updateDBVersion(i);
			}
			
			// For now, just wipe and recreate
			if (i==12){
				Scholar.DB.query("DROP TABLE IF EXISTS folders; "
					+ "DROP TABLE IF EXISTS treeStructure;");
				_initializeSchema();
			}
			
			if (i==13){
				// do stuff
				// _updateDBVersion(i);
			}
		}
	}
	
	
	/*
	 * Update the DB schema version tag of an existing database
	 */
	function _updateDBVersion(version){
		return query("UPDATE version SET version=" + version);
	}
}
