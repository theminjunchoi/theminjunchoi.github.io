(self.webpackChunkgatsby_starter_hoodie=self.webpackChunkgatsby_starter_hoodie||[]).push([[749],{3416:function(e,t,n){"use strict";var l=n(6540),o=n(2568),a=n(1612),i=n(7008),r=n(1960);const c=o.default.div.withConfig({displayName:"Bio__BioWrapper",componentId:"sc-5v8ml6-0"})(["display:flex;align-items:center;@media (max-width:768px){padding:0 15px;}"]),s="undefined"!=typeof window&&"localhost:8000"===window.location.host?"http://localhost:8000":r.siteUrl,m=o.default.div.withConfig({displayName:"Bio__Profile",componentId:"sc-5v8ml6-1"})(["flex:0 0 auto;margin-right:30px;width:128px;height:128px;border-radius:999px;background-image:url(","/",".png);background-size:cover;background-position:center;"],s,(e=>e.theme.colors.profile)),d=o.default.div.withConfig({displayName:"Bio__Author",componentId:"sc-5v8ml6-2"})(["margin-bottom:8px;font-size:24px;font-weight:700;color:",";"],(e=>e.theme.colors.text)),p=o.default.div.withConfig({displayName:"Bio__Description",componentId:"sc-5v8ml6-3"})(["margin-bottom:11.2px;line-height:1.5;font-size:16px;color:",";"],(e=>e.theme.colors.secondaryText)),u=o.default.div.withConfig({displayName:"Bio__LinksWrapper",componentId:"sc-5v8ml6-4"})(["& a{margin-right:9.6px;}& svg{width:25.6px;height:25.6px;cursor:pointer;}& svg path{fill:",";transition:fill 0.3s;}& a:hover svg path{fill:",";}"],(e=>e.theme.colors.icon),(e=>e.theme.colors.text)),g=e=>{let{link:t,children:n}=e;return t?l.createElement("a",{href:t,target:"_blank",rel:"noreferrer"},n):null};t.A=()=>{const{github:e,kaggle:t,instagram:n,facebook:o,twitter:s,x:f,blogger:h,medium:x,linkedIn:E,email:b,resume:k,link:v}=r.links;return l.createElement(c,{id:"bio"},l.createElement(m,null),l.createElement("div",null,l.createElement(d,null,"@",r.author),l.createElement(p,null,r.description),l.createElement(u,null,l.createElement(g,{link:e},l.createElement(a.hL4,null)),l.createElement(g,{link:t},l.createElement(a.jJF,null)),l.createElement(g,{link:n},l.createElement(a.ao$,null)),l.createElement(g,{link:o},l.createElement(a.iYk,null)),l.createElement(g,{link:s},l.createElement(a.feZ,null)),l.createElement(g,{link:f},l.createElement(i.TCj,null)),l.createElement(g,{link:x},l.createElement(i.DC0,null)),l.createElement(g,{link:h},l.createElement(i.KRq,null)),l.createElement(g,{link:E},l.createElement(a.QEs,null)),l.createElement(g,{link:b},l.createElement(i.Wjb,null)),l.createElement(g,{link:k},l.createElement(i.HkI,null)),l.createElement(g,{link:v},l.createElement(i.AnD,null)))))}},5608:function(e,t,n){"use strict";var l=n(7350),o=n.n(l),a=n(6540),i=n(2568),r=n(4794),c=n(2912),s=n(3173),m=n(786);const d=i.default.div.withConfig({displayName:"PostList__PostListWrapper",componentId:"sc-1oqnm6-0"})(["@media (max-width:768px){padding:0 10px;}"]),p=i.default.div.withConfig({displayName:"PostList__PostWrapper",componentId:"sc-1oqnm6-1"})(["position:relative;top:0;transition:all 0.5s;@media (max-width:768px){padding:0 5px;}"]),u=i.default.p.withConfig({displayName:"PostList__Date",componentId:"sc-1oqnm6-2"})(["margin-bottom:16px;font-size:14.4px;color:",";"],(e=>e.theme.colors.tertiaryText)),g=i.default.p.withConfig({displayName:"PostList__Excerpt",componentId:"sc-1oqnm6-3"})(["margin-bottom:32px;line-height:1.7;font-size:16px;color:",";word-break:break-all;"],(e=>e.theme.colors.secondaryText));t.A=e=>{let{postList:t}=e;const{0:n,1:l}=(0,a.useState)(10),i=o()((()=>{document.documentElement.scrollHeight-document.documentElement.scrollTop<=document.documentElement.clientHeight+100&&n<t.length&&setTimeout((()=>l(n+10)),300)}),250);return(0,a.useEffect)((()=>(window.addEventListener("scroll",i),()=>{window.removeEventListener("scroll",i)})),[n,t]),(0,a.useEffect)((()=>{l(10)}),[t]),a.createElement(d,null,t.slice(0,n).map(((e,l)=>{const{title:o,description:i,date:d,tags:f}=e.frontmatter,{excerpt:h}=e,{slug:x}=e.fields;return a.createElement(a.Fragment,null,a.createElement(p,null,a.createElement(c.A,{size:"bg"},a.createElement(r.Link,{to:x},o)),a.createElement(u,null,d),i?a.createElement(g,null,i):a.createElement(g,null,h),a.createElement(m.A,{tagList:f})),n-1!==l&&t.length-1!==l&&a.createElement(s.A,{mt:"48px",mb:"32px"}))})))}},2205:function(e,t,n){"use strict";var l=n(5378),o=n.n(l),a=n(6540),i=n(2568),r=n(4794);const c=i.default.div.withConfig({displayName:"SideTagList__RelativeWrapper",componentId:"sc-11pn9fc-0"})(["position:relative;"]),s=i.default.aside.withConfig({displayName:"SideTagList__Wrapper",componentId:"sc-11pn9fc-1"})(["position:absolute;left:112%;top:0px;width:200px;height:100px;font-size:16px;@media (max-width:1300px){display:none;}"]),m=i.default.div.withConfig({displayName:"SideTagList__Title",componentId:"sc-11pn9fc-2"})(["margin-bottom:25px;font-weight:bold;color:",";"],(e=>e.theme.colors.secondaryText)),d=i.default.li.withConfig({displayName:"SideTagList__Tag",componentId:"sc-11pn9fc-3"})(["margin-bottom:16px;color:",";cursor:pointer;transition:color 0.3s;&:hover{color:",";}& > a{color:inherit;text-decoration:none;}"],(e=>e.theme.colors.tertiaryText),(e=>e.theme.colors.text));t.A=e=>{let{tags:t,postCount:n}=e;return a.createElement(c,null,a.createElement(s,null,a.createElement(m,null,"TAG LIST"),a.createElement("ul",null,a.createElement(d,null,a.createElement(r.Link,{to:"/tags"},"all (",n,")")),o()(t,(e=>a.createElement(d,null,a.createElement(r.Link,{to:"/tags?q="+e.fieldValue},e.fieldValue," (",e.totalCount,")")))))))}},9775:function(e,t,n){"use strict";var l=n(6540),o=n(2568),a=n(4794),i=n(3173),r=n(1960);const c=o.default.div.withConfig({displayName:"Tab__TabWrapper",componentId:"sc-1ebif1p-0"})(["display:flex;justify-content:center;gap:15px;border-bottom:1px solid ",";margin-top:35px;margin-bottom:48px;& a{text-decoration:none;}"],(e=>e.theme.colors.divider)),s=o.default.button.withConfig({displayName:"Tab__TabButton",componentId:"sc-1ebif1p-1"})(["display:flex;align-items:center;padding:0 10px;height:43px;background-color:transparent;border:none;border-bottom:2px solid;border-bottom-color:",";font-size:14px;color:",";font-weight:",";letter-spacing:1px;cursor:pointer;transition:all 0.2s;&:hover{color:",";border-bottom-color:",";}& svg{margin-right:10px;height:20px;}"],(e=>e.active?e.theme.colors.text:"transparent"),(e=>e.active?e.theme.colors.text:e.theme.colors.tertiaryText),(e=>e.active?"bold":"normal"),(e=>e.theme.colors.text),(e=>e.active?e.theme.colors.text:e.theme.colors.divider)),m=o.default.span.withConfig({displayName:"Tab__Badge",componentId:"sc-1ebif1p-2"})(["display:inline-block;margin-left:7px;padding:3px 6px;border-radius:50px;background-color:",";color:",";font-weight:normal;font-size:13px;letter-spacing:0.3px;transition:all 0.2s;"],(e=>e.theme.colors.tagBackground),(e=>e.theme.colors.tagText));t.A=e=>{let{postsCount:t,activeTab:n}=e;return r.useAbout?l.createElement(c,null,l.createElement(a.Link,{to:"/"},l.createElement(s,{active:"posts"==n},"POSTS ",l.createElement(m,null,t))),l.createElement(a.Link,{to:"/about"},l.createElement(s,{active:"about"==n},"ABOUT"))):l.createElement(i.A,null)}},786:function(e,t,n){"use strict";var l=n(6540),o=n(2568),a=n(4794);const i=o.default.div.withConfig({displayName:"TagList__TagListWrapper",componentId:"sc-s1uz5f-0"})(["margin-bottom:10px;word-break:break-all;"]),r=o.default.div.withConfig({displayName:"TagList__TagLink",componentId:"sc-s1uz5f-1"})(["display:inline-block;padding:9.6px 11.2px;margin-right:8px;margin-bottom:8px;border-radius:50px;background-color:",";color:",";text-decoration:none;font-size:14.4px;transition:all 0.2s;&:hover{background-color:",";}"],(e=>e.selected?e.theme.colors.selectedTagBackground:e.theme.colors.tagBackground),(e=>e.selected?e.theme.colors.selectedTagText:e.theme.colors.tagText),(e=>e.selected?e.theme.colors.hoveredSelectedTagBackground:e.theme.colors.hoveredTagBackground)),c=e=>e.replace(/\s+/g,"-");t.A=e=>{let{tagList:t,count:n,selected:o}=e;return t?n?l.createElement(i,null,t.map(((e,t)=>l.createElement(a.Link,{key:JSON.stringify({tag:e,i:t}),to:o===e.fieldValue?"/tags":"/tags?q="+encodeURIComponent(e.fieldValue)},l.createElement(r,{selected:e.fieldValue===o},c(e.fieldValue)," (",e.totalCount,")"))))):l.createElement(i,null,t.map(((e,t)=>l.createElement(a.Link,{key:JSON.stringify({tag:e,i:t}),to:"/tags?q="+e},l.createElement(r,null,c(e)))))):null}},4865:function(e,t,n){"use strict";n.r(t);var l=n(3031),o=n.n(l),a=n(6540),i=n(6288),r=n(5482),c=n(3416),s=n(5608),m=n(2205),d=n(3173),p=n(698),u=(n(9775),n(1960));t.default=e=>{let{data:t}=e;const n=t.allMarkdownRemark.nodes,l=o()(t.allMarkdownRemark.group,["totalCount"]).reverse();return 0===n.length?a.createElement("p",null,'No blog posts found. Add markdown posts to "content/blog" (or the directory you specified for the "gatsby-source-filesystem" plugin in gatsby-config.js).'):a.createElement(i.A,null,a.createElement(r.A,{title:u.title,description:u.description,url:u.siteUrl}),a.createElement(p.A,{size:48}),a.createElement(c.A,null),a.createElement(d.A,null),a.createElement(m.A,{tags:l,postCount:n.length}),a.createElement(s.A,{postList:n}))}},5378:function(e,t,n){var l=n(4932),o=n(5389),a=n(5128),i=n(6449);e.exports=function(e,t){return(i(e)?l:a)(e,o(t,3))}}}]);
//# sourceMappingURL=component---src-pages-hide-jsx-997d36c208cf687b1d48.js.map