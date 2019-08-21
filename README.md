
<h1 align="center">
  TimeCharts
  <br>
</h1>

<h4 align="center">A chart library to visualize time-related data.</h4>

<p align="center">
  <a href="#key-features">Key Features</a> •
  <a href="#how-to-use">How To Use</a> •
  <a href="#license">License</a>
</p>

![screenshot](https://raw.githubusercontent.com/RobinWeitzel/TimeCharts/master/readme/image2.PNG)

## Key Features

* No dependencies
* Fully responsive
* Easy to use

## How To Use

### Installation

#### Via NPM
Simply install the library:

```
npm i timecharts
```

#### In the Browser
Either use a CDN:

```html
<script src="https://unpkg.com/timecharts@latest/dist/TimeCharts.min.js" type="text/javascript"></script>
```

Or [download](https://github.com/RobinWeitzel/TimeCharts/releases/download/v1.0.11/TimeCharts.min.js) it locally:

```html
<script src="./TimeCharts.min.js" type="text/javascript"></script>
```

### Usage

```js
const chart = new TimeCharts.Timeline("#container", {
  scale: {
      from: 7 * 60,
      to: 19 * 60,
      intervalStart: 0
  },
  data: {
      timelines: [
          {
              label: "WORK",
              colors: ["#7cd6fd", "#5e64ff"],
              values: [{
                  start: 8 * 60,
                  length: 120,
                  title: "Project 1"
              },
              {
                  start: 11 * 60,
                  length: 45,
                  title: "Project 2"
              },
              {
                  start: 13 * 60,
                  length: 120,
                  title: "Project 1"
              }]
          },
          {
              label: "STUDY",
              colors: ["#98d85b"],
              values: [{
                  start: 10 * 60,
                  length: 60,
                  title: "Topic 1"
              },
              {
                  start: 15 * 60,
                  length: 90,
                  title: "Topic 1"
              },
              {
                  start: 16 * 60 + 45,
                  length: 90,
                  title: "Topic 1"
              }]
          }
      ],
  },  
  padding: {
      top: 50, 
      left: 50,
      right: 50
  }
});
```

### Documentation

The full documentation can be found [here](https://robinweitzel.github.io/TimeCharts/).

## License

MIT
