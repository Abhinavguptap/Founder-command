self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
// No fetch handler: never cache private dashboard pages or API responses.
self.addEventListener('push',event=>{
 event.waitUntil(self.registration.showNotification('Founder Command',{
  body:'You have a workspace update. Open Founder Command to see the details.',
  icon:'/notification-icon.png',badge:'/notification-icon.png',
  tag:'founder-workspace-update',silent:false,data:{url:'/'}
 }));
});
self.addEventListener('notificationclick',event=>{
 event.notification.close();
 event.waitUntil((async()=>{
  const windows=await self.clients.matchAll({type:'window',includeUncontrolled:true});
  const existing=windows.find(w=>new URL(w.url).origin===self.location.origin);
  if(existing)return existing.focus();
  return self.clients.openWindow('/');
 })());
});
