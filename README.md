# GAP (an acronym for Gaming Analytics ~~for~~ PUBG)

The main motivation for this project is to analyze the skill **gap** ~~ba dum
tss~~ between friends. In order to fulfill this, I've created a cool script
using Node.js to generate analytics from only those matches played together by
the informed squad.

### Screenshot

![](screenshot/gap.png?raw=true)

## Quick Start

```bash
# Clone repository
git clone https://github.com/v1nns/gap

# Enter dir
cd gap

# Install dependencies
npm install

# Before running script, there are two things to do before executing it:
# 1. must modify 'config.json' to insert PUBG API* key
# 2. replace 'const names' with the nickname of each player from your team
node index.js
```

**To get your own API key, it is necessary to create a developer account here:
https://developer.pubg.com/*

## Backlog

* Use PUBG API to get Season stats;
* Transform it into an architecture with Frontend + Backend.


## Considerations

Data based on PLAYERUNKNOWN’S BATTLEGROUNDS, PUBG Corp, Steam or Valve Corp.