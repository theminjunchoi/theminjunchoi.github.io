(self.webpackChunkgatsby_starter_hoodie=self.webpackChunkgatsby_starter_hoodie||[]).push([[81],{4246:function(e,t,r){"use strict";var n=r(3493),o=r.n(n),a=r(7294),i=r(2788),s=r(4854),c=r(2213),l=r(729),u=r(184);const d=i.default.div.withConfig({displayName:"PostList__PostListWrapper",componentId:"sc-1oqnm6-0"})(["@media (max-width:768px){padding:0 10px;}"]),p=i.default.div.withConfig({displayName:"PostList__PostWrapper",componentId:"sc-1oqnm6-1"})(["position:relative;top:0;transition:all 0.5s;@media (max-width:768px){padding:0 5px;}"]),f=i.default.p.withConfig({displayName:"PostList__Date",componentId:"sc-1oqnm6-2"})(["margin-bottom:16px;font-size:14.4px;color:",";"],(e=>e.theme.colors.tertiaryText)),m=i.default.p.withConfig({displayName:"PostList__Excerpt",componentId:"sc-1oqnm6-3"})(["margin-bottom:32px;line-height:1.7;font-size:16px;color:",";word-break:break-all;"],(e=>e.theme.colors.secondaryText));t.Z=e=>{let{postList:t}=e;const{0:r,1:n}=(0,a.useState)(10),{0:i,1:g}=(0,a.useState)(window.innerWidth);(0,a.useEffect)((()=>{const e=()=>{g(window.innerWidth)};return window.addEventListener("resize",e),()=>window.removeEventListener("resize",e)}),[]);const y=o()((()=>{document.documentElement.scrollHeight-document.documentElement.scrollTop<=document.documentElement.clientHeight+100&&r<t.length&&setTimeout((()=>n(r+10)),300)}),250);return(0,a.useEffect)((()=>(window.addEventListener("scroll",y),()=>{window.removeEventListener("scroll",y)})),[r,t]),(0,a.useEffect)((()=>{n(10)}),[t]),a.createElement(d,null,t.slice(0,r).map(((e,n)=>{const{title:o,description:d,date:g,tags:y}=e.frontmatter,{excerpt:h}=e,{slug:b}=e.fields,k=i<768?"md":"bg";return a.createElement(a.Fragment,null,a.createElement(p,{key:n},a.createElement(c.Z,{size:k},a.createElement(s.Link,{to:b},o)),a.createElement(f,null,g),d?a.createElement(m,null,d):a.createElement(m,null,h),a.createElement(u.Z,{tagList:y})),r-1!==n&&t.length-1!==n&&a.createElement(l.Z,{mt:"48px",mb:"32px"}))})))}},184:function(e,t,r){"use strict";var n=r(7294),o=r(2788),a=r(4854);const i=o.default.div.withConfig({displayName:"TagList__TagListWrapper",componentId:"sc-s1uz5f-0"})(["margin-bottom:10px;word-break:break-all;"]),s=o.default.div.withConfig({displayName:"TagList__TagLink",componentId:"sc-s1uz5f-1"})(["display:inline-block;padding:9.6px 11.2px;margin-right:8px;margin-bottom:8px;border-radius:50px;background-color:",";color:",";text-decoration:none;font-size:14.4px;transition:all 0.2s;&:hover{background-color:",";}"],(e=>e.selected?e.theme.colors.selectedTagBackground:e.theme.colors.tagBackground),(e=>e.selected?e.theme.colors.selectedTagText:e.theme.colors.tagText),(e=>e.selected?e.theme.colors.hoveredSelectedTagBackground:e.theme.colors.hoveredTagBackground)),c=e=>e.replace(/\s+/g,"-");t.Z=e=>{let{tagList:t,count:r,selected:o}=e;return t?r?n.createElement(i,null,t.map(((e,t)=>n.createElement(a.Link,{key:JSON.stringify({tag:e,i:t}),to:o===e.fieldValue?"/tags":`/tags?q=${encodeURIComponent(e.fieldValue)}`},n.createElement(s,{selected:e.fieldValue===o},c(e.fieldValue)," (",e.totalCount,")"))))):n.createElement(i,null,t.map(((e,t)=>n.createElement(a.Link,{key:JSON.stringify({tag:e,i:t}),to:`/tags?q=${e}`},n.createElement(s,null,c(e)))))):null}},4221:function(e,t,r){"use strict";r.r(t),r.d(t,{default:function(){return V}});var n={};r.r(n),r.d(n,{exclude:function(){return $},extract:function(){return N},parse:function(){return S},parseUrl:function(){return T},pick:function(){return R},stringify:function(){return O},stringifyUrl:function(){return _}});var o=r(9734),a=r.n(o),i=r(7294),s=r(2788),c=r(5609),l=r(3105),u=r.n(l),d=r(4854);const p="%[a-f0-9]{2}",f=new RegExp("("+p+")|([^%]+?)","gi"),m=new RegExp("("+p+")+","gi");function g(e,t){try{return[decodeURIComponent(e.join(""))]}catch{}if(1===e.length)return e;t=t||1;const r=e.slice(0,t),n=e.slice(t);return Array.prototype.concat.call([],g(r),g(n))}function y(e){try{return decodeURIComponent(e)}catch{let t=e.match(f)||[];for(let r=1;r<t.length;r++)t=(e=g(t,r).join("")).match(f)||[];return e}}function h(e){if("string"!=typeof e)throw new TypeError("Expected `encodedURI` to be of type `string`, got `"+typeof e+"`");try{return decodeURIComponent(e)}catch{return function(e){const t={"%FE%FF":"��","%FF%FE":"��"};let r=m.exec(e);for(;r;){try{t[r[0]]=decodeURIComponent(r[0])}catch{const e=y(r[0]);e!==r[0]&&(t[r[0]]=e)}r=m.exec(e)}t["%C2"]="�";const n=Object.keys(t);for(const o of n)e=e.replace(new RegExp(o,"g"),t[o]);return e}(e)}}function b(e,t){if("string"!=typeof e||"string"!=typeof t)throw new TypeError("Expected the arguments to be of type `string`");if(""===e||""===t)return[];const r=e.indexOf(t);return-1===r?[]:[e.slice(0,r),e.slice(r+t.length)]}function k(e,t){const r={};if(Array.isArray(t))for(const n of t){const t=Object.getOwnPropertyDescriptor(e,n);t?.enumerable&&Object.defineProperty(r,n,t)}else for(const n of Reflect.ownKeys(e)){const o=Object.getOwnPropertyDescriptor(e,n);if(o.enumerable){t(n,e[n],e)&&Object.defineProperty(r,n,o)}}return r}const E=e=>null==e,x=e=>encodeURIComponent(e).replace(/[!'()*]/g,(e=>`%${e.charCodeAt(0).toString(16).toUpperCase()}`)),w=Symbol("encodeFragmentIdentifier");function v(e){if("string"!=typeof e||1!==e.length)throw new TypeError("arrayFormatSeparator must be single character string")}function j(e,t){return t.encode?t.strict?x(e):encodeURIComponent(e):e}function C(e,t){return t.decode?h(e):e}function F(e){return Array.isArray(e)?e.sort():"object"==typeof e?F(Object.keys(e)).sort(((e,t)=>Number(e)-Number(t))).map((t=>e[t])):e}function I(e){const t=e.indexOf("#");return-1!==t&&(e=e.slice(0,t)),e}function L(e,t){return t.parseNumbers&&!Number.isNaN(Number(e))&&"string"==typeof e&&""!==e.trim()?e=Number(e):!t.parseBooleans||null===e||"true"!==e.toLowerCase()&&"false"!==e.toLowerCase()||(e="true"===e.toLowerCase()),e}function N(e){const t=(e=I(e)).indexOf("?");return-1===t?"":e.slice(t+1)}function S(e,t){v((t={decode:!0,sort:!0,arrayFormat:"none",arrayFormatSeparator:",",parseNumbers:!1,parseBooleans:!1,...t}).arrayFormatSeparator);const r=function(e){let t;switch(e.arrayFormat){case"index":return(e,r,n)=>{t=/\[(\d*)]$/.exec(e),e=e.replace(/\[\d*]$/,""),t?(void 0===n[e]&&(n[e]={}),n[e][t[1]]=r):n[e]=r};case"bracket":return(e,r,n)=>{t=/(\[])$/.exec(e),e=e.replace(/\[]$/,""),t?void 0!==n[e]?n[e]=[...n[e],r]:n[e]=[r]:n[e]=r};case"colon-list-separator":return(e,r,n)=>{t=/(:list)$/.exec(e),e=e.replace(/:list$/,""),t?void 0!==n[e]?n[e]=[...n[e],r]:n[e]=[r]:n[e]=r};case"comma":case"separator":return(t,r,n)=>{const o="string"==typeof r&&r.includes(e.arrayFormatSeparator),a="string"==typeof r&&!o&&C(r,e).includes(e.arrayFormatSeparator);r=a?C(r,e):r;const i=o||a?r.split(e.arrayFormatSeparator).map((t=>C(t,e))):null===r?r:C(r,e);n[t]=i};case"bracket-separator":return(t,r,n)=>{const o=/(\[])$/.test(t);if(t=t.replace(/\[]$/,""),!o)return void(n[t]=r?C(r,e):r);const a=null===r?[]:r.split(e.arrayFormatSeparator).map((t=>C(t,e)));void 0!==n[t]?n[t]=[...n[t],...a]:n[t]=a};default:return(e,t,r)=>{void 0!==r[e]?r[e]=[...[r[e]].flat(),t]:r[e]=t}}}(t),n=Object.create(null);if("string"!=typeof e)return n;if(!(e=e.trim().replace(/^[?#&]/,"")))return n;for(const o of e.split("&")){if(""===o)continue;const e=t.decode?o.replace(/\+/g," "):o;let[a,i]=b(e,"=");void 0===a&&(a=e),i=void 0===i?null:["comma","separator","bracket-separator"].includes(t.arrayFormat)?i:C(i,t),r(C(a,t),i,n)}for(const[o,a]of Object.entries(n))if("object"==typeof a&&null!==a)for(const[e,r]of Object.entries(a))a[e]=L(r,t);else n[o]=L(a,t);return!1===t.sort?n:(!0===t.sort?Object.keys(n).sort():Object.keys(n).sort(t.sort)).reduce(((e,t)=>{const r=n[t];return Boolean(r)&&"object"==typeof r&&!Array.isArray(r)?e[t]=F(r):e[t]=r,e}),Object.create(null))}function O(e,t){if(!e)return"";v((t={encode:!0,strict:!0,arrayFormat:"none",arrayFormatSeparator:",",...t}).arrayFormatSeparator);const r=r=>t.skipNull&&E(e[r])||t.skipEmptyString&&""===e[r],n=function(e){switch(e.arrayFormat){case"index":return t=>(r,n)=>{const o=r.length;return void 0===n||e.skipNull&&null===n||e.skipEmptyString&&""===n?r:null===n?[...r,[j(t,e),"[",o,"]"].join("")]:[...r,[j(t,e),"[",j(o,e),"]=",j(n,e)].join("")]};case"bracket":return t=>(r,n)=>void 0===n||e.skipNull&&null===n||e.skipEmptyString&&""===n?r:null===n?[...r,[j(t,e),"[]"].join("")]:[...r,[j(t,e),"[]=",j(n,e)].join("")];case"colon-list-separator":return t=>(r,n)=>void 0===n||e.skipNull&&null===n||e.skipEmptyString&&""===n?r:null===n?[...r,[j(t,e),":list="].join("")]:[...r,[j(t,e),":list=",j(n,e)].join("")];case"comma":case"separator":case"bracket-separator":{const t="bracket-separator"===e.arrayFormat?"[]=":"=";return r=>(n,o)=>void 0===o||e.skipNull&&null===o||e.skipEmptyString&&""===o?n:(o=null===o?"":o,0===n.length?[[j(r,e),t,j(o,e)].join("")]:[[n,j(o,e)].join(e.arrayFormatSeparator)])}default:return t=>(r,n)=>void 0===n||e.skipNull&&null===n||e.skipEmptyString&&""===n?r:null===n?[...r,j(t,e)]:[...r,[j(t,e),"=",j(n,e)].join("")]}}(t),o={};for(const[i,s]of Object.entries(e))r(i)||(o[i]=s);const a=Object.keys(o);return!1!==t.sort&&a.sort(t.sort),a.map((r=>{const o=e[r];return void 0===o?"":null===o?j(r,t):Array.isArray(o)?0===o.length&&"bracket-separator"===t.arrayFormat?j(r,t)+"[]":o.reduce(n(r),[]).join("&"):j(r,t)+"="+j(o,t)})).filter((e=>e.length>0)).join("&")}function T(e,t){t={decode:!0,...t};let[r,n]=b(e,"#");return void 0===r&&(r=e),{url:r?.split("?")?.[0]??"",query:S(N(e),t),...t&&t.parseFragmentIdentifier&&n?{fragmentIdentifier:C(n,t)}:{}}}function _(e,t){t={encode:!0,strict:!0,[w]:!0,...t};const r=I(e.url).split("?")[0]||"";let n=O({...S(N(e.url),{sort:!1}),...e.query},t);n&&(n=`?${n}`);let o=function(e){let t="";const r=e.indexOf("#");return-1!==r&&(t=e.slice(r)),t}(e.url);if(e.fragmentIdentifier){const n=new URL(r);n.hash=e.fragmentIdentifier,o=t[w]?n.hash:`#${e.fragmentIdentifier}`}return`${r}${n}${o}`}function R(e,t,r){r={parseFragmentIdentifier:!0,[w]:!1,...r};const{url:n,query:o,fragmentIdentifier:a}=T(e,r);return _({url:n,query:k(o,t),fragmentIdentifier:a},r)}function $(e,t,r){return R(e,Array.isArray(t)?e=>!t.includes(e):(e,r)=>!t(e,r),r)}var U=n,z=r(5038),A=r(2213),q=r(184),Z=r(4246),P=r(1093),B=r(9349);const W=s.default.div.withConfig({displayName:"tags__TagListWrapper",componentId:"sc-1p0kse9-0"})(["margin-top:20px;@media (max-width:768px){padding:0 15px;}"]);s.default.p.withConfig({displayName:"tags__TagTitle",componentId:"sc-1p0kse9-1"})(["color:",";display:inline;"],(e=>e.theme.colors.secondAccentText));var V=e=>{let{data:t}=e;const r=a()(t.allMarkdownRemark.group,["totalCount"]).reverse(),n=t.allMarkdownRemark.nodes,{0:o,1:s}=(0,i.useState)(),{0:l,1:p}=(0,i.useState)([]),f=(0,i.useRef)(null);let m=null;return"undefined"!=typeof document&&(m=document.location.search),(0,i.useEffect)((()=>{if(!o)return void p(n);const e=u()(n,(e=>e.frontmatter.tags&&-1!==e.frontmatter.tags.indexOf(o)));p(e)}),[o,n]),(0,i.useEffect)((()=>{const e=decodeURIComponent(U.parse(m).q||"");s(e)}),[m]),i.createElement(z.Z,null,i.createElement(c.Z,{title:B.title,description:B.description,url:B.siteUrl}),i.createElement(W,null,o?i.createElement(A.Z,{size:"sm"},"#",o,"에 ",l.length,"개의 글이 있습니다."):i.createElement(A.Z,{size:"sm"},"총 ",r.length,"개의 tag",r.length>1&&"s","가 있습니다."),i.createElement(q.Z,{count:!0,tagList:r,selected:o,onClick:e=>{console.log(e,o),e===o?((0,d.navigate)("/tags"),alert("zz")):(s(e),(0,d.navigate)(`/tags?q=${e.fieldValue}`))}})),i.createElement(P.Z,{size:32,ref:f}),i.createElement(Z.Z,{postList:l}))}},760:function(e,t,r){var n=r(9881);e.exports=function(e,t){var r=[];return n(e,(function(e,n,o){t(e,n,o)&&r.push(e)})),r}},3105:function(e,t,r){var n=r(4963),o=r(760),a=r(7206),i=r(1469);e.exports=function(e,t){return(i(e)?n:o)(e,a(t,3))}}}]);
//# sourceMappingURL=component---src-pages-tags-jsx-adfd25700a5b59c2d7c0.js.map