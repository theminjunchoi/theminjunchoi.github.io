"use strict";(self.webpackChunkgatsby_starter_hoodie=self.webpackChunkgatsby_starter_hoodie||[]).push([[96,415],{9775:function(e,t,o){var n=o(6540),a=o(2568),i=o(4794),r=o(3173),l=o(1960);const c=a.default.div.withConfig({displayName:"Tab__TabWrapper",componentId:"sc-1ebif1p-0"})(["display:flex;justify-content:center;gap:15px;border-bottom:1px solid ",";margin-top:35px;margin-bottom:48px;& a{text-decoration:none;}"],(e=>e.theme.colors.divider)),s=a.default.button.withConfig({displayName:"Tab__TabButton",componentId:"sc-1ebif1p-1"})(["display:flex;align-items:center;padding:0 10px;height:43px;background-color:transparent;border:none;border-bottom:2px solid;border-bottom-color:",";font-size:14px;color:",";font-weight:",";letter-spacing:1px;cursor:pointer;transition:all 0.2s;&:hover{color:",";border-bottom-color:",";}& svg{margin-right:10px;height:20px;}"],(e=>e.active?e.theme.colors.text:"transparent"),(e=>e.active?e.theme.colors.text:e.theme.colors.tertiaryText),(e=>e.active?"bold":"normal"),(e=>e.theme.colors.text),(e=>e.active?e.theme.colors.text:e.theme.colors.divider)),d=a.default.span.withConfig({displayName:"Tab__Badge",componentId:"sc-1ebif1p-2"})(["display:inline-block;margin-left:7px;padding:3px 6px;border-radius:50px;background-color:",";color:",";font-weight:normal;font-size:13px;letter-spacing:0.3px;transition:all 0.2s;"],(e=>e.theme.colors.tagBackground),(e=>e.theme.colors.tagText));t.A=e=>{let{postsCount:t,activeTab:o}=e;return l.useAbout?n.createElement(c,null,n.createElement(i.Link,{to:"/"},n.createElement(s,{active:"posts"==o},"POSTS ",n.createElement(d,null,t))),n.createElement(i.Link,{to:"/about"},n.createElement(s,{active:"about"==o},"ABOUT"))):n.createElement(r.A,null)}},698:function(e,t,o){var n=o(2568);t.A=n.default.div.withConfig({displayName:"VerticalSpace",componentId:"sc-fbwjqc-0"})(["height:","px;"],(e=>e.size))},3729:function(e,t,o){o.r(t);var n=o(6540),a=o(2568),i=o(6288),r=o(5482),l=o(1960);const c=a.default.div.withConfig({displayName:"sc-404__NotFound",componentId:"sc-6px2gd-0"})(["height:800px;display:flex;flex-direction:column;justify-content:center;align-items:center;color:",";& > h2{margin-bottom:16px;font-weight:bold;font-size:48px;}& > h3{font-weight:lighter;font-size:30.4px;}@media (max-width:768px){height:300px;}"],(e=>e.theme.colors.tertiaryText));t.default=()=>n.createElement(i.A,null,n.createElement(r.A,{title:l.title,description:l.description,url:l.siteUrl}),n.createElement(c,null,n.createElement("h2",null,"404 ERROR"),n.createElement("h3",null,"Page Not Found X(")))},990:function(e,t,o){o.r(t),o.d(t,{default:function(){return u}});var n=o(6540),a=o(6288),i=o(5482),r=o(3416),l=o(698),c=o(6387),s=(o(8392),o(3955),o(1960));var d=o(9775),p=o(3729),m=o(2568);o(3173);m.default.h1.withConfig({displayName:"about__ArticleTitle",componentId:"sc-17crp4s-0"})(["margin-bottom:30px;line-height:1.2;font-size:32px;font-weight:700;color:",";"],(e=>e.theme.colors.text)),m.default.div.withConfig({displayName:"about__Wrapper",componentId:"sc-17crp4s-1"})(["@media (max-width:768px){padding:0 15px;}"]);var u=e=>{let{data:t}=e;const o=t.markdownRemark,m=t.allMarkdownRemark.totalCount;return s.useAbout?n.createElement(a.A,null,n.createElement(i.A,{title:s.title,description:s.description,url:s.siteUrl}),n.createElement(l.A,{size:48}),n.createElement(r.A,null),n.createElement(d.A,{postsCount:m,activeTab:"about"}),n.createElement(c.A,null,n.createElement(c.A.Body,{html:o.html,hideToc:!0}))):n.createElement(p.default,null)}}}]);
//# sourceMappingURL=component---src-pages-about-jsx-a57d568dcc07527d4368.js.map