/* jslint node: true */
"use strict";

var ObjectArray = require('objectarray');
var Procedure = require('procedure');
var colors = require('colors');
require('json.decycled');
require('date.format');

module.exports = new Crier();
function Crier(parent,id){
  this.id = id;
  this.parent = parent;
}
  Crier.prototype.addLvl = function(lvl){
    Crier.prototype[lvl] = function crierLvl(msg,meta,callback){
      this.$compose([],lvl,msg,meta,callback);
      return this;
    };
    return this;
  };
  Crier.prototype.getLvls = function(){
    var lvls = [];
    for(var i=0,k=Object.keys(Crier.prototype),l=k.length;i<l;i++){
      if(Crier.prototype[k[i]].name === 'crierLvl'){
        lvls.push(k[i]);
      }
    }
    return lvls;
  };
  Crier.prototype.addGroup = function(id){
    if(!this[id]){
      this[id] = new Crier(this,id);
    }
    return this[id];
  };
  Crier.prototype.getGroups = function(){
    var groups = [];
    for(var i=0,k=Object.keys(this),l=k.length;i<l;i++){
      if(this[k[i]] instanceof Crier){
        groups.push(k[i]);
      }
    }
    return groups;
  };
  Crier.prototype.$compose = function(location,lvl,msg,meta,callback){
    if(this.parent){
      location = location || [];
      location.push(this.id);
      this.parent.$compose(location,lvl,msg,meta,callback);
    } else {
      location = location || [];
      location = location.reverse();
      msg = msg || '';
      meta = meta || {};

      var stores = ['console'];
      for(var i=0,l=this.rules.length;i<l;i++){
        this.rules[i].rule(stores,location,lvl,msg,meta);
      }

      var procedure = new Procedure();
      for(i=0,l=stores.length;i<l;i++){
        var store = this.stores.get(stores[i]);
        if(store){
          procedure.add('crier.stores.'+store.id,store.handler.bind(store),location,lvl,msg,meta);
        }
      }
      procedure.race().launch(function(errors){
        var args = Array.prototype.slice.call(arguments);
        if(errors && Crier.errors){
          Crier.errors.apply(this,args);
        }
        if(callback){
          callback.apply(this,args);
        }
      });
    }
  };

  Crier.prototype.debug = function(msg,meta,callback){
    this.$compose([],'debug',msg,meta,callback);
  };
  Crier.prototype.log = function(msg,meta,callback){
    this.$compose([],'log',msg,meta,callback);
  };
  Crier.prototype.info = function(msg,meta,callback){
    this.$compose([],'info',msg,meta,callback);
  };
  Crier.prototype.alert = function(msg,meta,callback){
    this.$compose([],'alert',msg,meta,callback);
  };
  Crier.prototype.error = function(msg,meta,callback){
    this.$compose([],'error',msg,meta,callback);
  };
  Crier.prototype.warn = function(msg,meta,callback){
    this.$compose([],'warn',msg,meta,callback);
  };

  Crier.errors = function(errors){
    console.error.apply(null,errors);
  };

  Crier.console = {
    id: 'console',
    language: 'en',
    colors: {log:'cyan',info:'green',alert:'yellow',error:'red',warn:'magenta'},
    format: function(text,meta,lang){return text;},
    handler: function(location,lvl,msg,meta,callback){
      var node = location.join('.')+'.'+msg;
      var format = Crier.console.format(node,meta,Crier.console.language);
      var timestamp = (new Date()).format('{YYYY}/{MM}/{DD} {hh}:{mm}:{ss} ',true).grey;
      var output = "\r▶"[(Crier.console.colors[lvl]?Crier.console.colors[lvl]:'white')]+' '+timestamp;
      if(format)
      if(format===node){
        output += (lvl.toUpperCase()+'.'+location.join('.')+': ')[(Crier.console.colors[lvl]?Crier.console.colors[lvl]:'white')];
        output += msg;
        if(meta){
          output += '\n'+JSON.decycled(meta,false,3,'  ').grey;
        }
      } else {
        output += format;
      }
      if(meta && meta.error && meta.error.stack){
        output += ('\n\n'+meta.error.stack+'\n').bgRed;
      }
      console.log(output);
      callback(undefined,output);
    }
  };
  Crier.prototype.rules = new ObjectArray();
  Crier.prototype.stores = new ObjectArray(Crier.console);