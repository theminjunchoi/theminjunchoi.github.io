"use strict";(self.webpackChunkgatsby_starter_hoodie=self.webpackChunkgatsby_starter_hoodie||[]).push([[81],{4221:function(e,t,r){r.r(t),r.d(t,{default:function(){return M}});var n={};r.r(n),r.d(n,{exclude:function(){return _},extract:function(){return I},parse:function(){return N},parseUrl:function(){return $},pick:function(){return U},stringify:function(){return R},stringifyUrl:function(){return A}});var o=r(9734),a=r.n(o),i=r(7294),c=r(2788),s=r(5609),l=r(3105),u=r.n(l),p=r(1883);const f="%[a-f0-9]{2}",d=new RegExp("("+f+")|([^%]+?)","gi"),m=new RegExp("("+f+")+","gi");function y(e,t){try{return[decodeURIComponent(e.join(""))]}catch{}if(1===e.length)return e;t=t||1;const r=e.slice(0,t),n=e.slice(t);return Array.prototype.concat.call([],y(r),y(n))}function g(e){try{return decodeURIComponent(e)}catch{let t=e.match(d)||[];for(let r=1;r<t.length;r++)t=(e=y(t,r).join("")).match(d)||[];return e}}function b(e){if("string"!=typeof e)throw new TypeError("Expected `encodedURI` to be of type `string`, got `"+typeof e+"`");try{return decodeURIComponent(e)}catch{return function(e){const t={"%FE%FF":"��","%FF%FE":"��"};let r=m.exec(e);for(;r;){try{t[r[0]]=decodeURIComponent(r[0])}catch{const e=g(r[0]);e!==r[0]&&(t[r[0]]=e)}r=m.exec(e)}t["%C2"]="�";const n=Object.keys(t);for(const o of n)e=e.replace(new RegExp(o,"g"),t[o]);return e}(e)}}function h(e,t){if("string"!=typeof e||"string"!=typeof t)throw new TypeError("Expected the arguments to be of type `string`");if(""===e||""===t)return[];const r=e.indexOf(t);return-1===r?[]:[e.slice(0,r),e.slice(r+t.length)]}function k(e,t){const r={};if(Array.isArray(t))for(const n of t){const t=Object.getOwnPropertyDescriptor(e,n);t?.enumerable&&Object.defineProperty(r,n,t)}else for(const n of Reflect.ownKeys(e)){const o=Object.getOwnPropertyDescriptor(e,n);if(o.enumerable){t(n,e[n],e)&&Object.defineProperty(r,n,o)}}return r}const j=e=>null==e,E=e=>encodeURIComponent(e).replace(/[!'()*]/g,(e=>`%${e.charCodeAt(0).toString(16).toUpperCase()}`)),F=Symbol("encodeFragmentIdentifier");function w(e){if("string"!=typeof e||1!==e.length)throw new TypeError("arrayFormatSeparator must be single character string")}function v(e,t){return t.encode?t.strict?E(e):encodeURIComponent(e):e}function x(e,t){return t.decode?b(e):e}function O(e){return Array.isArray(e)?e.sort():"object"==typeof e?O(Object.keys(e)).sort(((e,t)=>Number(e)-Number(t))).map((t=>e[t])):e}function S(e){const t=e.indexOf("#");return-1!==t&&(e=e.slice(0,t)),e}function C(e,t){return t.parseNumbers&&!Number.isNaN(Number(e))&&"string"==typeof e&&""!==e.trim()?e=Number(e):!t.parseBooleans||null===e||"true"!==e.toLowerCase()&&"false"!==e.toLowerCase()||(e="true"===e.toLowerCase()),e}function I(e){const t=(e=S(e)).indexOf("?");return-1===t?"":e.slice(t+1)}function N(e,t){w((t={decode:!0,sort:!0,arrayFormat:"none",arrayFormatSeparator:",",parseNumbers:!1,parseBooleans:!1,...t}).arrayFormatSeparator);const r=function(e){let t;switch(e.arrayFormat){case"index":return(e,r,n)=>{t=/\[(\d*)]$/.exec(e),e=e.replace(/\[\d*]$/,""),t?(void 0===n[e]&&(n[e]={}),n[e][t[1]]=r):n[e]=r};case"bracket":return(e,r,n)=>{t=/(\[])$/.exec(e),e=e.replace(/\[]$/,""),t?void 0!==n[e]?n[e]=[...n[e],r]:n[e]=[r]:n[e]=r};case"colon-list-separator":return(e,r,n)=>{t=/(:list)$/.exec(e),e=e.replace(/:list$/,""),t?void 0!==n[e]?n[e]=[...n[e],r]:n[e]=[r]:n[e]=r};case"comma":case"separator":return(t,r,n)=>{const o="string"==typeof r&&r.includes(e.arrayFormatSeparator),a="string"==typeof r&&!o&&x(r,e).includes(e.arrayFormatSeparator);r=a?x(r,e):r;const i=o||a?r.split(e.arrayFormatSeparator).map((t=>x(t,e))):null===r?r:x(r,e);n[t]=i};case"bracket-separator":return(t,r,n)=>{const o=/(\[])$/.test(t);if(t=t.replace(/\[]$/,""),!o)return void(n[t]=r?x(r,e):r);const a=null===r?[]:r.split(e.arrayFormatSeparator).map((t=>x(t,e)));void 0!==n[t]?n[t]=[...n[t],...a]:n[t]=a};default:return(e,t,r)=>{void 0!==r[e]?r[e]=[...[r[e]].flat(),t]:r[e]=t}}}(t),n=Object.create(null);if("string"!=typeof e)return n;if(!(e=e.trim().replace(/^[?#&]/,"")))return n;for(const o of e.split("&")){if(""===o)continue;const e=t.decode?o.replace(/\+/g," "):o;let[a,i]=h(e,"=");void 0===a&&(a=e),i=void 0===i?null:["comma","separator","bracket-separator"].includes(t.arrayFormat)?i:x(i,t),r(x(a,t),i,n)}for(const[o,a]of Object.entries(n))if("object"==typeof a&&null!==a)for(const[e,r]of Object.entries(a))a[e]=C(r,t);else n[o]=C(a,t);return!1===t.sort?n:(!0===t.sort?Object.keys(n).sort():Object.keys(n).sort(t.sort)).reduce(((e,t)=>{const r=n[t];return Boolean(r)&&"object"==typeof r&&!Array.isArray(r)?e[t]=O(r):e[t]=r,e}),Object.create(null))}function R(e,t){if(!e)return"";w((t={encode:!0,strict:!0,arrayFormat:"none",arrayFormatSeparator:",",...t}).arrayFormatSeparator);const r=r=>t.skipNull&&j(e[r])||t.skipEmptyString&&""===e[r],n=function(e){switch(e.arrayFormat){case"index":return t=>(r,n)=>{const o=r.length;return void 0===n||e.skipNull&&null===n||e.skipEmptyString&&""===n?r:null===n?[...r,[v(t,e),"[",o,"]"].join("")]:[...r,[v(t,e),"[",v(o,e),"]=",v(n,e)].join("")]};case"bracket":return t=>(r,n)=>void 0===n||e.skipNull&&null===n||e.skipEmptyString&&""===n?r:null===n?[...r,[v(t,e),"[]"].join("")]:[...r,[v(t,e),"[]=",v(n,e)].join("")];case"colon-list-separator":return t=>(r,n)=>void 0===n||e.skipNull&&null===n||e.skipEmptyString&&""===n?r:null===n?[...r,[v(t,e),":list="].join("")]:[...r,[v(t,e),":list=",v(n,e)].join("")];case"comma":case"separator":case"bracket-separator":{const t="bracket-separator"===e.arrayFormat?"[]=":"=";return r=>(n,o)=>void 0===o||e.skipNull&&null===o||e.skipEmptyString&&""===o?n:(o=null===o?"":o,0===n.length?[[v(r,e),t,v(o,e)].join("")]:[[n,v(o,e)].join(e.arrayFormatSeparator)])}default:return t=>(r,n)=>void 0===n||e.skipNull&&null===n||e.skipEmptyString&&""===n?r:null===n?[...r,v(t,e)]:[...r,[v(t,e),"=",v(n,e)].join("")]}}(t),o={};for(const[i,c]of Object.entries(e))r(i)||(o[i]=c);const a=Object.keys(o);return!1!==t.sort&&a.sort(t.sort),a.map((r=>{const o=e[r];return void 0===o?"":null===o?v(r,t):Array.isArray(o)?0===o.length&&"bracket-separator"===t.arrayFormat?v(r,t)+"[]":o.reduce(n(r),[]).join("&"):v(r,t)+"="+v(o,t)})).filter((e=>e.length>0)).join("&")}function $(e,t){t={decode:!0,...t};let[r,n]=h(e,"#");return void 0===r&&(r=e),{url:r?.split("?")?.[0]??"",query:N(I(e),t),...t&&t.parseFragmentIdentifier&&n?{fragmentIdentifier:x(n,t)}:{}}}function A(e,t){t={encode:!0,strict:!0,[F]:!0,...t};const r=S(e.url).split("?")[0]||"";let n=R({...N(I(e.url),{sort:!1}),...e.query},t);n&&(n=`?${n}`);let o=function(e){let t="";const r=e.indexOf("#");return-1!==r&&(t=e.slice(r)),t}(e.url);if(e.fragmentIdentifier){const n=new URL(r);n.hash=e.fragmentIdentifier,o=t[F]?n.hash:`#${e.fragmentIdentifier}`}return`${r}${n}${o}`}function U(e,t,r){r={parseFragmentIdentifier:!0,[F]:!1,...r};const{url:n,query:o,fragmentIdentifier:a}=$(e,r);return A({url:n,query:k(o,t),fragmentIdentifier:a},r)}function _(e,t,r){return U(e,Array.isArray(t)?e=>!t.includes(e):(e,r)=>!t(e,r),r)}var L=n,T=r(5038),Z=r(2213),q=r(184),z=r(1811),P=r(1093),B=r(9349);const D=c.default.div.withConfig({displayName:"tags__TagListWrapper",componentId:"sc-1p0kse9-0"})(["margin-top:20px;@media (max-width:768px){padding:0 15px;}"]);c.default.p.withConfig({displayName:"tags__TagTitle",componentId:"sc-1p0kse9-1"})(["color:",";display:inline;"],(e=>e.theme.colors.secondAccentText));var M=e=>{let{data:t}=e;const r=a()(t.allMarkdownRemark.group,["totalCount"]).reverse(),n=t.allMarkdownRemark.nodes,{0:o,1:c}=(0,i.useState)(),{0:l,1:f}=(0,i.useState)([]),d=(0,i.useRef)(null);let m=null;return"undefined"!=typeof document&&(m=document.location.search),(0,i.useEffect)((()=>{if(!o)return void f(n);const e=u()(n,(e=>e.frontmatter.tags&&-1!==e.frontmatter.tags.indexOf(o)));f(e)}),[o,n]),(0,i.useEffect)((()=>{const e=decodeURIComponent(L.parse(m).q||"");c(e)}),[m]),i.createElement(T.Z,null,i.createElement(s.Z,{title:B.title,description:B.description,url:B.siteUrl}),i.createElement(D,null,o?i.createElement(Z.Z,{size:"sm"},"#",o,"에 ",l.length,"개의 글이 있습니다."):i.createElement(Z.Z,{size:"sm"},"총 ",r.length,"개의 tag",r.length>1&&"s","가 있습니다."),i.createElement(q.Z,{count:!0,tagList:r,selected:o,onClick:e=>{console.log(e,o),e===o?((0,p.navigate)("/tags"),alert("zz")):(c(e),(0,p.navigate)("/tags?q="+e.fieldValue))}})),i.createElement(P.Z,{size:32,ref:d}),i.createElement(z.Z,{postList:l}))}}}]);
//# sourceMappingURL=component---src-pages-tags-jsx-a6fdda42a8d093db5009.js.map