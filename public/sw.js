if(!self.define){let e,s={};const a=(a,i)=>(a=new URL(a+".js",i).href,s[a]||new Promise((s=>{if("document"in self){const e=document.createElement("script");e.src=a,e.onload=s,document.head.appendChild(e)}else e=a,importScripts(a),s()})).then((()=>{let e=s[a];if(!e)throw new Error(`Module ${a} didn’t register its module`);return e})));self.define=(i,c)=>{const n=e||("document"in self?document.currentScript.src:"")||location.href;if(s[n])return;let t={};const r=e=>a(e,n),o={module:{uri:n},exports:t,require:r};s[n]=Promise.all(i.map((e=>o[e]||r(e)))).then((e=>(c(...e),t)))}}define(["./workbox-9b4d2a02"],(function(e){"use strict";importScripts(),self.skipWaiting(),e.clientsClaim(),e.precacheAndRoute([{url:"/_next/app-build-manifest.json",revision:"18df5890c498f293ec612705c131b6a8"},{url:"/_next/static/-HGzx_cK7viYgCH7WylNO/_buildManifest.js",revision:"d2412658a613585afb7ea2608e1b5916"},{url:"/_next/static/-HGzx_cK7viYgCH7WylNO/_ssgManifest.js",revision:"b6652df95db52feb4daf4eca35380933"},{url:"/_next/static/chunks/1172-6fa635d4ba219142.js",revision:"-HGzx_cK7viYgCH7WylNO"},{url:"/_next/static/chunks/13b76428-3a27edfd28c29f16.js",revision:"-HGzx_cK7viYgCH7WylNO"},{url:"/_next/static/chunks/140-0ef6f4bce2ead6e5.js",revision:"-HGzx_cK7viYgCH7WylNO"},{url:"/_next/static/chunks/20-f4fe0d91b60a6b06.js",revision:"-HGzx_cK7viYgCH7WylNO"},{url:"/_next/static/chunks/210-1ace67500e0574d9.js",revision:"-HGzx_cK7viYgCH7WylNO"},{url:"/_next/static/chunks/2315-c0b49407e699de1e.js",revision:"-HGzx_cK7viYgCH7WylNO"},{url:"/_next/static/chunks/2355-1bf5d25680f416aa.js",revision:"-HGzx_cK7viYgCH7WylNO"},{url:"/_next/static/chunks/2536-a533303517ccb76b.js",revision:"-HGzx_cK7viYgCH7WylNO"},{url:"/_next/static/chunks/2763-a1febe40f86a3509.js",revision:"-HGzx_cK7viYgCH7WylNO"},{url:"/_next/static/chunks/2793-300c3afe2fbe36c0.js",revision:"-HGzx_cK7viYgCH7WylNO"},{url:"/_next/static/chunks/3aba9d11-f088ea721efdb495.js",revision:"-HGzx_cK7viYgCH7WylNO"},{url:"/_next/static/chunks/4218-68f36d262194bd0b.js",revision:"-HGzx_cK7viYgCH7WylNO"},{url:"/_next/static/chunks/4351-3b599832ff5e4a8d.js",revision:"-HGzx_cK7viYgCH7WylNO"},{url:"/_next/static/chunks/4638-c2c87d40a7431efc.js",revision:"-HGzx_cK7viYgCH7WylNO"},{url:"/_next/static/chunks/52271efe-1246535f067d990c.js",revision:"-HGzx_cK7viYgCH7WylNO"},{url:"/_next/static/chunks/6107-989d876e8f5c37a7.js",revision:"-HGzx_cK7viYgCH7WylNO"},{url:"/_next/static/chunks/62c88095-d6f38dd65f2fe347.js",revision:"-HGzx_cK7viYgCH7WylNO"},{url:"/_next/static/chunks/6861-e63904b163d38875.js",revision:"-HGzx_cK7viYgCH7WylNO"},{url:"/_next/static/chunks/7023-46269df5627bf76c.js",revision:"-HGzx_cK7viYgCH7WylNO"},{url:"/_next/static/chunks/7177-815bcdf666b579f0.js",revision:"-HGzx_cK7viYgCH7WylNO"},{url:"/_next/static/chunks/7497-f53bb153b74a7f56.js",revision:"-HGzx_cK7viYgCH7WylNO"},{url:"/_next/static/chunks/77befd7b-fe3783b26f236ca4.js",revision:"-HGzx_cK7viYgCH7WylNO"},{url:"/_next/static/chunks/8210-5f471b99a034197a.js",revision:"-HGzx_cK7viYgCH7WylNO"},{url:"/_next/static/chunks/8470-f1afa765cb3360de.js",revision:"-HGzx_cK7viYgCH7WylNO"},{url:"/_next/static/chunks/964-87dd0cb2aa692199.js",revision:"-HGzx_cK7viYgCH7WylNO"},{url:"/_next/static/chunks/9691.14c502a3524d7148.js",revision:"14c502a3524d7148"},{url:"/_next/static/chunks/9706-257cfb41f9cfc2c4.js",revision:"-HGzx_cK7viYgCH7WylNO"},{url:"/_next/static/chunks/9950-5a130dd5358d6d99.js",revision:"-HGzx_cK7viYgCH7WylNO"},{url:"/_next/static/chunks/aaea2bcf-0636c7544f3f93b2.js",revision:"-HGzx_cK7viYgCH7WylNO"},{url:"/_next/static/chunks/app/%5B...slugs%5D/page-6cec89059cfbe1ed.js",revision:"-HGzx_cK7viYgCH7WylNO"},{url:"/_next/static/chunks/app/(staticPages)/about/page-685487389ccac0a4.js",revision:"-HGzx_cK7viYgCH7WylNO"},{url:"/_next/static/chunks/app/(staticPages)/contributors/page-8fe6da2ebb35db05.js",revision:"-HGzx_cK7viYgCH7WylNO"},{url:"/_next/static/chunks/app/(staticPages)/faq/page-b4addf4bd458b632.js",revision:"-HGzx_cK7viYgCH7WylNO"},{url:"/_next/static/chunks/app/(staticPages)/guest-post/page-e21b77d0386f5402.js",revision:"-HGzx_cK7viYgCH7WylNO"},{url:"/_next/static/chunks/app/(staticPages)/privacy-policy/page-d54c19c49ce9abf2.js",revision:"-HGzx_cK7viYgCH7WylNO"},{url:"/_next/static/chunks/app/(staticPages)/terms-of-service/page-33accf6d37613c26.js",revision:"-HGzx_cK7viYgCH7WylNO"},{url:"/_next/static/chunks/app/(staticPages)/whitepaper/page-840a50dd1067d892.js",revision:"-HGzx_cK7viYgCH7WylNO"},{url:"/_next/static/chunks/app/_not-found/page-87a42e0a62a94f4f.js",revision:"-HGzx_cK7viYgCH7WylNO"},{url:"/_next/static/chunks/app/auth/page-e6b0078a5e209d7e.js",revision:"-HGzx_cK7viYgCH7WylNO"},{url:"/_next/static/chunks/app/chats/%5B...params%5D/page-98ec5a2b93f34b09.js",revision:"-HGzx_cK7viYgCH7WylNO"},{url:"/_next/static/chunks/app/chats/page-5a3483e53930935a.js",revision:"-HGzx_cK7viYgCH7WylNO"},{url:"/_next/static/chunks/app/communities/create-hs/page-d276c97411f15ddc.js",revision:"-HGzx_cK7viYgCH7WylNO"},{url:"/_next/static/chunks/app/communities/create/page-75872cb239addd8e.js",revision:"-HGzx_cK7viYgCH7WylNO"},{url:"/_next/static/chunks/app/communities/layout-699bddd7c1b057ff.js",revision:"-HGzx_cK7viYgCH7WylNO"},{url:"/_next/static/chunks/app/communities/loading-c181245d6749a122.js",revision:"-HGzx_cK7viYgCH7WylNO"},{url:"/_next/static/chunks/app/communities/page-6ae75e2af71c7eba.js",revision:"-HGzx_cK7viYgCH7WylNO"},{url:"/_next/static/chunks/app/contribute/page-f67368908b334781.js",revision:"-HGzx_cK7viYgCH7WylNO"},{url:"/_next/static/chunks/app/decks/page-da953dadabebdba4.js",revision:"-HGzx_cK7viYgCH7WylNO"},{url:"/_next/static/chunks/app/discover/layout-567fc94b563ff3e1.js",revision:"-HGzx_cK7viYgCH7WylNO"},{url:"/_next/static/chunks/app/discover/loading-51d598877fc97e4e.js",revision:"-HGzx_cK7viYgCH7WylNO"},{url:"/_next/static/chunks/app/discover/page-4a03f22a34dbd636.js",revision:"-HGzx_cK7viYgCH7WylNO"},{url:"/_next/static/chunks/app/draft/%5Bid%5D/page-5b6e9a8b7844533a.js",revision:"-HGzx_cK7viYgCH7WylNO"},{url:"/_next/static/chunks/app/layout-8b1d83b27660a3bd.js",revision:"-HGzx_cK7viYgCH7WylNO"},{url:"/_next/static/chunks/app/market/advanced/page-2203ef4515845c26.js",revision:"-HGzx_cK7viYgCH7WylNO"},{url:"/_next/static/chunks/app/market/limit/page-589811b37df70d1d.js",revision:"-HGzx_cK7viYgCH7WylNO"},{url:"/_next/static/chunks/app/market/page-42239778a9c6cc06.js",revision:"-HGzx_cK7viYgCH7WylNO"},{url:"/_next/static/chunks/app/market/swap/page-5ccc784c671c0f04.js",revision:"-HGzx_cK7viYgCH7WylNO"},{url:"/_next/static/chunks/app/not-found-6e3c1c3ca3c07052.js",revision:"-HGzx_cK7viYgCH7WylNO"},{url:"/_next/static/chunks/app/onboard-friend/%5B...slugs%5D/page-b6de48a7473cfd37.js",revision:"-HGzx_cK7viYgCH7WylNO"},{url:"/_next/static/chunks/app/page-e7f978be6e08e265.js",revision:"-HGzx_cK7viYgCH7WylNO"},{url:"/_next/static/chunks/app/perks/page-20018ef11aee5801.js",revision:"-HGzx_cK7viYgCH7WylNO"},{url:"/_next/static/chunks/app/proposals/%5Bid%5D/page-3d938a8c9fbc44ff.js",revision:"-HGzx_cK7viYgCH7WylNO"},{url:"/_next/static/chunks/app/proposals/page-e6043dc1eb0df232.js",revision:"-HGzx_cK7viYgCH7WylNO"},{url:"/_next/static/chunks/app/purchase/page-5fd977fc1c77fed9.js",revision:"-HGzx_cK7viYgCH7WylNO"},{url:"/_next/static/chunks/app/search/page-be294eac4c518812.js",revision:"-HGzx_cK7viYgCH7WylNO"},{url:"/_next/static/chunks/app/signup/page-f23b962f0180d107.js",revision:"-HGzx_cK7viYgCH7WylNO"},{url:"/_next/static/chunks/app/submit/page-be4d74f0804cdda8.js",revision:"-HGzx_cK7viYgCH7WylNO"},{url:"/_next/static/chunks/app/witnesses/page-7fd997de4dfec3e6.js",revision:"-HGzx_cK7viYgCH7WylNO"},{url:"/_next/static/chunks/c0e397d0-d86ae2426f017668.js",revision:"-HGzx_cK7viYgCH7WylNO"},{url:"/_next/static/chunks/eeac573e-fe0a55ceeef5ebdf.js",revision:"-HGzx_cK7viYgCH7WylNO"},{url:"/_next/static/chunks/fd9d1056-98dfef589c2ee860.js",revision:"-HGzx_cK7viYgCH7WylNO"},{url:"/_next/static/chunks/framework-0af805db6f0c0b82.js",revision:"-HGzx_cK7viYgCH7WylNO"},{url:"/_next/static/chunks/main-8926b8a01066d44e.js",revision:"-HGzx_cK7viYgCH7WylNO"},{url:"/_next/static/chunks/main-app-f2463f3514d5e713.js",revision:"-HGzx_cK7viYgCH7WylNO"},{url:"/_next/static/chunks/pages/_app-f870474a17b7f2fd.js",revision:"-HGzx_cK7viYgCH7WylNO"},{url:"/_next/static/chunks/pages/_error-c66a4e8afc46f17b.js",revision:"-HGzx_cK7viYgCH7WylNO"},{url:"/_next/static/chunks/polyfills-78c92fac7aa8fdd8.js",revision:"79330112775102f91e1010318bae2bd3"},{url:"/_next/static/chunks/public/assets/notification.7cf94838874c04af.mp3",revision:"7cf94838874c04af"},{url:"/_next/static/chunks/webpack-09e4da5ab0226e61.js",revision:"-HGzx_cK7viYgCH7WylNO"},{url:"/_next/static/css/0e316016ae6ca244.css",revision:"0e316016ae6ca244"},{url:"/_next/static/css/1d5d4ebc1cd30c53.css",revision:"1d5d4ebc1cd30c53"},{url:"/_next/static/css/299d776a4aa8641f.css",revision:"299d776a4aa8641f"},{url:"/_next/static/css/2ceade599589d2b8.css",revision:"2ceade599589d2b8"},{url:"/_next/static/css/4c219b8c84cc5e5a.css",revision:"4c219b8c84cc5e5a"},{url:"/_next/static/css/513be94db61781f1.css",revision:"513be94db61781f1"},{url:"/_next/static/css/551656fb847f38d0.css",revision:"551656fb847f38d0"},{url:"/_next/static/css/651733de5938119d.css",revision:"651733de5938119d"},{url:"/_next/static/css/75a5c09387da9bea.css",revision:"75a5c09387da9bea"},{url:"/_next/static/css/7909d0565a6899cf.css",revision:"7909d0565a6899cf"},{url:"/_next/static/css/80594a425fa78f01.css",revision:"80594a425fa78f01"},{url:"/_next/static/css/865f7ab4ef834569.css",revision:"865f7ab4ef834569"},{url:"/_next/static/css/97e918a903ab54c0.css",revision:"97e918a903ab54c0"},{url:"/_next/static/css/c69ae03a9f10c92f.css",revision:"c69ae03a9f10c92f"},{url:"/_next/static/css/ce623685369f6d01.css",revision:"ce623685369f6d01"},{url:"/_next/static/css/e62cdbc508f48afc.css",revision:"e62cdbc508f48afc"},{url:"/_next/static/css/ec4522ef7880f964.css",revision:"ec4522ef7880f964"},{url:"/_next/static/css/fe6943005e1bbbfe.css",revision:"fe6943005e1bbbfe"},{url:"/_next/static/media/arrow1-about.656281e6.png",revision:"656281e6"},{url:"/_next/static/media/arrow2-about.1b039bcc.png",revision:"1b039bcc"},{url:"/_next/static/media/arrow3-about.70f825ed.png",revision:"70f825ed"},{url:"/_next/static/media/back-clouds-down.4d526728.png",revision:"4d526728"},{url:"/_next/static/media/back-clouds-up.23f147d4.png",revision:"23f147d4"},{url:"/_next/static/media/cloud1-about.2cdc493a.png",revision:"2cdc493a"},{url:"/_next/static/media/cloud2-about.32fd33bd.png",revision:"32fd33bd"},{url:"/_next/static/media/fallback.d0906556.png",revision:"8713aeba6805ef460b16fa081edd1887"},{url:"/_next/static/media/index-bg.6a2f476b.png",revision:"6a2f476b"},{url:"/_next/static/media/logo-circle.9f6f8f1c.svg",revision:"2df6f251431f9f36e1815e5b90ce1f8a"},{url:"/_next/static/media/noimage.7dc5d3ff.svg",revision:"68711d71516a091f18169b2882dc6035"},{url:"/_next/static/media/noimage.f7ce9bd0.png",revision:"f7ce9bd0"},{url:"/_next/static/media/thumbnail-play.348281a6.jpg",revision:"99d63c99267bf2e74e95d92bfb00a0ea"},{url:"/assets/arrow1-about.png",revision:"4340c5b200d5d51631f944aad1ee2b5e"},{url:"/assets/arrow2-about.png",revision:"a73b3fcfc161b35e762e52e1810612f9"},{url:"/assets/arrow3-about.png",revision:"6c58e88a02000b98b2f500275e173068"},{url:"/assets/back-clouds-down.png",revision:"12a7304745da678d47a0072132c810c1"},{url:"/assets/back-clouds-up.png",revision:"e56f90fa70a1fe82aebb5f997b823f28"},{url:"/assets/bg-download-mob-dark.png",revision:"8c9a7504cdb60835ef0d39b0f448571d"},{url:"/assets/bg-download-mob-dark.webp",revision:"6a8c212f5d2cb66f259a4a8aa3af3311"},{url:"/assets/bg-download-mob-light.png",revision:"d92057b43d7e4217175d35b944141645"},{url:"/assets/bg-download-mob-light.webp",revision:"a225c5595468ab97f62a03246753cce6"},{url:"/assets/bg-download-tiny-dark.svg",revision:"4dfcf8aaeeb8a52d21bb3525d541ed5b"},{url:"/assets/bg-download-tiny.webp",revision:"a0a4bfab2ddbad09183baf2afe07a616"},{url:"/assets/bubble-center.png",revision:"5606f7307c513e99f36699e10f23ccf9"},{url:"/assets/bubble-center.webp",revision:"ef695adcbbd8936ed59f350682e61397"},{url:"/assets/bubble-left-bottom.png",revision:"df2d82a18a6135cf028abbf11781da69"},{url:"/assets/bubble-left-bottom.webp",revision:"ed0725bf3ac081532ad28a113a25bb0e"},{url:"/assets/bubble-left-top.png",revision:"5485d77a530a6f998e1e0c95cc58d223"},{url:"/assets/bubble-left-top.webp",revision:"cf1c941f7f1bde7958ebc663e7dd2f14"},{url:"/assets/bubble-right-bottom.png",revision:"c34007e9b2e094b58d0ad9f149efe7a6"},{url:"/assets/bubble-right-bottom.webp",revision:"c2189eac8ac13d5a006194e4171148b4"},{url:"/assets/bubble-right-top.png",revision:"6401d7510d2dda133da4f77b8e5857c3"},{url:"/assets/bubble-right-top.webp",revision:"06037b88ba36932c52d5484a2db3c735"},{url:"/assets/cloud1-about.png",revision:"d66dc0e33618136110dc0a851f98f4cc"},{url:"/assets/cloud1.png",revision:"28c7c7b997fb3662e2d21549b32b2972"},{url:"/assets/cloud2-about.png",revision:"8774eb6432d37ac1ecf7deaea117e1a5"},{url:"/assets/cloud2.png",revision:"a66f13dbef7a3324ab1d105991295e00"},{url:"/assets/cloud3.png",revision:"8889d6546ce489ca120d960479fc04d1"},{url:"/assets/coming-soon.png",revision:"ef24f5a15258aaa3846af7089935bf0a"},{url:"/assets/community-img.svg",revision:"3fd1e229d9517bb74c4e4903d9109ded"},{url:"/assets/cover-fallback-day.png",revision:"595641ae8f1d3b74ee12ee0b8878a520"},{url:"/assets/cover-fallback-night.png",revision:"bb6096d6a3e471fa7a8f869562d340db"},{url:"/assets/download-algae-dark.png",revision:"8c70504a94da6e93f4ac1b27046eb939"},{url:"/assets/download-algae-dark.webp",revision:"89a79f1000ca9995a6e14cfc60fd42a9"},{url:"/assets/download-algae.png",revision:"2490f946a17ba1abe4456f0f31d850a3"},{url:"/assets/download-algae.webp",revision:"1d97c2b64cfd934481e18c49ec8e8722"},{url:"/assets/download-dark-fishes.png",revision:"537442c023e388e9e33a93c821094381"},{url:"/assets/download-dark-fishes.webp",revision:"a36ea49d16f9c4b1e2833c2f6bbc618f"},{url:"/assets/dunsky.jpeg",revision:"6af464219667bd1b7a8b05a3a3133cf4"},{url:"/assets/dunsky.webp",revision:"abb98406fd78ae7cbf1ccf61e6b0a8f2"},{url:"/assets/ecency-faq.jpg",revision:"e2d5d30d0cb4a5fc5e470c56d62ede97"},{url:"/assets/ecency-faq.webp",revision:"42faa678c7ef5854f9ed0c999f6ef7eb"},{url:"/assets/fallback.png",revision:"8713aeba6805ef460b16fa081edd1887"},{url:"/assets/fish-1.png",revision:"4386e9af02b5f60f75caa040eced9a65"},{url:"/assets/fish-1.webp",revision:"8f0eb1179c74579084353e5df5b2a74f"},{url:"/assets/fish-2.png",revision:"92ce36fc40b95aeb3475d081bba0d798"},{url:"/assets/fish-2.webp",revision:"fe0c99a9f185d8b2e94bd249e625cf27"},{url:"/assets/fish-3.png",revision:"89c59580c072f1dbf52ac03068f040f3"},{url:"/assets/fish-3.webp",revision:"b9c3a3cc1cd0329d74ddb62d3a4e4b43"},{url:"/assets/fish-4.png",revision:"b91622c6328bbba13847519e0356db62"},{url:"/assets/fish-4.webp",revision:"a404c3ef59a9581554c06188ee262419"},{url:"/assets/fish-5.png",revision:"b271e3992390713707dc08f01691fb52"},{url:"/assets/fish-5.webp",revision:"abb4e590246f17bd00a21f7b414872d3"},{url:"/assets/fish-junior.png",revision:"78924f1ba81f1f59dd9a144be923edb1"},{url:"/assets/fish-junior.webp",revision:"bcae2a76d249cad55891d24e41e73b0c"},{url:"/assets/fish-senior.png",revision:"f3327a9c9d166c9da097fcfe88f38ed3"},{url:"/assets/fish-senior.webp",revision:"c70cf25bd04d52decb151396c900dcb3"},{url:"/assets/footer-discord.svg",revision:"04238f73e8da0be200731a4cc285d00e"},{url:"/assets/footer-main-fish.png",revision:"ba3d7c5371e84bdf30f6dee4d086a156"},{url:"/assets/footer-main-fish.webp",revision:"ac45436a3109caf9f94a2cd00f681783"},{url:"/assets/footer-telegram.svg",revision:"796b996dc8082544484feb13a97aa014"},{url:"/assets/footer-twitter.svg",revision:"c44b68c3cdee7732ce516bc250f6f27c"},{url:"/assets/footer-youtube.svg",revision:"6f91ba3c2f20618d27c15bff5352aba6"},{url:"/assets/github-cover.png",revision:"5eaca17c4b526f9b352a87a5a82dbfe4"},{url:"/assets/good-karma.jpeg",revision:"a7bb11629694bd7f9bd2b16bf058bb6b"},{url:"/assets/good-karma.webp",revision:"9a449b33cf032238499916c25584f58d"},{url:"/assets/hero-algae-dark.svg",revision:"eaa27188f9a588164e731b9f4a8f8295"},{url:"/assets/hero-algae-light.svg",revision:"4efcd71e3e8f8574446eeaa7a7517e33"},{url:"/assets/hero-fishes-dark.png",revision:"f8d8e17b68e2ff1490202f8503d24770"},{url:"/assets/hero-fishes.svg",revision:"a6307454b1e0fc4bcb6d402c33a63c7f"},{url:"/assets/hive-signer.svg",revision:"579ae88263a03ea7c8c4a9ec4e8b67f7"},{url:"/assets/icon-android-white.svg",revision:"f7df8d801059a45a14d1e90864157b1f"},{url:"/assets/icon-android.png",revision:"606b1396c3fffa5dc0f1d074695fab49"},{url:"/assets/icon-android.webp",revision:"c6bd14c9917803f8f69c4557be95ad9e"},{url:"/assets/icon-apple-white.svg",revision:"e4de9f34c14e50ed4fd12847091c16d2"},{url:"/assets/icon-apple.svg",revision:"a27b1b4829e566dca6d38f7c2e6d6ba5"},{url:"/assets/icon-windows-white.svg",revision:"4553dd690e4675fc4fb2132732b1c43b"},{url:"/assets/icon-windows.svg",revision:"80669c801739c850306618a2569b423c"},{url:"/assets/illustration-decentralization.png",revision:"0ad91ae4e70f22e8be87345e73144cb3"},{url:"/assets/illustration-decentralization.webp",revision:"ed3442432df26760623ec58c715fdf43"},{url:"/assets/illustration-earn-money.png",revision:"e2a7951254764e3dabac0697d089a3c2"},{url:"/assets/illustration-earn-money.webp",revision:"58605a59b4c1f6321ef90d5ef21eac24"},{url:"/assets/illustration-hero-day.png",revision:"ca7c9fd189caa73616664823e45b737d"},{url:"/assets/illustration-hero-day.webp",revision:"66c0bb6d0864af304a4e1801c967c526"},{url:"/assets/illustration-hero.png",revision:"9e2e1a46dc78fb0635c054fcf2d27b67"},{url:"/assets/illustration-hero.webp",revision:"75c6cdf85d150e6512fd2b3d0e20e332"},{url:"/assets/illustration-open-source.png",revision:"6f20524696843277aca578db00f29e14"},{url:"/assets/illustration-open-source.webp",revision:"79bf861b3c83c7de1ac96d8a35c4827d"},{url:"/assets/illustration-true-ownership.png",revision:"005b4f456f8d341de75c8c7cb25d750c"},{url:"/assets/illustration-true-ownership.webp",revision:"a2819f44d481e3203270877dc89cf87c"},{url:"/assets/index-bg.png",revision:"0931098d955341c1458c653ef42c5bec"},{url:"/assets/keychain.png",revision:"b4a1776481ec1bce0cdcb654126ee449"},{url:"/assets/left-fishes.png",revision:"c98d0bac15e561c7e4ce226541f5ab1e"},{url:"/assets/left-fishes.webp",revision:"7e5f5cee88eafa722b9b2eadbede120d"},{url:"/assets/like.png",revision:"af5f38b521e1c06eece664d5a3f24cdd"},{url:"/assets/logo-192x192.svg",revision:"09f9b1ec26a43fedaf3c527d9992ea3b"},{url:"/assets/logo-384x384.svg",revision:"c33b1a087528562650bdc7f9bb1889b3"},{url:"/assets/logo-512x512.svg",revision:"e0eb6d6416139753e199cf627599ac40"},{url:"/assets/logo-circle-santa.svg",revision:"a08e76920a86e2749d74345d86797cc5"},{url:"/assets/logo-circle.svg",revision:"2df6f251431f9f36e1815e5b90ce1f8a"},{url:"/assets/logo-small-transparent.png",revision:"197b6e7934149c67237a38f145dfb860"},{url:"/assets/noimage.png",revision:"66290b70590324b996aa6c841a4f6bf1"},{url:"/assets/noimage.svg",revision:"68711d71516a091f18169b2882dc6035"},{url:"/assets/notification.mp3",revision:"594e6e429f66513a2bc759fce6c1abc7"},{url:"/assets/nsfw.png",revision:"2e103d3e107e2974025b441b5fde485a"},{url:"/assets/our-history.png",revision:"730ae7e9850b787ea78d6151391ca463"},{url:"/assets/our-history.webp",revision:"f781b93801170a83acde5cf23bf538f4"},{url:"/assets/our-team.png",revision:"dc4a40a5f543e793462caf5c19d89f2f"},{url:"/assets/our-team.webp",revision:"ca3d13a54a5ba9e7e7df7af748c3a23a"},{url:"/assets/our-vision.png",revision:"acb541b415884dfce4b061ad21ce1b06"},{url:"/assets/our-vision.webp",revision:"bfe56f6816dade138c59010d69a8f83f"},{url:"/assets/phone-dark-pc.png",revision:"ba94fb9341a0303a8f6068ade064b0cb"},{url:"/assets/phone-dark-pc.webp",revision:"beef47eb0f0d9e6708e172b2138c48ab"},{url:"/assets/phone-dark-tablet.png",revision:"2358c7d62d813d3422a5af8bebb2be2e"},{url:"/assets/phone-dark-tablet.webp",revision:"c42d66f8c5c1999a648e6bb6a1a81227"},{url:"/assets/phone-download-tiny.png",revision:"0247b2bb16c64d46e4d8a73f60f4d501"},{url:"/assets/phone-download-tiny.webp",revision:"7120bd905eb5e5acbc866bd42058ba4c"},{url:"/assets/phone-download.png",revision:"54650a95d8ce20a2e03b68f0d6389201"},{url:"/assets/phone-light-pc.png",revision:"7bbef75c3da1d2a8e742b484292e6379"},{url:"/assets/phone-light-pc.webp",revision:"4a5839bf3499ef6687f1a798c683d7a1"},{url:"/assets/phone-light-tablet.png",revision:"49724acf6a25fedcd914ce0125517b8a"},{url:"/assets/phone-light-tablet.webp",revision:"7f448063c46119c5a7f0880f01b1814d"},{url:"/assets/reward.png",revision:"0faea76d5486dc7f637486da769fdad8"},{url:"/assets/rewarding-and-freespeech.png",revision:"ca1fc97612079d93de24bfb3ab6e0ea9"},{url:"/assets/rewarding-and-freespeech.svg",revision:"2df6f251431f9f36e1815e5b90ce1f8a"},{url:"/assets/signup.png",revision:"1ceacafe5770ed4f53829de572c9d219"},{url:"/assets/svg.tsx",revision:"2f1d7fbc25f8166e5b49e8997a803842"},{url:"/assets/talhasch.jpeg",revision:"9abb1df5ddbfd25e7fd72b0a4e202eff"},{url:"/assets/talhasch.webp",revision:"6e7e49e9ba1da71ecf46f0bb17c986c3"},{url:"/assets/thumbnail-play.jpg",revision:"99d63c99267bf2e74e95d92bfb00a0ea"},{url:"/assets/writer-thinking.png",revision:"03deb40c2a35de193e78c0e0d3d72a0e"},{url:"/assets/writer.png",revision:"00feab482a3f5309cce64ce9ca64041a"},{url:"/firebase-messaging-sw.js",revision:"db67bd2ec72e44b813ccabeb1ebb113f"},{url:"/manifest.json",revision:"3547aead3cd7bbd2b2ab3b7e23355d84"},{url:"/next.svg",revision:"8e061864f388b47f33a1c3780831193e"},{url:"/vercel.svg",revision:"61c6b19abff40ea7acd577be818f3976"}],{ignoreURLParametersMatching:[]}),e.cleanupOutdatedCaches(),e.registerRoute("/",new e.NetworkFirst({cacheName:"start-url",plugins:[{cacheWillUpdate:async({request:e,response:s,event:a,state:i})=>s&&"opaqueredirect"===s.type?new Response(s.body,{status:200,statusText:"OK",headers:s.headers}):s}]}),"GET"),e.registerRoute(/^https:\/\/fonts\.(?:gstatic)\.com\/.*/i,new e.CacheFirst({cacheName:"google-fonts-webfonts",plugins:[new e.ExpirationPlugin({maxEntries:4,maxAgeSeconds:31536e3})]}),"GET"),e.registerRoute(/^https:\/\/fonts\.(?:googleapis)\.com\/.*/i,new e.StaleWhileRevalidate({cacheName:"google-fonts-stylesheets",plugins:[new e.ExpirationPlugin({maxEntries:4,maxAgeSeconds:604800})]}),"GET"),e.registerRoute(/\.(?:eot|otf|ttc|ttf|woff|woff2|font.css)$/i,new e.StaleWhileRevalidate({cacheName:"static-font-assets",plugins:[new e.ExpirationPlugin({maxEntries:4,maxAgeSeconds:604800})]}),"GET"),e.registerRoute(/\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,new e.StaleWhileRevalidate({cacheName:"static-image-assets",plugins:[new e.ExpirationPlugin({maxEntries:64,maxAgeSeconds:86400})]}),"GET"),e.registerRoute(/\/_next\/image\?url=.+$/i,new e.StaleWhileRevalidate({cacheName:"next-image",plugins:[new e.ExpirationPlugin({maxEntries:64,maxAgeSeconds:86400})]}),"GET"),e.registerRoute(/\.(?:mp3|wav|ogg)$/i,new e.CacheFirst({cacheName:"static-audio-assets",plugins:[new e.RangeRequestsPlugin,new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400})]}),"GET"),e.registerRoute(/\.(?:mp4)$/i,new e.CacheFirst({cacheName:"static-video-assets",plugins:[new e.RangeRequestsPlugin,new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400})]}),"GET"),e.registerRoute(/\.(?:js)$/i,new e.StaleWhileRevalidate({cacheName:"static-js-assets",plugins:[new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400})]}),"GET"),e.registerRoute(/\.(?:css|less)$/i,new e.StaleWhileRevalidate({cacheName:"static-style-assets",plugins:[new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400})]}),"GET"),e.registerRoute(/\/_next\/data\/.+\/.+\.json$/i,new e.StaleWhileRevalidate({cacheName:"next-data",plugins:[new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400})]}),"GET"),e.registerRoute(/\.(?:json|xml|csv)$/i,new e.NetworkFirst({cacheName:"static-data-assets",plugins:[new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400})]}),"GET"),e.registerRoute((({url:e})=>{if(!(self.origin===e.origin))return!1;const s=e.pathname;return!s.startsWith("/api/auth/")&&!!s.startsWith("/api/")}),new e.NetworkFirst({cacheName:"apis",networkTimeoutSeconds:10,plugins:[new e.ExpirationPlugin({maxEntries:16,maxAgeSeconds:86400})]}),"GET"),e.registerRoute((({url:e})=>{if(!(self.origin===e.origin))return!1;return!e.pathname.startsWith("/api/")}),new e.NetworkFirst({cacheName:"others",networkTimeoutSeconds:10,plugins:[new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400})]}),"GET"),e.registerRoute((({url:e})=>!(self.origin===e.origin)),new e.NetworkFirst({cacheName:"cross-origin",networkTimeoutSeconds:10,plugins:[new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:3600})]}),"GET")}));
