/**
 * View for the Zip Extractor.
 * Depends on:
 *  zipextractor.Model
 *  zipextractor.Presenter
 *  zipextractor.Table
 *  zipextractor.PickerManager
 */
 
zipextractor.View = function(presenter, pickerManager) {
    this.model_ = null;
    this.presenter_ = presenter;    
    this.table_ = null;     
    this.pickerManager_ = pickerManager;    
    
    this.isInitialized_ = false;
        
    this.localFileInputEl = null;
    
    this.chooseFileFromDriveButton = null;
    this.chooseLocalFileButton = null;
    this.resetButton = null;
    this.viewFilesButton = null;
    this.retryErrorsButton = null;
    this.shareFilesButton = null;
    this.cancelDownloadButton = null;
    
    this.downloadChromeButton = null;
    this.downloadFirefoxButton = null;
    this.downloadIeButton = null;
    
    this.destinationEl = null;
    
    this.fileTableDiv = null;
    this.fileTableHeaderEl = null;
    this.fileTable = null;
     
    this.primaryStatus = null;
    this.primaryStatusSpinner = null;
    this.primaryStatusProgress = null;
    this.primaryStatusText = null;
    this.primaryStatusProgressBar = null;
    
    this.selectAllCheckbox = null;
    this.extractNowButton = null;
    this.changeDestinationFolderButton = null;
    this.cancelSessionButton = null; 
    this.cancelExtractionButton = null;
};


zipextractor.View.APP_NAME_ = 'ZIP Extractor';


/**
 * Called only after DOM has loaded, since attaching to elements.
 */
zipextractor.View.prototype.init = function() {
    if (this.isInitialized_) {
        throw ('Error: View already initialized.');
    }

    this.attachDom_();
    this.attachListeners_();
    this.table_ = new zipextractor.Table(this.fileTable);
    this.isInitialized_ = true;
};


zipextractor.View.prototype.attachDom_ = function() {
    this.authButton = document.getElementById('authorizeButton');

    this.localFileInputEl = document.getElementById('filePicker');
    
    this.chooseFileFromDriveButton = document.getElementById('chooseFromDriveButton');
    this.chooseLocalFileButton = document.getElementById('chooseLocalFileButton');
    this.resetButton = document.getElementById('resetButton');  
    this.viewFilesButton = document.getElementById('viewFilesButton');
    this.retryErrorsButton = document.getElementById('retryErrorsButton');
    this.shareFilesButton = document.getElementById('shareFilesButton');
    this.cancelDownloadButton = document.getElementById('cancelDownloadButton');
    
    this.downloadChromeButton = document.getElementById('downloadChromeButton');
    this.downloadFirefoxButton = document.getElementById('downloadFirefoxButton');
    this.downloadIeButton = document.getElementById('downloadIeButton');
    
    
    this.destinationEl = document.getElementById('destinationFolderName');
    
    this.fileTableDiv = document.getElementById('fileTableDiv');
     
    this.primaryStatus = document.getElementById('primaryStatus');
    this.primaryStatusSpinner = document.getElementById('primaryStatusSpinner');
    this.primaryStatusProgress = document.getElementById('primaryStatusProgress');
    this.primaryStatusText = document.getElementById('primaryStatusText');    
    // this.primaryStatusProgressPercent = document.getElementById('primaryStatusProgressPercent');
    this.primaryStatusProgressBar = document.getElementById('primaryStatusProgressBar');
    
    this.selectAllCheckbox = document.getElementById('selectAllCheckbox');
    this.extractNowButton = document.getElementById('extractNowButton');
    this.changeDestinationFolderButton = document.getElementById('changeDestinationFolderButton');
    this.cancelSessionButton = document.getElementById('cancelSessionButton');
    this.cancelExtractionButton = document.getElementById('cancelExtractionButton');
    
    this.fileTable = document.getElementById('fileTable');
    this.fileTableHeaderEl = document.getElementById('fileTableHeaderCaption');
};


zipextractor.View.prototype.attachListeners_ = function() {
    this.chooseLocalFileButton.onclick = zipextractor.util.bindFn(this.handleChooseLocalFile_, this);
    this.localFileInputEl.onchange = zipextractor.util.bindFn(this.handleLocalFileInputElChange_, this);    
    this.chooseFileFromDriveButton.onclick = zipextractor.util.bindFn(this.chooseFileFromDriveButtonClick_, this);
    this.changeDestinationFolderButton.onclick = zipextractor.util.bindFn(this.changeDestinationFolderButtonClick_, this); 
    this.resetButton.onclick = zipextractor.util.bindFn(this.handleResetButtonClick_, this);  
    this.authButton.onclick = zipextractor.util.bindFn(this.handleAuthButtonClick_, this);
    this.cancelSessionButton.onclick = zipextractor.util.bindFn(this.handleCancelSessionButtonClick_, this);
    this.extractNowButton.onclick = zipextractor.util.bindFn(this.handleExtractNowButtonClick_, this);
    this.cancelExtractionButton.onclick = zipextractor.util.bindFn(this.handleCancelExtractionButtonClick_, this);
    this.shareFilesButton.onclick = zipextractor.util.bindFn(this.handleShareFilesButtonClick_, this);
    this.viewFilesButton.onclick = zipextractor.util.bindFn(this.handleViewFilesButtonClick_, this);
    this.retryErrorsButton.onclick = zipextractor.util.bindFn(this.handleRetryErrorsButtonClick_, this);
    this.cancelDownloadButton.onclick = zipextractor.util.bindFn(this.handleCancelDownloadButtonClick_, this);
    this.downloadChromeButton.onclick = zipextractor.util.bindFn(this.handleDownloadChromeButtonClick_, this);
    this.downloadFirefoxButton.onclick = zipextractor.util.bindFn(this.handleDownloadFirefoxButtonClick_, this);
    this.downloadIeButton.onclick = zipextractor.util.bindFn(this.handleDownloadIeButtonClick_, this);
    this.selectAllCheckbox.onclick = zipextractor.util.bindFn(this.handleSelectAllCheckboxClick_, this);
};


zipextractor.View.prototype.isSelected = function(entry) {
    return this.table_.isChecked(entry);
};


zipextractor.View.prototype.updateState = function(newState, oldState, opt_data) {
    if (!this.isInitialized_) {
        return;
    }
    
    switch (newState) {
        case zipextractor.state.SessionState.API_LOADED:
            break;
            
        case zipextractor.state.SessionState.UNSUPPORTED_BROWSER:
            this.updatePrimaryStatus_(true, false, 'Your browser version is not supported by ZIP Extractor. Please upgrade your browser.');
            this.showEl_(this.downloadChromeButton, true);
            this.showEl_(this.downloadFirefoxButton, true);    
            this.showEl_(this.downloadIeButton, true);    
            break;            

        case zipextractor.state.SessionState.READ_URL_STATE:
            break;

        case zipextractor.state.SessionState.AUTH_PENDING_AUTO:
            this.updatePrimaryStatus_(true, true, 'Checking authorization...');
            break;
            
        case zipextractor.state.SessionState.AUTH_PENDING_USER:
            this.authButton.disabled = true;
            this.updatePrimaryStatus_(true, true, 'Authorization pending... (Click "Accept" in ' + 
            'the popup window to authorize ZIP Extractor to use Google Drive.)');
            break;            
            
        case zipextractor.state.SessionState.AUTH_ERROR:
            this.authButton.disabled = false;
            this.updatePrimaryStatus_(true, false, 'Authorization error: ' + opt_data);
            break;            
            
        case zipextractor.state.SessionState.AUTH_SUCCESS:
            this.authButton.disabled = true;
            this.showEl_(this.authButton, false);
            break;

        case zipextractor.state.SessionState.AUTH_REQUIRED:
            this.updatePrimaryStatus_(
                true, false, 'Please authorize ZIP Extractor to access to Google Drive. ' + 
                '(Click "Authorize" below.)');
            this.authButton.disabled = false;
            this.showEl_(this.authButton, true);
            break;
            
        case zipextractor.state.SessionState.CANCEL_DOWNLOAD_REQUESTED:
            this.enableEl_(this.cancelDownloadButton, false);    
            break;
            
        case zipextractor.state.SessionState.DOWNLOAD_CANCELED:
            this.showEl_(this.cancelDownloadButton, false) 
            this.showEl_(this.resetButton, true);
            this.updatePrimaryStatus_(true, false, 'Download canceled.');
            break;
                        
        case zipextractor.state.SessionState.DOWNLOADING_METADATA:
            this.showEl_(this.chooseFileFromDriveButton, false);
            this.showEl_(this.chooseLocalFileButton, false);    
            this.showEl_(this.cancelDownloadButton, true);    
            this.enableEl_(this.cancelDownloadButton, true);    
            
            this.updatePrimaryStatus_(true, true, 'Preparing to download file...');
            break;
            
        case zipextractor.state.SessionState.DOWNLOADING:
            var statusText = 'Downloading "' + opt_data + '" from Google Drive...';
            this.updatePrimaryStatus_(true, true, statusText);
            this.handleDownloadProgress(0, 100);
            break;
            
        case zipextractor.state.SessionState.DOWNLOAD_ALL_BYTES_TRANSFERRED:
            this.updatePrimaryStatus_(true, false, 'Finishing download...');
            break;                        
            
        case zipextractor.state.SessionState.DOWNLOADED:
            this.updatePrimaryStatus_(true, false, 'File downloaded.');
            break;

        case zipextractor.state.SessionState.DOWNLOAD_ERROR:
            this.updateUiForDownloadError_(opt_data);
            break;

        case zipextractor.state.SessionState.INIT:
            // Can't update UI at this point in the session.
            break;
            
        case zipextractor.state.SessionState.ZIP_READ_ERROR:
            this.updatePrimaryStatus_(true, false, 'Error reading ZIP file: ' + opt_data);
            this.enableEl_(this.chooseFileFromDriveButton, true);
            this.enableEl_(this.chooseLocalFileButton, true);    
            break;
            
        case zipextractor.state.SessionState.MODEL_BUILDING:
            this.updatePrimaryStatus_(true, true, 'Processing ZIP file...');
            break;            

        case zipextractor.state.SessionState.MODEL_BUILT:
            this.model_ = opt_data;
            break;
            
        case zipextractor.state.SessionState.SESSION_CANCELED:
            break;
            
        case zipextractor.state.SessionState.EXTRACTION_CANCEL_REQUESTED:
            this.updateUiForExtractionCancelRequested_();
            break;
            
        case zipextractor.state.SessionState.EXTRACTION_CANCELED:
            this.updateUiForExtractionCanceled_();
            break;            
                        
        case zipextractor.state.SessionState.RENDER_ZIP_UI:
            this.renderZipTableUi_(opt_data /* callback */);
            break;            
            
        case zipextractor.state.SessionState.PENDING_USER_INPUT:
            this.promptToExtract_();
            break;
            
        case zipextractor.state.SessionState.ZIP_READING:
            this.updatePrimaryStatus_(true, true, 'Reading ZIP file...');
            this.enableEl_(this.chooseFileFromDriveButton, false);
            this.enableEl_(this.chooseLocalFileButton, false);                
            break;           
            
        case zipextractor.state.SessionState.EXTRACTING:
            this.updateUiForExtractionStart_(opt_data);
            this.handleSessionProgress(0, 100);
            break;         
      
        case zipextractor.state.SessionState.NEW_SESSION:
            this.setupForNewSession_();
            break;
            
        case zipextractor.state.SessionState.EXTRACTION_COMPLETE:
            this.updateUiForExtractionComplete_(opt_data /* hasErrors */);
            break;

        default:
            throw('Unexpected state: ' + newState);   
    }
};


zipextractor.View.prototype.updateEntryState = function(entry, newState, oldState) {
    var progress = null;
    
    switch (newState) {
        case zipextractor.state.EntryState.QUEUED:
            break;
            
        case zipextractor.state.EntryState.QUEUED_PENDING_RETRY:
            break;

        case zipextractor.state.EntryState.SKIPPED:
            break;            
            
        case zipextractor.state.EntryState.PENDING:
            break;
            
        case zipextractor.state.EntryState.CANCELED:
            break;            

        case zipextractor.state.EntryState.BEGIN_UPLOAD:
            break;

        case zipextractor.state.EntryState.UPLOAD_PROGRESS:
            progress = Math.round((100 * entry.uploadCurrent) / entry.uploadTotal) + '%';
            break;
            
        case zipextractor.state.EntryState.UPLOAD_ALL_BYTES_TRANSFERRED:
            break;

        case zipextractor.state.EntryState.UPLOAD_COMPLETE:
            break;
            
        case zipextractor.state.EntryState.UPLOAD_ERROR:
            break;
            
        case zipextractor.state.EntryState.UPLOAD_ABORTED:
            break;
                        
        case zipextractor.state.EntryState.BEGIN_DECOMPRESSION:
            break;

        case zipextractor.state.EntryState.DECOMPRESSION_PROGRESS:
            progress = Math.round((100 * entry.decompressionCurrent) / entry.decompressionTotal) + '%';
            break;

        case zipextractor.state.EntryState.DECOMPRESSION_COMPLETE:
            break;
            
        // TODO: Decompression error possible via try/catch? Corrupted ZIP file?
            
       default:
            throw('Unexpected state: ' + newState);   
    }
    
    this.table_.updateEntryState(entry, newState, progress);
};


// TODO - make a 'download progress' state (?)
zipextractor.View.prototype.handleDownloadProgress = function(current, total) {
    var percent = (100 * (current / total));    
    this.updatePrimaryStatus_(true, false, '', true, true, Math.round(percent));
};


zipextractor.View.prototype.handleSessionProgress = function(current, total) {
    // TODO: Consider consolidating these methods.
    var percent = (100 * (current / total));    
    this.updatePrimaryStatus_(true, false, '', true, true, Math.round(percent));
};


zipextractor.View.prototype.updatePageTitle = function(filename) {
    document.title = filename ? 
        filename + ' - ' + zipextractor.View.APP_NAME_ : 
        zipextractor.View.APP_NAME_;
};


zipextractor.View.prototype.updateUiForFileComplete = function(entry, openUrl, iconUrl) {
    if (openUrl) {
        this.table_.updateEntryLink(entry, openUrl);
    }
    
    if (iconUrl) {
        this.table_.updateEntryIcon(entry, iconUrl);
    }
};


zipextractor.View.prototype.handleSelectAllCheckboxClick_ = function(e) {
    this.table_.handleSelectAllCheckboxClick(e.target.checked);
};

 
zipextractor.View.prototype.updatePrimaryStatus_ = 
    function(show, showSpinner, text, skipTextUpdate, showProgress, progressPercent) {

    if (!skipTextUpdate) {
        this.primaryStatusText.innerHTML = text || '';
    }
    
    this.showEl_(this.primaryStatusProgress, show);
    this.showEl_(this.primaryStatusSpinner, showSpinner);

    if (showProgress) {
        this.primaryStatusProgressBar.style.width = "" + progressPercent + "%";
    }
    
    this.showEl_(this.primaryStatusProgress, !!showProgress);
};


zipextractor.View.prototype.renderZipTableUi_ = function(callback) {
    this.fileTableHeaderEl.innerHTML = this.model_.getFilename();
    this.table_.generate(
        this.model_.getEntryTree(), 
        zipextractor.util.bindFn(this.zipTableUiRendered_, this, callback));
};


zipextractor.View.prototype.zipTableUiRendered_ = function(callback) {
    this.showEl_(this.fileTableDiv, true);
    callback();
};


zipextractor.View.prototype.updateUiForExtractionComplete_ = function(hasErrors) {
    this.showEl_(this.extractNowButton, false);
    this.showEl_(this.cancelExtractionButton, false);

    this.showEl_(this.viewFilesButton, true);
    this.showEl_(this.retryErrorsButton, hasErrors);
    this.showEl_(this.resetButton, true);
    
    if (!hasErrors) {
        // Can only share files if a parent folder was created.
        this.showEl_(this.shareFilesButton, this.table_.isRootEntryFolderCreated());
    }

    var extractionCompleteText = hasErrors ? 
        'Extraction complete, but with one or more errors.' :
        'Extraction complete.';
    this.updatePrimaryStatus_(true, false, extractionCompleteText);
};


zipextractor.View.prototype.updateUiForExtractionStart_ = function(entryTree) {
    this.showEl_(this.extractNowButton, false);
    this.showEl_(this.cancelSessionButton, false);
    this.showEl_(this.changeDestinationFolderButton, false);
    this.showEl_(this.cancelExtractionButton, true);
    this.enableEl_(this.cancelExtractionButton, true);
    
    this.showEl_(this.retryErrorsButton, false);
    this.showEl_(this.viewFilesButton, false);
    this.showEl_(this.resetButton, false);
    
    this.enableEl_(this.selectAllCheckbox, false);
    this.table_.lockForSession(entryTree);
    
    this.updatePrimaryStatus_(true, false, 'Extracting ZIP file to Drive...');
};


zipextractor.View.prototype.setupForNewSession_ = function() {
    this.showEl_(this.extractNowButton, false);
    this.showEl_(this.cancelSessionButton, false);
    this.showEl_(this.changeDestinationFolderButton, false);
    this.showEl_(this.viewFilesButton, false);
    this.showEl_(this.retryErrorsButton, false);
    this.showEl_(this.shareFilesButton, false);
    this.showEl_(this.resetButton, false);
    this.showEl_(this.cancelDownloadButton, false);
    this.showEl_(this.fileTableDiv, false);
    
    this.showEl_(this.chooseFileFromDriveButton, true);
    this.showEl_(this.chooseLocalFileButton, true);
    this.enableEl_(this.chooseFileFromDriveButton, true);
    this.enableEl_(this.chooseLocalFileButton, true);    
    
    this.table_.clear();
    this.enableEl_(this.selectAllCheckbox, true);
    
    this.updatePrimaryStatus_(true, false, 'Choose a ZIP file to extract.');
};


zipextractor.View.prototype.promptToExtract_ = function() {
    this.updatePrimaryStatus_(true, false, 'Ready to extract ZIP file.');

    this.showEl_(this.extractNowButton, true);
    this.showEl_(this.cancelSessionButton, true);
    this.showEl_(this.changeDestinationFolderButton, true);
    this.showEl_(this.chooseFileFromDriveButton, false);
    this.showEl_(this.chooseLocalFileButton, false);
    this.showEl_(this.cancelDownloadButton, false);
};


zipextractor.View.prototype.updateUiForExtractionCancelRequested_ = function() {
    this.enableEl_(this.cancelExtractionButton, false);    
    this.updatePrimaryStatus_(true, false, 'Canceling extraction...');
};


zipextractor.View.prototype.updateUiForExtractionCanceled_ = function() {
    this.showEl_(this.cancelExtractionButton, false);
    
    this.showEl_(this.viewFilesButton, true);
    this.showEl_(this.retryErrorsButton, false);
    this.showEl_(this.resetButton, true);
    
    this.updatePrimaryStatus_(true, false, 'Extraction canceled.');
};


zipextractor.View.prototype.updateUiForDownloadError_ = function(error) {
    this.showEl_(this.cancelDownloadButton, false);    
    this.showEl_(this.resetButton, true);
    
    this.updatePrimaryStatus_(true, false, 'Unable to download file. (' + error + ')');
};


zipextractor.View.prototype.updateDestinationFolderUi_ = function(name, link) {
    var statusHtml =  'Ready to extract ZIP file to "<a target="_blank" href="' + link + '">' + name + '</a>".';
    this.updatePrimaryStatus_(true, false, statusHtml);
};


zipextractor.View.prototype.handleChooseLocalFile_ = function(e) {
    this.localFileInputEl.click();
};


zipextractor.View.prototype.chooseFileFromDriveButtonClick_ = function(e) {
    this.pickerManager_.show(
        zipextractor.util.PickerManager.PickerMode.FILE, 
        zipextractor.util.bindFn(this.handlePickerFileSelected_, this));
};


zipextractor.View.prototype.changeDestinationFolderButtonClick_ = function(e) {
    this.pickerManager_.show(
        zipextractor.util.PickerManager.PickerMode.FOLDER, 
        zipextractor.util.bindFn(this.handlePickerFolderSelected_, this));
};


zipextractor.View.prototype.handlePickerFileSelected_ = function(name, id) {
    this.presenter_.VIEW__driveFileChosen(id);
};


zipextractor.View.prototype.handlePickerFolderSelected_ = function(name, id) {
    this.presenter_.VIEW__driveFolderChosen(id);
    this.updateDestinationFolderUi_(name, zipextractor.util.createDriveFolderLink(id)); 
};


zipextractor.View.prototype.handleLocalFileInputElChange_ = function(e) {
    var file = e.target.files[0];
    if (file) {
        this.presenter_.VIEW__localBlobChosen(file.name, file);
    }
};


zipextractor.View.prototype.handleAuthButtonClick_ = function(e) {
    this.presenter_.VIEW__authRequested();   
};


zipextractor.View.prototype.handleExtractNowButtonClick_ = function(e) {
    this.presenter_.VIEW__extractNow();   
};


zipextractor.View.prototype.handleCancelSessionButtonClick_ = function() {
    this.presenter_.VIEW__cancelSession();   
};


zipextractor.View.prototype.handleResetButtonClick_ = function() {
    this.presenter_.VIEW__reset();
};


zipextractor.View.prototype.showEl_ = function(el, show) {
    el.style.display = show ? '' : 'none';
};


zipextractor.View.prototype.enableEl_ = function(el, enable) {
    el.disabled = !enable;
};


zipextractor.View.prototype.handleCancelExtractionButtonClick_ = function(e) {
    this.presenter_.VIEW__cancelExtraction();
};


zipextractor.View.prototype.handleViewFilesButtonClick_ = function(e) {
    this.presenter_.VIEW__viewExtractedFiles();
};

zipextractor.View.prototype.handleRetryErrorsButtonClick_ = function(e) {
    this.presenter_.VIEW__retryErrors();
};


zipextractor.View.prototype.handleShareFilesButtonClick_ = function(e) {
    this.presenter_.VIEW__shareExtractedFiles();
};


zipextractor.View.prototype.handleCancelDownloadButtonClick_ = function(e) {
    this.presenter_.VIEW__cancelDownload();
};


zipextractor.View.prototype.handleDownloadChromeButtonClick_ = function(e) {
    this.presenter_.VIEW__downloadBrowser('chrome');
};


zipextractor.View.prototype.handleDownloadFirefoxButtonClick_ = function(e) {
    this.presenter_.VIEW__downloadBrowser('firefox');
};


zipextractor.View.prototype.handleDownloadIeButtonClick_ = function(e) {
    this.presenter_.VIEW__downloadBrowser('ie');
};

