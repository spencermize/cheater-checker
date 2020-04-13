'use strict';Object.defineProperty(exports,'__esModule',{value:!0}),exports.default=wiki;var _util=require('./util'),_page=require('./page'),_page2=_interopRequireDefault(_page);function _interopRequireDefault(a){return a&&a.__esModule?a:{default:a}}var defaultOptions={apiUrl:'http://en.wikipedia.org/w/api.php',origin:'*'};function wiki(){function a(q){return q.query.redirects&&1===q.query.redirects.length?(0,_util.api)(p,{prop:'info|pageprops',inprop:'url',ppprop:'disambiguation',titles:q.query.redirects[0].to}):q}function b(q){var r=1<arguments.length&&arguments[1]!==void 0?arguments[1]:50,s=2<arguments.length&&arguments[2]!==void 0&&arguments[2],t=3<arguments.length&&arguments[3]!==void 0?arguments[3]:5;return(0,_util.pagination)(p,{list:'search',srsearch:q,srlimit:r,maxlag:t},function(u){return u.query.search.map(function(v){return s?v:v.title})}).catch(function(u){if('"text" search is disabled.'===u.message)return d(q,r);throw u})}function d(q){var r=1<arguments.length&&arguments[1]!==void 0?arguments[1]:50;return(0,_util.api)(p,{search:q,limit:r,namespace:0,action:'opensearch',redirects:void 0}).then(function(s){return s[1]})}function f(q){return(0,_util.api)(p,{prop:'info|pageprops',inprop:'url',ppprop:'disambiguation',titles:q}).then(a).then(function(r){var s=Object.keys(r.query.pages)[0];if(!s||'-1'===s)throw new Error('No article found');return(0,_page2.default)(r.query.pages[s],p)})}var o=0<arguments.length&&arguments[0]!==void 0?arguments[0]:{};this instanceof wiki&&console.log('Please do not use wikijs ^1.0.0 as a class. Please see the new README.');var p=Object.assign({},defaultOptions,o);return{search:b,random:function(){var q=0<arguments.length&&arguments[0]!==void 0?arguments[0]:1;return(0,_util.api)(p,{list:'random',rnnamespace:0,rnlimit:q}).then(function(r){return r.query.random.map(function(s){return s.title})})},page:f,geoSearch:function(q,r){var s=2<arguments.length&&arguments[2]!==void 0?arguments[2]:1e3;return(0,_util.api)(p,{list:'geosearch',gsradius:s,gscoord:q+'|'+r}).then(function(t){return t.query.geosearch.map(function(u){return u.title})})},options:o,findById:function(q){return(0,_util.api)(p,{prop:'info|pageprops',inprop:'url',ppprop:'disambiguation',pageids:q}).then(a).then(function(r){var s=Object.keys(r.query.pages)[0];if(!s||'-1'===s)throw new Error('No article found');return(0,_page2.default)(r.query.pages[s],p)})},find:function(q){var r=1<arguments.length&&arguments[1]!==void 0?arguments[1]:function(s){return s[0]};return b(q).then(function(s){return r(s.results)}).then(function(s){return f(s)})},allPages:function(){return(0,_util.aggregate)(p,{},'allpages','title','ap')},allCategories:function(){return(0,_util.aggregate)(p,{},'allcategories','*','ac')},pagesInCategory:function(q){return(0,_util.aggregate)(p,{cmtitle:q},'categorymembers','title','cm')},opensearch:d,prefixSearch:function(q){var r=1<arguments.length&&arguments[1]!==void 0?arguments[1]:50;return(0,_util.pagination)(p,{list:'prefixsearch',pslimit:r,psprofile:'fuzzy',pssearch:q},function(s){return s.query.prefixsearch.map(function(t){return t.title})})},mostViewed:function(){return(0,_util.api)(p,{action:'query',list:'mostviewed'}).then(function(q){return q.query.mostviewed.map(function(r){var s=r.title,t=r.count;return{title:s,count:t}})})},api:function(q){return(0,_util.api)(p,q)}}}
//# sourceMappingURL=wiki.js.map