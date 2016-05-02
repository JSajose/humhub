/**
 * This module provides an api for handling content objects e.g. Posts, Polls...
 *
 * @type undefined|Function
 */

humhub.initModule('content', function(module, require, $) {
    var client = require('client');
    var object = require('util').object;
    var actions = require('actions');
    var Component = actions.Component;
    
    var DATA_CONTENT_KEY = "content-key";
    var DATA_CONTENT_EDIT_URL = "content-edit-url";
    var DATA_CONTENT_SAVE_SELECTOR = "[data-content-save]";
    var DATA_CONTENT_DELETE_URL = "content-delete-url";
    
    
    var Content = function(container) {
        Component.call(this, container);
    };
    
    object.inherits(Content, Component);
    
    Content.prototype.actions = function() {
        return ['create','edit','delete'];
    };
    
    Content.prototype.getKey = function () {
        return this.$.data(DATA_CONTENT_KEY);
    };
    
    Content.prototype.create = function (addContentHandler) {
        //Note that this Content won't have an id, so the backend will create an instance
        if(this.hasAction('create')) {
            return;
        }
        
        this.edit(addContentHandler);
    };
    
    Content.prototype.edit = function (successHandler) {
        if(!this.hasAction('edit')) {
            return;
        }
        
        var editUrl = this.data(DATA_CONTENT_EDIT_URL);
        var contentId = this.getKey();
        var modal = require('ui.modal').global;
        
        if(!editUrl) {
            //Todo: handle error
            console.error('No editUrl found for edit content action editUrl: '+editUrl+ ' contentId '+contentId);
            return;
        }
   
        var that = this;
        
        client.ajax(editUrl, {
            data: {
                'id' : contentId
            },
            beforeSend: function() {
                modal.loader();
            },
            success: function(response) {
                //Successfully retrieved the edit form, now show it within a modal
                modal.content(response.getContent(), function() {
                    //Bind direct action handler we could use a global registeredHandler but this is more efficient
                    actions.bindAction(modal.getBody(), 'click', DATA_CONTENT_SAVE_SELECTOR, function(event) {
                        client.submit(modal.getForm(), {
                            success : function(response) {
                                if(object.isFunction(successHandler)) {
                                    if(successHandler(response, modal)) {modal.close();};
                                } else {
                                    that.replaceContent(response.getContent());
                                    //TODO: check for content.highlight
                                    modal.close();
                                } 
                                event.finish();
                            },
                            error : function(error) {
                                //TODO: handle error
                                modal.error(error);
                                console.error('Error while submitting form :'+error);
                                event.finish();
                            }
                        });
                    });
                });
            },
            error: function(errResponse) {
                modal.error(errResponse);
                console.log('Error occured while editing content: '+errResponse.getFirstError());
                //Todo: handle error
            }
        });
    };
    
    Content.prototype.delete = function () {
        if(!this.hasAction('delete')) {
            return;
        }
        
        var that = this;
        require('ui.modal').confirm({
            confirm : function() {
                var url = that.data(DATA_CONTENT_DELETE_URL);
                if(url) {
                     client.post(url, {
                         data: {
                             id: that.getKey()
                         }
                     }).then(function(response) {
                         that.remove();
                     }).catch(function(err) {
                         console.error('Error removing content',err);
                     });
                } else {
                    console.error('Content delete was called, but no url could be determined for '+this.base);
                }
            }
        });
        
        return;
    };
    
    Content.prototype.remove = function() {
        var that = this;
        this.$.animate({ height: 'toggle', opacity: 'toggle' }, 'fast', function() {
            that.$.remove();
            //TODO: fire global event
        });
    };
    
    module.export({
        Content : Content
    });
});