'use strict';

const express = require('express');
require('dotenv').config();
const cors = require('cors');
const superagent = require('superagent');
const pg = require('pg');
// const client = new pg.Client(process.env.DATABASE_URL);
const client = new pg.Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });


const app = express();
const PORT = process.env.PORT || 3030;
app.use(cors());

//test my server
// request: carries all the parameters in the header
// response: data to send

app.get('/', handleHomeRoute);
app.get('/location', handlerLocation);
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
// function locationHandler(req, res) {
//     const cityName = req.query.city;
//     console.log(cityName);


//     let key = process.env.LOCATION_KEY;
//     console.log(key);
//     let url = `https://us1.locationiq.com/v1/search.php?key=${key}&q=${cityName}&format=json`

//     superagent.get(url)
//         .then(locData => {
//             const locationData = new Location(cityName, locData.body[0]);
//             console.log(locData);
//             res.send(locationData);
//         })

//         .catch(() => {
//             errorHandler('error in getting data form loctioniq web site', req, res);
//         })

// }
function handlerLocation(req, res) {
    let city = req.query.city;
    let key = process.env.LOCATION_KEY;
    let url = `https://eu1.locationiq.com/v1/search.php?key=${key}&q=${city}&format=json`;
    const SQL = 'SELECT * FROM locations WHERE search_query = $1';
    const safeData = [city];
    client.query(SQL, safeData)
        .then((result) => {
            if (result.rows.length > 0) {
                res.status(200).send(result.rows[0]);
                console.log('FROM DATABASE', result.rows[0]);
            } else {
                superagent(url)
                    .then((data) => {
                        console.log('FROM API');
                        const geoData = data.body;
                        const locationData = new Location(city, geoData);
                        const SQL = `INSERT INTO locations (search_query , formatted_query ,latitude, longitude) VALUES($1,$2,$3,$4) RETURNING *`;
                        const saveData = [
                            locationData.search_query,
                            locationData.formatted_query,
                            locationData.latitude,
                            locationData.longitude
                        ];
                        client.query(SQL, saveData).then((result) => {
                            // console.log(result.rows);
                            res.status(200).send(result.rows[0]);
                        })
                    })
            }
        })
        .catch((error) => errorHandler(error, req, res));
};

function Location(city, geoData) {
    this.search_query = city;
    this.formatted_query = geoData[0].display_name;
    this.latitude = geoData[0].lat;
    this.longitude = geoData[0].lon;
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
    this.forecast = weaData.weather.description;
    this.time = weaData.datetime;
}

function parksHandler(req, res) {
    // const cityName = req.query.search_query  ; 

    // let code = req.query.latitude + ',' + req.query.longitude;

    console.log(req.query);
    const city = req.query.search_query;
    let key = process.env.PARKS_API_KEY;


    let url = `https://developer.nps.gov/api/v1/parks?q=${city}&api_key=${key}`;


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
    this.fee = parkData.entranceFees[0].cost || '0.00';
    // this.fee = '0.00';
    this.description = parkData.description;
    this.url = parkData.url;
}



// localhost:3000/ssss
function notFoundRouter(req, res) {
    res.status(500).send('route not found');
}

function errorHandler(error, req, res) {
    res.status(500).send(error);
}
client.connect()
    .then(() => {
        app.listen(PORT, () =>
            console.log(`listening on ${PORT}`)
        );
    })
    .catch((error) => {
        res.send('cccccccccccc', error.message)
    })