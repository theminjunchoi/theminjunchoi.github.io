(self.webpackChunkgatsby_starter_hoodie=self.webpackChunkgatsby_starter_hoodie||[]).push([[154],{729:function(t,e,n){"use strict";var o=n(5697),r=n.n(o);const i=n(2788).default.hr.withConfig({displayName:"Divider",componentId:"sc-1jz0jl-0"})(["margin-top:",";margin-bottom:",";border:none;border-bottom:1px solid ",";"],(t=>t.mt),(t=>t.mb),(t=>t.theme.colors.divider));i.propTypes={mt:r().string,mb:r().string},i.defaultProps={mt:"48px",mb:"48px"},e.Z=i},4246:function(t,e,n){"use strict";var o=n(3493),r=n.n(o),i=n(7294),a=n(2788),c=n(4854),l=n(2213),s=n(729),u=n(184);const d=a.default.div.withConfig({displayName:"PostList__PostListWrapper",componentId:"sc-1oqnm6-0"})(["@media (max-width:768px){padding:0 10px;}"]),f=a.default.div.withConfig({displayName:"PostList__PostWrapper",componentId:"sc-1oqnm6-1"})(["position:relative;top:0;transition:all 0.5s;@media (max-width:768px){padding:0 5px;}"]),p=a.default.p.withConfig({displayName:"PostList__Date",componentId:"sc-1oqnm6-2"})(["margin-bottom:16px;font-size:14.4px;color:",";"],(t=>t.theme.colors.tertiaryText)),m=a.default.p.withConfig({displayName:"PostList__Excerpt",componentId:"sc-1oqnm6-3"})(["margin-bottom:32px;line-height:1.7;font-size:16px;color:",";word-break:break-all;"],(t=>t.theme.colors.secondaryText));e.Z=t=>{let{postList:e}=t;const{0:n,1:o}=(0,i.useState)(10),{0:a,1:g}=(0,i.useState)(window.innerWidth);(0,i.useEffect)((()=>{const t=()=>{g(window.innerWidth)};return window.addEventListener("resize",t),()=>window.removeEventListener("resize",t)}),[]);const h=r()((()=>{document.documentElement.scrollHeight-document.documentElement.scrollTop<=document.documentElement.clientHeight+100&&n<e.length&&setTimeout((()=>o(n+10)),300)}),250);return(0,i.useEffect)((()=>(window.addEventListener("scroll",h),()=>{window.removeEventListener("scroll",h)})),[n,e]),(0,i.useEffect)((()=>{o(10)}),[e]),i.createElement(d,null,e.slice(0,n).map(((t,o)=>{const{title:r,description:d,date:g,tags:h}=t.frontmatter,{excerpt:v}=t,{slug:x}=t.fields,b=a<768?"md":"bg";return i.createElement(i.Fragment,null,i.createElement(f,{key:o},i.createElement(l.Z,{size:b},i.createElement(c.Link,{to:x},r)),i.createElement(p,null,g),d?i.createElement(m,null,d):i.createElement(m,null,v),i.createElement(u.Z,{tagList:h})),n-1!==o&&e.length-1!==o&&i.createElement(s.Z,{mt:"48px",mb:"32px"}))})))}},184:function(t,e,n){"use strict";var o=n(7294),r=n(2788),i=n(4854);const a=r.default.div.withConfig({displayName:"TagList__TagListWrapper",componentId:"sc-s1uz5f-0"})(["margin-bottom:10px;word-break:break-all;"]),c=r.default.div.withConfig({displayName:"TagList__TagLink",componentId:"sc-s1uz5f-1"})(["display:inline-block;padding:9.6px 11.2px;margin-right:8px;margin-bottom:8px;border-radius:50px;background-color:",";color:",";text-decoration:none;font-size:14.4px;transition:all 0.2s;&:hover{background-color:",";}"],(t=>t.selected?t.theme.colors.selectedTagBackground:t.theme.colors.tagBackground),(t=>t.selected?t.theme.colors.selectedTagText:t.theme.colors.tagText),(t=>t.selected?t.theme.colors.hoveredSelectedTagBackground:t.theme.colors.hoveredTagBackground)),l=t=>t.replace(/\s+/g,"-");e.Z=t=>{let{tagList:e,count:n,selected:r}=t;return e?n?o.createElement(a,null,e.map(((t,e)=>o.createElement(i.Link,{key:JSON.stringify({tag:t,i:e}),to:r===t.fieldValue?"/tags":`/tags?q=${encodeURIComponent(t.fieldValue)}`},o.createElement(c,{selected:t.fieldValue===r},l(t.fieldValue)," (",t.totalCount,")"))))):o.createElement(a,null,e.map(((t,e)=>o.createElement(i.Link,{key:JSON.stringify({tag:t,i:e}),to:`/tags?q=${t}`},o.createElement(c,null,l(t)))))):null}},2213:function(t,e,n){"use strict";var o=n(7294);const r=n(2788).default.h1.withConfig({displayName:"Title__Wrapper",componentId:"sc-1ttlsnf-0"})(["margin-bottom:24px;font-size:",";font-weight:700;line-height:1.3;color:",";word-break:break-all;& > a{text-decoration:none;color:inherit;transition:all 0.2s;}& > a:hover{color:",";}"],(t=>t.size),(t=>t.theme.colors.text),(t=>t.theme.colors.secondaryText));e.Z=t=>{let{size:e,children:n}=t;return o.createElement(r,{size:{sm:"19.2px",md:"25.6px",bg:"33.6px"}[e]}," ",n," ")}},1093:function(t,e,n){"use strict";var o=n(2788);e.Z=o.default.div.withConfig({displayName:"VerticalSpace",componentId:"sc-fbwjqc-0"})(["height:","px;"],(t=>t.size))},672:function(t,e,n){"use strict";n.r(e);var o=n(7294),r=n(2788),i=n(5038),a=n(5609),c=n(4246),l=n(1093),s=n(9349);const u=r.default.p.withConfig({displayName:"all__PostsCount",componentId:"sc-1gfv2rr-0"})(["margin-bottom:25.6px;line-height:1.2;font-size:18px;font-weight:700;color:",";@media (max-width:768px){padding:0 15px;}"],(t=>t.theme.colors.secondAccentText));e.default=t=>{let{data:e}=t;const n=e.allMarkdownRemark.nodes;return 0===n.length?o.createElement("p",null,'No blog posts found. Add markdown posts to "content/blog" (or the directory you specified for the "gatsby-source-filesystem" plugin in gatsby-config.js).'):o.createElement(i.Z,null,o.createElement(a.Z,{title:s.title,description:s.description,url:s.siteUrl}),o.createElement(l.Z,{size:48}),o.createElement(u,null,"총 ",n.length,"개의 글이 있습니다"),o.createElement(c.Z,{postList:n}))}},2705:function(t,e,n){var o=n(5639).Symbol;t.exports=o},4239:function(t,e,n){var o=n(2705),r=n(9607),i=n(2333),a=o?o.toStringTag:void 0;t.exports=function(t){return null==t?void 0===t?"[object Undefined]":"[object Null]":a&&a in Object(t)?r(t):i(t)}},7561:function(t,e,n){var o=n(7990),r=/^\s+/;t.exports=function(t){return t?t.slice(0,o(t)+1).replace(r,""):t}},1957:function(t,e,n){var o="object"==typeof n.g&&n.g&&n.g.Object===Object&&n.g;t.exports=o},9607:function(t,e,n){var o=n(2705),r=Object.prototype,i=r.hasOwnProperty,a=r.toString,c=o?o.toStringTag:void 0;t.exports=function(t){var e=i.call(t,c),n=t[c];try{t[c]=void 0;var o=!0}catch(l){}var r=a.call(t);return o&&(e?t[c]=n:delete t[c]),r}},2333:function(t){var e=Object.prototype.toString;t.exports=function(t){return e.call(t)}},5639:function(t,e,n){var o=n(1957),r="object"==typeof self&&self&&self.Object===Object&&self,i=o||r||Function("return this")();t.exports=i},7990:function(t){var e=/\s/;t.exports=function(t){for(var n=t.length;n--&&e.test(t.charAt(n)););return n}},3279:function(t,e,n){var o=n(3218),r=n(7771),i=n(4841),a=Math.max,c=Math.min;t.exports=function(t,e,n){var l,s,u,d,f,p,m=0,g=!1,h=!1,v=!0;if("function"!=typeof t)throw new TypeError("Expected a function");function x(e){var n=l,o=s;return l=s=void 0,m=e,d=t.apply(o,n)}function b(t){var n=t-p;return void 0===p||n>=e||n<0||h&&t-m>=u}function y(){var t=r();if(b(t))return w(t);f=setTimeout(y,function(t){var n=e-(t-p);return h?c(n,u-(t-m)):n}(t))}function w(t){return f=void 0,v&&l?x(t):(l=s=void 0,d)}function E(){var t=r(),n=b(t);if(l=arguments,s=this,p=t,n){if(void 0===f)return function(t){return m=t,f=setTimeout(y,e),g?x(t):d}(p);if(h)return clearTimeout(f),f=setTimeout(y,e),x(p)}return void 0===f&&(f=setTimeout(y,e)),d}return e=i(e)||0,o(n)&&(g=!!n.leading,u=(h="maxWait"in n)?a(i(n.maxWait)||0,e):u,v="trailing"in n?!!n.trailing:v),E.cancel=function(){void 0!==f&&clearTimeout(f),m=0,l=p=s=f=void 0},E.flush=function(){return void 0===f?d:w(r())},E}},3218:function(t){t.exports=function(t){var e=typeof t;return null!=t&&("object"==e||"function"==e)}},7005:function(t){t.exports=function(t){return null!=t&&"object"==typeof t}},3448:function(t,e,n){var o=n(4239),r=n(7005);t.exports=function(t){return"symbol"==typeof t||r(t)&&"[object Symbol]"==o(t)}},7771:function(t,e,n){var o=n(5639);t.exports=function(){return o.Date.now()}},3493:function(t,e,n){var o=n(3279),r=n(3218);t.exports=function(t,e,n){var i=!0,a=!0;if("function"!=typeof t)throw new TypeError("Expected a function");return r(n)&&(i="leading"in n?!!n.leading:i,a="trailing"in n?!!n.trailing:a),o(t,e,{leading:i,maxWait:e,trailing:a})}},4841:function(t,e,n){var o=n(7561),r=n(3218),i=n(3448),a=/^[-+]0x[0-9a-f]+$/i,c=/^0b[01]+$/i,l=/^0o[0-7]+$/i,s=parseInt;t.exports=function(t){if("number"==typeof t)return t;if(i(t))return NaN;if(r(t)){var e="function"==typeof t.valueOf?t.valueOf():t;t=r(e)?e+"":e}if("string"!=typeof t)return 0===t?t:+t;t=o(t);var n=c.test(t);return n||l.test(t)?s(t.slice(2),n?2:8):a.test(t)?NaN:+t}}}]);
//# sourceMappingURL=component---src-pages-all-jsx-a444b3b45e8396552ada.js.map