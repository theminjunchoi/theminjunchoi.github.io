(self.webpackChunkgatsby_starter_hoodie=self.webpackChunkgatsby_starter_hoodie||[]).push([[260],{729:function(t,e,n){"use strict";var o=n(5697),r=n.n(o);const i=n(2788).default.hr.withConfig({displayName:"Divider",componentId:"sc-1jz0jl-0"})(["margin-top:",";margin-bottom:",";border:none;border-bottom:1px solid ",";"],(t=>t.mt),(t=>t.mb),(t=>t.theme.colors.divider));i.propTypes={mt:r().string,mb:r().string},i.defaultProps={mt:"48px",mb:"48px"},e.Z=i},1811:function(t,e,n){"use strict";var o=n(3493),r=n.n(o),i=n(7294),a=n(2788),c=n(1883),l=n(2213),s=n(729),u=n(184);const d=a.default.div.withConfig({displayName:"PostList__PostListWrapper",componentId:"sc-1oqnm6-0"})(["@media (max-width:768px){padding:0 10px;}"]),f=a.default.div.withConfig({displayName:"PostList__PostWrapper",componentId:"sc-1oqnm6-1"})(["position:relative;top:0;transition:all 0.5s;@media (max-width:768px){padding:0 5px;}"]),p=a.default.p.withConfig({displayName:"PostList__Date",componentId:"sc-1oqnm6-2"})(["margin-bottom:16px;font-size:14.4px;color:",";"],(t=>t.theme.colors.tertiaryText)),m=a.default.p.withConfig({displayName:"PostList__Excerpt",componentId:"sc-1oqnm6-3"})(["margin-bottom:32px;line-height:1.7;font-size:16px;color:",";word-break:break-all;"],(t=>t.theme.colors.secondaryText));e.Z=t=>{let{postList:e}=t;const{0:n,1:o}=(0,i.useState)(10),a=r()((()=>{document.documentElement.scrollHeight-document.documentElement.scrollTop<=document.documentElement.clientHeight+100&&n<e.length&&setTimeout((()=>o(n+10)),300)}),250);return(0,i.useEffect)((()=>(window.addEventListener("scroll",a),()=>{window.removeEventListener("scroll",a)})),[n,e]),(0,i.useEffect)((()=>{o(10)}),[e]),i.createElement(d,null,e.slice(0,n).map(((t,o)=>{const{title:r,description:a,date:d,tags:g}=t.frontmatter,{excerpt:v}=t,{slug:x}=t.fields;return i.createElement(i.Fragment,null,i.createElement(f,null,i.createElement(l.Z,{size:"bg"},i.createElement(c.Link,{to:x},r)),i.createElement(p,null,d),a?i.createElement(m,null,a):i.createElement(m,null,v),i.createElement(u.Z,{tagList:g})),n-1!==o&&e.length-1!==o&&i.createElement(s.Z,{mt:"48px",mb:"32px"}))})))}},184:function(t,e,n){"use strict";var o=n(7294),r=n(2788),i=n(1883);const a=r.default.div.withConfig({displayName:"TagList__TagListWrapper",componentId:"sc-s1uz5f-0"})(["margin-bottom:10px;word-break:break-all;"]),c=r.default.div.withConfig({displayName:"TagList__TagLink",componentId:"sc-s1uz5f-1"})(["display:inline-block;padding:9.6px 11.2px;margin-right:8px;margin-bottom:8px;border-radius:50px;background-color:",";color:",";text-decoration:none;font-size:14.4px;transition:all 0.2s;&:hover{background-color:",";}"],(t=>t.selected?t.theme.colors.selectedTagBackground:t.theme.colors.tagBackground),(t=>t.selected?t.theme.colors.selectedTagText:t.theme.colors.tagText),(t=>t.selected?t.theme.colors.hoveredSelectedTagBackground:t.theme.colors.hoveredTagBackground)),l=t=>t.replace(/\s+/g,"-");e.Z=t=>{let{tagList:e,count:n,selected:r}=t;return e?n?o.createElement(a,null,e.map(((t,e)=>o.createElement(i.Link,{key:JSON.stringify({tag:t,i:e}),to:r===t.fieldValue?"/tags":"/tags?q="+encodeURIComponent(t.fieldValue)},o.createElement(c,{selected:t.fieldValue===r},l(t.fieldValue)," (",t.totalCount,")"))))):o.createElement(a,null,e.map(((t,e)=>o.createElement(i.Link,{key:JSON.stringify({tag:t,i:e}),to:"/tags?q="+t},o.createElement(c,null,l(t)))))):null}},2213:function(t,e,n){"use strict";var o=n(7294);const r=n(2788).default.h1.withConfig({displayName:"Title__Wrapper",componentId:"sc-1ttlsnf-0"})(["margin-bottom:24px;font-size:",";font-weight:700;line-height:1.3;color:",";word-break:break-all;& > a{text-decoration:none;color:inherit;transition:all 0.2s;}& > a:hover{color:",";}"],(t=>t.size),(t=>t.theme.colors.text),(t=>t.theme.colors.secondaryText));e.Z=t=>{let{size:e,children:n}=t;return o.createElement(r,{size:{sm:"19.2px",md:"25.6px",bg:"33.6px"}[e]}," ",n," ")}},2705:function(t,e,n){var o=n(5639).Symbol;t.exports=o},4239:function(t,e,n){var o=n(2705),r=n(9607),i=n(2333),a=o?o.toStringTag:void 0;t.exports=function(t){return null==t?void 0===t?"[object Undefined]":"[object Null]":a&&a in Object(t)?r(t):i(t)}},7561:function(t,e,n){var o=n(7990),r=/^\s+/;t.exports=function(t){return t?t.slice(0,o(t)+1).replace(r,""):t}},1957:function(t,e,n){var o="object"==typeof n.g&&n.g&&n.g.Object===Object&&n.g;t.exports=o},9607:function(t,e,n){var o=n(2705),r=Object.prototype,i=r.hasOwnProperty,a=r.toString,c=o?o.toStringTag:void 0;t.exports=function(t){var e=i.call(t,c),n=t[c];try{t[c]=void 0;var o=!0}catch(l){}var r=a.call(t);return o&&(e?t[c]=n:delete t[c]),r}},2333:function(t){var e=Object.prototype.toString;t.exports=function(t){return e.call(t)}},5639:function(t,e,n){var o=n(1957),r="object"==typeof self&&self&&self.Object===Object&&self,i=o||r||Function("return this")();t.exports=i},7990:function(t){var e=/\s/;t.exports=function(t){for(var n=t.length;n--&&e.test(t.charAt(n)););return n}},3279:function(t,e,n){var o=n(3218),r=n(7771),i=n(4841),a=Math.max,c=Math.min;t.exports=function(t,e,n){var l,s,u,d,f,p,m=0,g=!1,v=!1,x=!0;if("function"!=typeof t)throw new TypeError("Expected a function");function h(e){var n=l,o=s;return l=s=void 0,m=e,d=t.apply(o,n)}function b(t){var n=t-p;return void 0===p||n>=e||n<0||v&&t-m>=u}function y(){var t=r();if(b(t))return E(t);f=setTimeout(y,function(t){var n=e-(t-p);return v?c(n,u-(t-m)):n}(t))}function E(t){return f=void 0,x&&l?h(t):(l=s=void 0,d)}function T(){var t=r(),n=b(t);if(l=arguments,s=this,p=t,n){if(void 0===f)return function(t){return m=t,f=setTimeout(y,e),g?h(t):d}(p);if(v)return clearTimeout(f),f=setTimeout(y,e),h(p)}return void 0===f&&(f=setTimeout(y,e)),d}return e=i(e)||0,o(n)&&(g=!!n.leading,u=(v="maxWait"in n)?a(i(n.maxWait)||0,e):u,x="trailing"in n?!!n.trailing:x),T.cancel=function(){void 0!==f&&clearTimeout(f),m=0,l=p=s=f=void 0},T.flush=function(){return void 0===f?d:E(r())},T}},3218:function(t){t.exports=function(t){var e=typeof t;return null!=t&&("object"==e||"function"==e)}},7005:function(t){t.exports=function(t){return null!=t&&"object"==typeof t}},3448:function(t,e,n){var o=n(4239),r=n(7005);t.exports=function(t){return"symbol"==typeof t||r(t)&&"[object Symbol]"==o(t)}},7771:function(t,e,n){var o=n(5639);t.exports=function(){return o.Date.now()}},3493:function(t,e,n){var o=n(3279),r=n(3218);t.exports=function(t,e,n){var i=!0,a=!0;if("function"!=typeof t)throw new TypeError("Expected a function");return r(n)&&(i="leading"in n?!!n.leading:i,a="trailing"in n?!!n.trailing:a),o(t,e,{leading:i,maxWait:e,trailing:a})}},4841:function(t,e,n){var o=n(7561),r=n(3218),i=n(3448),a=/^[-+]0x[0-9a-f]+$/i,c=/^0b[01]+$/i,l=/^0o[0-7]+$/i,s=parseInt;t.exports=function(t){if("number"==typeof t)return t;if(i(t))return NaN;if(r(t)){var e="function"==typeof t.valueOf?t.valueOf():t;t=r(e)?e+"":e}if("string"!=typeof t)return 0===t?t:+t;t=o(t);var n=c.test(t);return n||l.test(t)?s(t.slice(2),n?2:8):a.test(t)?NaN:+t}}}]);
//# sourceMappingURL=277cd099b731cb56ec6ed9808399df13c01b816a-6b2ac93ba744e04b2a9e.js.map