import{o as a}from"./chunk-4N6VE7H7-BLQoz5xV.js";import{B as l}from"./button-Cb1isq2w.js";import{u as f}from"./useAuth-DXSy-yQ2.js";import{u as g,c as B}from"./useAffiliates-BAqCYguv.js";import{u as s}from"./index-C4RBg5fy.js";import{L as x}from"./loader-circle-qCMDglHu.js";import{c as p}from"./createLucideIcon-DOEZ_bMU.js";/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const y=p("BookmarkCheck",[["path",{d:"m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2Z",key:"169p4p"}],["path",{d:"m9 10 2 2 4-4",key:"1gnqz4"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const j=p("Bookmark",[["path",{d:"m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z",key:"1fy3hk"}]]),w=({contentType:m,contentId:n,className:i,showText:c=!1})=>{const{user:t,isLoggedIn:k}=f(),{data:r,isLoading:u}=g((t==null?void 0:t.id)||""),d=B(),o=(r==null?void 0:r.some(e=>e.content_id===n&&e.content_type===m))||!1,h=async e=>{if(e.preventDefault(),e.stopPropagation(),!k){s.error("Please log in to bookmark content");return}try{await d.mutateAsync({user_id:t.id,content_type:m,content_id:n,isBookmarked:o}),s.success(o?"Removed from bookmarks":"Added to bookmarks")}catch{s.error("Failed to update bookmark")}};return u&&k?a.jsx(l,{variant:"ghost",size:"icon",disabled:!0,className:i,children:a.jsx(x,{className:"h-4 w-4 animate-spin"})}):a.jsxs(l,{variant:o?"secondary":"ghost",size:c?"default":"icon",className:`${o?"text-primary":"text-muted-foreground hover:text-primary"} ${i}`,onClick:h,disabled:d.isPending,children:[o?a.jsx(y,{className:"h-4 w-4"}):a.jsx(j,{className:"h-4 w-4"}),c&&a.jsx("span",{className:"ml-2",children:o?"Bookmarked":"Bookmark"})]})};export{j as B,w as a};
