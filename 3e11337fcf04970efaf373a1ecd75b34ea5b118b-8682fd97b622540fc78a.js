(self.webpackChunkgatsby_starter_hoodie=self.webpackChunkgatsby_starter_hoodie||[]).push([[395],{7151:function(t,e,n){"use strict";var r=n(7294),o=n(1318),i=n.n(o),a=n(2788),l=n(9349),u=n(9583),c=n(231);const s=a.default.div.withConfig({displayName:"Info__BioWrapper",componentId:"sc-nd62ek-0"})(["display:flex;@media (max-width:768px){padding:0 15px;}"]),p=a.default.div.withConfig({displayName:"Info__Author",componentId:"sc-nd62ek-1"})(["color:",";"],(t=>t.theme.colors.text)),f=a.default.div.withConfig({displayName:"Info__LinksWrapper",componentId:"sc-nd62ek-2"})(["& a{margin-right:9.6px;}& svg{width:25.6px;height:25.6px;cursor:pointer;}& svg path{fill:",";transition:fill 0.3s;}& a:hover svg path{fill:",";}"],(t=>t.theme.colors.icon),(t=>t.theme.colors.text)),h="undefined"!=typeof window&&"localhost:8000"===window.location.host?"http://localhost:8000":l.siteUrl,d=a.default.div.withConfig({displayName:"Info__Profile",componentId:"sc-nd62ek-3"})(["flex:0 0 auto;margin-right:30px;width:210px;height:210px;border-radius:999px;background-image:url(","/",".png);background-size:cover;background-position:center;"],h,(t=>t.theme.colors.profile)),m=t=>{let{link:e,children:n}=t;return e?r.createElement("a",{href:e,target:"_blank",rel:"noreferrer"},n):null};e.Z=function(t){let{author:e,language:n="ko"}=t;if(!e)return null;const{bio:o,social:a,name:h}=e,{github:g,kaggle:b,instagram:v,facebook:y,twitter:E,x:x,blogger:k,medium:_,linkedIn:j,email:w,resume:O,link:I}=l.links;return r.createElement(s,{className:"bio"},r.createElement("div",{className:"introduction korean"},r.createElement(p,{className:"title"},"안녕하세요.",r.createElement("br",null),r.createElement(i(),{items:o.description}),r.createElement("br",null),o.role," ",r.createElement("strong",null,h),"입니다.",r.createElement("br",null)),r.createElement(f,null,r.createElement(m,{link:g},r.createElement(u.hJX,null)),r.createElement(m,{link:b},r.createElement(u.jnu,null)),r.createElement(m,{link:v},r.createElement(u.Zf_,null)),r.createElement(m,{link:y},r.createElement(u.Am9,null)),r.createElement(m,{link:E},r.createElement(u.fWC,null)),r.createElement(m,{link:x},r.createElement(c.LCd,null)),r.createElement(m,{link:_},r.createElement(c.Vlo,null)),r.createElement(m,{link:k},r.createElement(c.emo,null)),r.createElement(m,{link:j},r.createElement(u.ltd,null)),r.createElement(m,{link:w},r.createElement(c.uWG,null)),r.createElement(m,{link:O},r.createElement(c.lp$,null)),r.createElement(m,{link:I},r.createElement(c.gjK,null)))),r.createElement(d,null))}},6931:function(t,e,n){"use strict";var r=n(7294),o=n(2788),i=n(4854),a=n(729),l=n(9349);const u=o.default.div.withConfig({displayName:"Tab__TabWrapper",componentId:"sc-1ebif1p-0"})(["display:flex;justify-content:center;gap:15px;border-bottom:1px solid ",";margin-top:35px;margin-bottom:48px;& a{text-decoration:none;}"],(t=>t.theme.colors.divider)),c=o.default.button.withConfig({displayName:"Tab__TabButton",componentId:"sc-1ebif1p-1"})(["display:flex;align-items:center;padding:0 10px;height:43px;background-color:transparent;border:none;border-bottom:2px solid;border-bottom-color:",";font-size:14px;color:",";font-weight:",";letter-spacing:1px;cursor:pointer;transition:all 0.2s;&:hover{color:",";border-bottom-color:",";}& svg{margin-right:10px;height:20px;}"],(t=>t.active?t.theme.colors.text:"transparent"),(t=>t.active?t.theme.colors.text:t.theme.colors.tertiaryText),(t=>t.active?"bold":"normal"),(t=>t.theme.colors.text),(t=>t.active?t.theme.colors.text:t.theme.colors.divider)),s=o.default.span.withConfig({displayName:"Tab__Badge",componentId:"sc-1ebif1p-2"})(["display:inline-block;margin-left:7px;padding:3px 6px;border-radius:50px;background-color:",";color:",";font-weight:normal;font-size:13px;letter-spacing:0.3px;transition:all 0.2s;"],(t=>t.theme.colors.tagBackground),(t=>t.theme.colors.tagText));e.Z=t=>{let{postsCount:e,activeTab:n}=t;return l.useAbout?r.createElement(u,null,r.createElement(i.Link,{to:"/"},r.createElement(c,{active:"posts"==n},"POSTS ",r.createElement(s,null,e))),r.createElement(i.Link,{to:"/about"},r.createElement(c,{active:"about"==n},"ABOUT"))):r.createElement(a.Z,null)}},3969:function(t,e,n){var r=9007199254740991,o="[object Arguments]",i="[object Function]",a="[object GeneratorFunction]",l="[object Map]",u="[object Promise]",c="[object Set]",s="[object String]",p="[object WeakMap]",f="[object DataView]",h=/^\[object .+?Constructor\]$/,d=/^(?:0|[1-9]\d*)$/,m="\\ud800-\\udfff",g="\\u0300-\\u036f\\ufe20-\\ufe23",b="\\u20d0-\\u20f0",v="\\ufe0e\\ufe0f",y="["+m+"]",E="["+g+b+"]",x="\\ud83c[\\udffb-\\udfff]",k="[^"+m+"]",_="(?:\\ud83c[\\udde6-\\uddff]){2}",j="[\\ud800-\\udbff][\\udc00-\\udfff]",w="\\u200d",O="(?:"+E+"|"+x+")"+"?",I="["+v+"]?",S=I+O+("(?:"+w+"(?:"+[k,_,j].join("|")+")"+I+O+")*"),T="(?:"+[k+E+"?",E,_,j,y].join("|")+")",P=RegExp(x+"(?="+x+")|"+T+S,"g"),M=RegExp("["+w+m+g+b+v+"]"),C="object"==typeof n.g&&n.g&&n.g.Object===Object&&n.g,A="object"==typeof self&&self&&self.Object===Object&&self,N=C||A||Function("return this")();function D(t,e){return function(t,e){for(var n=-1,r=t?t.length:0,o=Array(r);++n<r;)o[n]=e(t[n],n,t);return o}(e,(function(e){return t[e]}))}function L(t){var e=-1,n=Array(t.size);return t.forEach((function(t,r){n[++e]=[r,t]})),n}function W(t){var e=-1,n=Array(t.size);return t.forEach((function(t){n[++e]=t})),n}function $(t){return function(t){return M.test(t)}(t)?function(t){return t.match(P)||[]}(t):function(t){return t.split("")}(t)}var B,z,F,R=Function.prototype,Z=Object.prototype,U=N["__core-js_shared__"],V=(B=/[^.]+$/.exec(U&&U.keys&&U.keys.IE_PROTO||""))?"Symbol(src)_1."+B:"",G=R.toString,J=Z.hasOwnProperty,K=Z.toString,X=RegExp("^"+G.call(J).replace(/[\\^$.*+?()[\]{}|]/g,"\\$&").replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g,"$1.*?")+"$"),q=N.Symbol,H=q?q.iterator:void 0,Q=Z.propertyIsEnumerable,Y=(z=Object.keys,F=Object,function(t){return z(F(t))}),tt=ht(N,"DataView"),et=ht(N,"Map"),nt=ht(N,"Promise"),rt=ht(N,"Set"),ot=ht(N,"WeakMap"),it=gt(tt),at=gt(et),lt=gt(nt),ut=gt(rt),ct=gt(ot);function st(t,e){var n=bt(t)||function(t){return function(t){return xt(t)&&vt(t)}(t)&&J.call(t,"callee")&&(!Q.call(t,"callee")||K.call(t)==o)}(t)?function(t,e){for(var n=-1,r=Array(t);++n<t;)r[n]=e(n);return r}(t.length,String):[],r=n.length,i=!!r;for(var a in t)!e&&!J.call(t,a)||i&&("length"==a||mt(a,r))||n.push(a);return n}function pt(t){if(!Et(t)||function(t){return!!V&&V in t}(t))return!1;var e=yt(t)||function(t){var e=!1;if(null!=t&&"function"!=typeof t.toString)try{e=!!(t+"")}catch(n){}return e}(t)?X:h;return e.test(gt(t))}function ft(t){if(n=(e=t)&&e.constructor,r="function"==typeof n&&n.prototype||Z,e!==r)return Y(t);var e,n,r,o=[];for(var i in Object(t))J.call(t,i)&&"constructor"!=i&&o.push(i);return o}function ht(t,e){var n=function(t,e){return null==t?void 0:t[e]}(t,e);return pt(n)?n:void 0}var dt=function(t){return K.call(t)};function mt(t,e){return!!(e=null==e?r:e)&&("number"==typeof t||d.test(t))&&t>-1&&t%1==0&&t<e}function gt(t){if(null!=t){try{return G.call(t)}catch(e){}try{return t+""}catch(e){}}return""}(tt&&dt(new tt(new ArrayBuffer(1)))!=f||et&&dt(new et)!=l||nt&&dt(nt.resolve())!=u||rt&&dt(new rt)!=c||ot&&dt(new ot)!=p)&&(dt=function(t){var e=K.call(t),n="[object Object]"==e?t.constructor:void 0,r=n?gt(n):void 0;if(r)switch(r){case it:return f;case at:return l;case lt:return u;case ut:return c;case ct:return p}return e});var bt=Array.isArray;function vt(t){return null!=t&&function(t){return"number"==typeof t&&t>-1&&t%1==0&&t<=r}(t.length)&&!yt(t)}function yt(t){var e=Et(t)?K.call(t):"";return e==i||e==a}function Et(t){var e=typeof t;return!!t&&("object"==e||"function"==e)}function xt(t){return!!t&&"object"==typeof t}function kt(t){return t?D(t,function(t){return vt(t)?st(t):ft(t)}(t)):[]}t.exports=function(t){if(!t)return[];if(vt(t))return function(t){return"string"==typeof t||!bt(t)&&xt(t)&&K.call(t)==s}(t)?$(t):function(t,e){var n=-1,r=t.length;for(e||(e=Array(r));++n<r;)e[n]=t[n];return e}(t);if(H&&t[H])return function(t){for(var e,n=[];!(e=t.next()).done;)n.push(e.value);return n}(t[H]());var e=dt(t);return(e==l?L:e==c?W:kt)(t)}},1318:function(t,e,n){"use strict";Object.defineProperty(e,"__esModule",{value:!0});var r=Object.assign||function(t){for(var e=1;e<arguments.length;e++){var n=arguments[e];for(var r in n)Object.prototype.hasOwnProperty.call(n,r)&&(t[r]=n[r])}return t},o=function(){function t(t,e){for(var n=0;n<e.length;n++){var r=e[n];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(t,r.key,r)}}return function(e,n,r){return n&&t(e.prototype,n),r&&t(e,r),e}}();var i=n(7294),a=n(5697),l=n(3969),u=function(t){function e(t){!function(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")}(this,e),function(t,e,n){for(var r=!0;r;){var o=t,i=e,a=n;r=!1,null===o&&(o=Function.prototype);var l=Object.getOwnPropertyDescriptor(o,i);if(void 0!==l){if("value"in l)return l.value;var u=l.get;if(void 0===u)return;return u.call(a)}var c=Object.getPrototypeOf(o);if(null===c)return;t=c,e=i,n=a,r=!0,l=c=void 0}}(Object.getPrototypeOf(e.prototype),"constructor",this).call(this,t);var n=this.props,r=n.items,o=n.random;this.state={index:o?Math.floor(Math.random()*Math.floor(r.length)):0,output:"",substrLength:0},this.timeouts=[]}return function(t,e){if("function"!=typeof e&&null!==e)throw new TypeError("Super expression must either be null or a function, not "+typeof e);t.prototype=Object.create(e&&e.prototype,{constructor:{value:t,enumerable:!1,writable:!0,configurable:!0}}),e&&(Object.setPrototypeOf?Object.setPrototypeOf(t,e):t.__proto__=e)}(e,t),o(e,[{key:"componentDidMount",value:function(){this._animate.bind(this)()}},{key:"componentWillUnmount",value:function(){this.timeouts.map((function(t){return clearTimeout(t)}))}},{key:"_loop",value:function(t,e){var n=setTimeout(t,e);this.timeouts.push(n);this.timeouts.length>100&&(clearTimeout(this.timeouts[0]),this.timeouts.shift())}},{key:"_type",value:function(t,e){var n=this.state.output,r=this.props.typingInterval,o=this._type.bind(this,t,e),i=l(t);this.setState({output:i.slice(0,l(n).length+1).join("")}),n.length<i.length?this._loop(o,r):("function"==typeof this.props.onTypingEnd&&this.props.onTypingEnd(),e())}},{key:"_erase",value:function(t){var e=this.state.output,n=this.props.deletingInterval,r=this._erase.bind(this,t),o=l(e);"function"==typeof this.props.onDeletingStart&&this.props.onDeletingStart(),this.setState({output:o.slice(0,o.length-1).join("")}),0!==o.length?this._loop(r,n):("function"==typeof this.props.onDeletingEnd&&this.props.onDeletingEnd(),t())}},{key:"_overwrite",value:function(t,e){var n=this.state,r=n.output,o=n.substrLength,i=this.props.deletingInterval,a=this._overwrite.bind(this,t,e),u=l(t),c=l(r);this.setState({output:u.slice(0,o).concat(c.slice(o)),substrLength:o+1}),u.length!==o?this._loop(a,i):(this.setState({output:t,substrLength:0}),e())}},{key:"_animate",value:function(){var t=this,e=this.state.index,n=this.props,r=n.items,o=n.pause,i=n.emptyPause,a=n.eraseMode,l=n.random,u=this._type,c=this._erase,s=this._overwrite,p=this._animate.bind(this),f=void 0;f=l?Math.floor(Math.random()*Math.floor(r.length)):e===r.length-1?0:e+1;var h=function(){t.setState({index:f}),t._loop(p,i)};"function"==typeof this.props.onTypingStart&&this.props.onTypingStart(),u.bind(this)(r[e],(function(){"overwrite"===a?t._loop(s.bind(t,r[f],h),o):t._loop(c.bind(t,h),o)}))}},{key:"render",value:function(){var t=this.props,e=t.color,n=t.cursor,o=(t.deletingInterval,t.emptyPause,t.items,t.pause,t.eraseMode,t.typingInterval,t.random,function(t,e){var n={};for(var r in t)e.indexOf(r)>=0||Object.prototype.hasOwnProperty.call(t,r)&&(n[r]=t[r]);return n}(t,["color","cursor","deletingInterval","emptyPause","items","pause","eraseMode","typingInterval","random"]));return i.createElement("span",r({style:{color:e}},o),this.state.output,n?i.createElement("span",{className:"react-rotating-text-cursor"},"|"):null)}}]),e}(i.Component);u.propTypes={color:a.string,cursor:a.bool,deletingInterval:a.number,emptyPause:a.number,eraseMode:a.string,items:a.array,pause:a.number,typingInterval:a.number,random:a.bool,onTypingStart:a.func,onTypingEnd:a.func,onDeletingStart:a.func,onDeletingEnd:a.func},u.defaultProps={color:"inherit",cursor:!0,deletingInterval:50,emptyPause:1e3,eraseMode:"erase",items:["first","second","third","fourth","fifth"],pause:1500,typingInterval:50,random:!1},e.default=u,t.exports=e.default}}]);
//# sourceMappingURL=3e11337fcf04970efaf373a1ecd75b34ea5b118b-8682fd97b622540fc78a.js.map