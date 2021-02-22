'use strict';

const express = require('express');
require('dotenv').config();
const cors = require('cors');
const superagent = require('superagent');

const app = express();
const PORT = process.env.PORT || 3030;
app.use(cors());

//test my server
// request: carries all the parameters in the header
// response: data to send

app.get('/', handleHomeRoute);
app.get('/location', locationHandler);
app.get('/weather', weatherHandler);
app.get('/parks', parksHandler);
app.get('*', notFoundRouter);
app.get(errorHandler);



// handle any route
function handleHomeRoute(req, res) {
    res.status(200).send('you did a great job');
}

//request: localhost:3000/test
// server.get('/test', (req, res) => {
//     res.send('your server is working fine!!')
// })

// location route
// localhost:3000/location
function locationHandler(req, res) {
    const cityName = req.query.city;
    console.log(cityName);


    let key = process.env.LOCATION_KEY;
    console.log(key);
    let url = `https://us1.locationiq.com/v1/search.php?key=${key}&q=${cityName}&format=json`

    superagent.get(url)
        .then(locData => {
            const locationData = new Location(cityName, locData.body[0]);
            console.log(locData);
            res.send(locationData);
        })

        .catch(() => {
            errorHandler('error in getting data form loctioniq web site', req, res);
        })

}

function Location(city, geoData) {
    this.search_query = city;
    this.formatted_query = geoData.display_name;
    this.latitude = geoData.lat;
    this.longitude = geoData.lon;
}

function weatherHandler(req, res) {
    const cityName = req.query.search_query;

    // console.log(req.query) ;
    let key = process.env.WEATHER_API_KEY;
    let url = `https://api.weatherbit.io/v2.0/forecast/daily?city=${cityName}&key=${key}`

    superagent.get(url)
        .then(weaData => {
            // console.log(weaData.body);
            let weatherArr = weaData.body.data.map((val) => {
                return new Weather(val);
            });

            res.send(weatherArr);

        })
        .catch(() => {
            errorHandler('Error in getting data from weatherbit', req, res)
        })
}


function Weather(weaData) {
    this.weather = weaData.weather.description;
    this.time = weaData.datetime;
}

function parksHandler(req, res) {
    // const cityName = req.query.search_query  ; 

    let code = req.query.latitude + ',' + req.query.longitude;

    console.log(req.query);
    let key = process.env.PARKS_API_KEY;

    let url = `https://developer.nps.gov/api/v1/parks?parkCode=${code}&api_key=${key}`;


    superagent.get(url)
        .then(parksData => {
            // console.log(parksData.body);
            let parksArr = parksData.body.data.map((val) => {
                return new Parks(val);
            });

            res.send(parksArr);

        })
        .catch(() => {
            errorHandler('Error in getting data from nps website', req, res)
        })
}
function Parks(parkData) {
    this.name = parkData.fullName;
    this.address = `${parkData.addresses[0].line1} ${parkData.addresses[0].city} ${parkData.addresses[0].stateCode} ${parkData.addresses[0].postalCode}`;
    this.fee = '0.00';
    // this.fee = parkData.entranceFees[0].cost ; 
    this.discreption = parkData.description;
    this.url = parkData.url;

}



// localhost:3000/ssss
function notFoundRouter(req, res) {
    res.status(500).send('route not found');
}

function errorHandler(error, req, res) {
    res.status(500).send(error);
}

app.listen(PORT, () => {
    console.log(`Listening on PORT ${PORT}`);
})

