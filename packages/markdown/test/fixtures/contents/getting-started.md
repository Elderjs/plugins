---
title: 'Getting Started with Elder.js'
excerpt: 'You have the starter template of Elder.js running. So what is next? This guide will help you explore the project.'
date: '2020-03-16T05:35:07.322Z'
author: Nick Reese
---

Sweet! So you've got the Elder.js starter template up and running. What's next?

![dummy-image](/images/dummy_image.png)

## 4 Routes To Explore

This project is structured to follow the required Elder.js folder structure which you can see below, but in short you've got several routes in the `./src/routes/` folder.

```javascript
{
 hook: 'data',
 name: 'maliciousHook',
 description: 'Can we break anything?',
 priority: 1, // this will be called last
 run: async ({ helpers, data, settings, request, query }) => {
   settings = null;
   request = null;
   helpers = null;
   query = null;

   return { settings, request, query, helpers }
 },
},
```