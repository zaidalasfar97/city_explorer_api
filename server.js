'use strict';
//npm i express
const express = require('express');
//npm i dotenv
require('dotenv').config();

//npm i cors
//CORS: Cross Origin Resource Sharing
const cors = require('cors');


const server = express();
// make it opened
server.use(cors());

const PORT = process.env.PORT || 3030;
// 3000
// 3030
// Heroku port


//test my server
// request: carries all the parameters in the header
// response: data to send


// handle any route
server.get('/', (req, res) => {
    res.send('home route');
})

//request: localhost:3000/test
server.get('/test', (req, res) => {
    res.send('your server is working fine!!')
})

// location route
// localhost:3000/location
server.get('/location', (req, res) => {
    const locData = require('./data/location.json');
    console.log(locData);
    console.log(locData[0]);
    // res.send(locData);
    const locObj = new Location(locData);
    console.log(locObj)
    res.send(locObj);

})


function Location(geoData) {
    this.search_query = 'Lynnwood';
    this.formatted_query = geoData[0].display_name;
    this.latitude = geoData[0].lat;
    this.longitude = geoData[0].lon;
}

server.get('/weather', (req, res) => {
    const weatherData = require('./data/weather.json');
    const weatherArr = []
    weatherData.data.forEach(item => {
        const locObj = new Weather(item);
        console.log(weatherData);
        weatherArr.push(locObj);
    })

    res.send(weatherArr);
})


function Weather(weaData) {
    this.weather = weaData.weather.description;
    this.time = weaData.datetime;
}


// localhost:3000/ssss
server.use('*', (req, res) => {
    res.status(404).send('route not found')
})

server.listen(PORT, () => {
    console.log(`Listening on PORT ${PORT}`);
})

