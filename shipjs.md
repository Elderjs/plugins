# How to get shipjs working
* You need to create a 'v0.0.0' tag and release.
* run `shipjs setup` ... follow the config options

# Overview

Here is a quick overview of how shipjs works in this project.

* Make changes
* Run `npm run prepare` this will merge in your commits to master??(not sure how this works on feat branches), create a release PR that can be merged.
* Review the PR and add details to change log.
* Run `shipjs trigger` this will deploy the npm packages... or since we have gh actions setup it will do it automatically. 
