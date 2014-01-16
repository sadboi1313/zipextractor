/**
 * ZIP Extractor Presenter. Controls flow of the app, updates the view.
 * 
 * Depends on: 
 *   zipextractor.state.SessionState
 *   zipextractor.util
 *   zipextractor.Model
 *   zipextractor.View
 *   driveapi.AuthManager
 *   driveapi.UrilStateParser
 *   driveApi.FileManager
 */

zipextractor.Presenter = function(appConfig) {
    this.appConfig_ = appConfig;

    this.model_ = new zipextractor.Model();
    this.urlStateParser_ = new driveapi.UrlStateParser();
    this.zipReader_ = new zipextractor.ZipReader();
    this.authManager_ = new driveapi.AuthManager(appConfig);
    this.fileManager_ = new driveapi.FileManager(this.authManager_);    

    var pickerManager = new zipextractor.util.PickerManager(appConfig, this.authManager_);
    this.view_ = new zipextractor.View(this, pickerManager);    

    this.state_ = zipextractor.state.SessionState.DEFAULT;    

    this.htmlBodyLoaded_ = false;
    this.apiLoaded_ = false;
    this.sharingLoaded_ = false;
    this.currentSession_ = null; 
};


/**
 * Handles when body onload() event is fired in the main HTML page.
 */
zipextractor.Presenter.prototype.onHtmlBodyLoaded = function() {
    this.htmlBodyLoaded_ = true;
    this.view_.init();
    
    if (!this.checkBrowser_()) {
        this.setState_(zipextractor.state.SessionState.UNSUPPORTED_BROWSER);
        return;
    }
    
    if (this.apiLoaded_) {
        this.authorize_(true /* isInvokedByApp */);
    }
};
 

/**
 * Handles when the Google JS API has loaded.
 */
zipextractor.Presenter.prototype.onGapiClientLoaded = function() {   
    if (!this.checkBrowser_()) {
        this.setState_(zipextractor.state.SessionState.UNSUPPORTED_BROWSER);
        return;
    }    
    
    this.apiLoaded_ = true;
    this.setState_(zipextractor.state.SessionState.API_LOADED);
    
    if (this.htmlBodyLoaded_) {
        this.authorize_(true /* isInvokedByApp */);        
    }
    
    // Load sharing widget.
    gapi.load('drive-share', zipextractor.util.bindFn(this.sharingLoadComplete_, this));
};


zipextractor.Presenter.prototype.sharingLoadComplete_ = function() {
    this.sharingLoaded_ = true;
};


// TODO: Should this be in the view?
zipextractor.Presenter.prototype.showSharingDialog_ = function(id) {
    var sharingDialog = new gapi.drive.share.ShareClient(this.appConfig_.getAppId());
    sharingDialog.setItemIds([id]);
    sharingDialog.showSettingsDialog();
};

zipextractor.Presenter.prototype.checkBrowser_ = function() {
    var isIE = zipextractor.util.isIE();
    return !isIE || (isIE && !(isIE <= 9));
};


zipextractor.Presenter.prototype.init = function() {
  // First initialization of the view.
  // TODO: This may be redundant with construction.
  this.setState_(zipextractor.state.SessionState.INIT);
};


zipextractor.Presenter.prototype.updateEntryState = function(entry, newState) {
    var oldState = entry.state;
    entry.state = newState;
    this.view_.updateEntryState(entry, newState, oldState);
};


zipextractor.Presenter.prototype.setState_ = function(newState, opt_data) {
    var oldState = this.state_;
    this.state_ = newState;
    this.view_.updateState(newState, oldState, opt_data);
};


zipextractor.Presenter.prototype.authorize_ = function(isInvokedByApp) {
    var state = isInvokedByApp ?
        zipextractor.state.SessionState.AUTH_PENDING_AUTO :
        zipextractor.state.SessionState.AUTH_PENDING_USER;
    this.setState_(state);

    this.authManager_.authorize(
        isInvokedByApp, 
        zipextractor.util.bindFn(this.handleAuthResult_, this));
};
 
 
zipextractor.Presenter.prototype.handleAuthResult_ = function(authResult) {
    if (authResult) {
        if (authResult.error) {
            this.setState_(zipextractor.state.SessionState.AUTH_ERROR, authResult.error);
        } else {
            this.setState_(zipextractor.state.SessionState.AUTH_SUCCESS);
            this.processRequestFromState_();            
        }
    } else {
        this.setState_(zipextractor.state.SessionState.AUTH_REQUIRED);
    }
};


zipextractor.Presenter.prototype.processRequestFromState_ = function() {
    this.setState_(zipextractor.state.SessionState.READ_URL_STATE);
    this.urlStateParser_.parseState();
    
   if (this.urlStateParser_.isForOpen()) {
        // Download the file, read the ZIP, update UI.
        this.extractDriveFile_(this.urlStateParser_.getFileId());
    } else {
        // Create New scenario, launched in zero state; setup new session UI.
        this.view_.updatePageTitle();
        this.setState_(zipextractor.state.SessionState.NEW_SESSION);
    }
};


zipextractor.Presenter.prototype.extractDriveFile_ = function(id) {
    this.setState_(zipextractor.state.SessionState.DOWNLOADING_METADATA);
    var callbacks = this.fileManager_.generateCallbacks(
        zipextractor.util.bindFn(this.onDownloadSuccess_, this),
        zipextractor.util.bindFn(this.onDownloadError_, this),
        zipextractor.util.bindFn(this.onDownloadProgress_, this),
        zipextractor.util.bindFn(this.onDownloadAborted_, this));
        
    this.fileManager_.download(
        id, 
        zipextractor.util.bindFn(this.onDriveFileMetadataAvailable_, this),
        callbacks);
};


zipextractor.Presenter.prototype.onDriveFileMetadataAvailable_ = function(file) {
    this.setState_(zipextractor.state.SessionState.DOWNLOADING, file.title);
};


zipextractor.Presenter.prototype.onDownloadSuccess_ = function(filename, blob) {
    this.setState_(zipextractor.state.SessionState.DOWNLOADED);
    this.initModel_(filename, blob);
};


zipextractor.Presenter.prototype.onDownloadError_ = function(error, message) {
    this.setState_(zipextractor.state.SessionState.DOWNLOAD_ERROR, message);
};


zipextractor.Presenter.prototype.onDownloadProgress_ = function(current, total) {
    this.view_.handleDownloadProgress(current, total);
    
    if (current === total) {
        this.setState_(zipextractor.state.SessionState.DOWNLOAD_ALL_BYTES_TRANSFERRED);
    }
};


zipextractor.Presenter.prototype.onDownloadAborted_ = function() {
    this.handleDownloadCanceled_();
};


zipextractor.Presenter.prototype.handleDownloadCanceled_ = function() {
    this.setState_(zipextractor.state.SessionState.DOWNLOAD_CANCELED);
};

 
zipextractor.Presenter.prototype.initModel_ = function(filename, blob) {
    this.view_.updatePageTitle(filename);
    this.setState_(zipextractor.state.SessionState.ZIP_READING);
    this.model_.setFilename(filename);
    
    this.zipReader_.read(
        blob, 
        zipextractor.util.bindFn(this.zipReadSuccess_, this),
        zipextractor.util.bindFn(this.zipReadError_, this));
};


zipextractor.Presenter.prototype.zipReadError_ = function(err) {
    // This is also called on a ZIP decompression error, including failed CRC checks.
    this.setState_(zipextractor.state.SessionState.ZIP_READ_ERROR, err);
};


zipextractor.Presenter.prototype.zipReadSuccess_ = function(entries) {
    this.setState_(zipextractor.state.SessionState.MODEL_BUILDING);
    this.model_.build(entries, zipextractor.util.bindFn(this.modelBuildComplete_, this));
};


zipextractor.Presenter.prototype.modelBuildComplete_ = function() {
    // TODO: Verify that we need to pass the model in this way.
    this.setState_(zipextractor.state.SessionState.MODEL_BUILT, this.model_);    
    this.setState_(
        zipextractor.state.SessionState.RENDER_ZIP_UI, 
        zipextractor.util.bindFn(this.zipUiRenderComplete_, this));    
};


zipextractor.Presenter.prototype.zipUiRenderComplete_ = function() {
    this.createSession_();
    this.setState_(zipextractor.state.SessionState.PENDING_USER_INPUT);
};


zipextractor.Presenter.prototype.createSession_ = function() {
    this.currentSession_ = new zipextractor.Session(
        this,
        this.model_, 
        this.view_, 
        this.urlStateParser_.getFolderId(),
        this.fileManager_);
};


zipextractor.Presenter.prototype.extract_ = function(isForRetry) {
    this.setState_(zipextractor.state.SessionState.EXTRACTING, this.model_.getEntryTree());
    this.currentSession_.execute(isForRetry);
};


zipextractor.Presenter.prototype.reset_ = function() {
    if (this.currentSession_) {
        this.currentSession_.close();
        this.currentSession_ = null;
        this.model_.clear(); 
    }
};


zipextractor.Presenter.prototype.VIEW__authRequested = function() {
    this.authorize_(false /* isInvokedByApp */);
};


zipextractor.Presenter.prototype.VIEW__driveFileChosen = function(id) {
    this.extractDriveFile_(id);
};


zipextractor.Presenter.prototype.VIEW__driveFolderChosen = function(id) {
    this.currentSession_.setParentId(id);
};


zipextractor.Presenter.prototype.VIEW__localBlobChosen = function(filename, blob) {
    this.initModel_(filename, blob);
};


zipextractor.Presenter.prototype.VIEW__extractNow = function() {
    this.extract_(false /* isForRetry */);
};


zipextractor.Presenter.prototype.VIEW__cancelSession = function() {
    this.setState_(zipextractor.state.SessionState.SESSION_CANCELED);    
    this.reset_();
    
    // Perhaps put these two under 'this.startNewSession_()'.
    this.view_.updatePageTitle();
    this.setState_(zipextractor.state.SessionState.NEW_SESSION);
};


zipextractor.Presenter.prototype.VIEW__reset = function() {
    // i.e., 'start over'
    this.reset_();
    this.view_.updatePageTitle();
    this.setState_(zipextractor.state.SessionState.NEW_SESSION);
};


zipextractor.Presenter.prototype.VIEW__cancelExtraction = function() {
    this.setState_(zipextractor.state.SessionState.EXTRACTION_CANCEL_REQUESTED);
    this.currentSession_.abort();
};


zipextractor.Presenter.prototype.SESSION__extractionComplete = function() {
    this.setState_(zipextractor.state.SessionState.EXTRACTION_COMPLETE, this.currentSession_.hasErrors());
};


zipextractor.Presenter.prototype.SESSION__extractionCanceled = function() {
    this.setState_(zipextractor.state.SessionState.EXTRACTION_CANCELED);
};


zipextractor.Presenter.prototype.VIEW__shareExtractedFiles = function() {
    var parentId = this.getNewParentId_();
    if (parentId) {
        if (this.sharingLoaded_) {
            this.showSharingDialog_(this.getNewParentId_());
        }
    }
};


zipextractor.Presenter.prototype.VIEW__viewExtractedFiles = function() {
    var url = zipextractor.util.createDriveFolderLink(this.getNewParentId_());
    var extractedFilesWindow = window.open(url, '_blank');
    extractedFilesWindow.focus();    
};


zipextractor.Presenter.prototype.VIEW__retryErrors = function() {
    this.extract_(true /* isForRetry */);
};


zipextractor.Presenter.prototype.VIEW__downloadBrowser = function(browser) {
    var browserUrl = null;
    switch (browser) {
        case 'chrome':
            browserUrl = 'http://www.google.com/chrome';
            break;
            
        case 'firefox':
            browserUrl = 'http://www.mozilla.org/en-US/firefox/new/';
            break;
            
        case 'ie':
            browserUrl = 'http://windows.microsoft.com/en-us/internet-explorer/download-ie';
            break;
    }
    
    if (browserUrl) {
        var browserDownloadWindow = window.open(browserUrl, '_blank');
        browserDownloadWindow.focus();    
    }
};


zipextractor.Presenter.prototype.VIEW__cancelDownload = function() {
    this.setState_(zipextractor.state.SessionState.CANCEL_DOWNLOAD_REQUESTED);
    var wasImmediatelyCanceled = this.fileManager_.abortDownload();
    
    // TODO - not needed - if get() and download() can both be canceled.
    /*
    if (wasImmediatelyCanceled) {
        this.handleDownloadCanceled_();
    }
    */
};


zipextractor.Presenter.prototype.getNewParentId_ = function() {
    // Get the 'folder' attribute on the root node of the entry tree.
    var entryTree = this.model_.getEntryTree();
    if (entryTree && entryTree.folder) {
        return entryTree.folder.id;
    } else if (this.currentSession_ && this.currentSession_.getParentId()) {
        return this.currentSession_.getParentId();
    } else {
        return null;   
    }
};
