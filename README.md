## Node.js module / client for the czech external trade statistics database

[![Build Status](https://travis-ci.org/todvora/extrade-cz-api.svg)](https://travis-ci.org/todvora/extrade-cz-api)
[![Coverage Status](https://coveralls.io/repos/todvora/extrade-cz-api/badge.svg)](https://coveralls.io/r/todvora/extrade-cz-api)

Parsing library (unofficial) for the following statistics database:

[https://apl.czso.cz/pll/stazo/STAZO.STAZO](https://apl.czso.cz/pll/stazo/STAZO.STAZO)

![Logo](https://apl.czso.cz/pll/stazo/ss?j=nove_logo_CS.png)

## Install

```
npm install -s extrade-cz-api
 ```
## API

Get the client object:

```javascript
var client = require('extrade-cz-api');
```

All the API methods return [Q promises](https://www.npmjs.com/package/q). You can simply handle all the possible states, as follows:

```javascript
client.getCountries()
   .then(function(result){
     console.log(Object.keys(result)); // prints all the country codes
   })
   .fail(function(ex) {
     console.log(ex); // prints to the error on the stdout
   })
   .fin(function() {
     console.log('done'); // will be called in both success and failure cases
   })
   .done(); // called to be sure, that we consumed all available states
```

### Get list of available countries
```javascript
client.getCountries();
```
Should return a object (map) *code:country_name*, for example:
```javascript
{ AD: 'Andorra',
  AE: 'Spojené arabské emiráty',
  AF: 'Afghánistán',
  AG: 'Antigua a Barbuda',
  AI: 'Anguilla',
  AL: 'Albánie',
  AM: 'Arménie',
  ....
```
Note: the names are provided in czech language.

### Get a list of available products
```javascript
client.getProducts();
```
Should return a object (map) *code:product_name*, for example:
```javascript
{ '10011100': 'Pšenice tvrdá k setí',
  '10011900': 'Pšenice tvrdá,ne:k setí',
  '10019110': 'Špalda k setí',
  '10019120': 'k setí běžné pšenice a sourži',
  '10019190': 'k setí pšenice,sourži,ne:pšenice tvrdá,špadla,obyčejná pšenice a sourž',
  '10019900': 'Pšenice špalda, ne k setí',
  '10021000': 'Žito k setí',
  ...
```
Note: the names are provided in czech language.

### Get last date
The statistics are not always up-to-date and there is some delay. Is it possible to obtain last available date of statistics by calling

```javascript
client.getLastDate();
```
Should return a object (map) in following format:

```javascript
{ month: '04', year: '2015' }
```


### Get statistics
```javascript
client.getStats({
   monthFrom : '04',
   yearFrom :  '2014',
   monthTill : '04',
   yearTill :  '2015',
   direction : 'd',
   products :  ['87120030', '87149110', '87149130'],
   countries : ['AT', 'DE', 'GB', 'US']
});
```
The ```direction``` param of the ```criteria``` has two possible values
- ```d``` means import
- ```v``` means export

The ```countries``` and ```products``` parameters can be obtained from the ```getXXX``` methods mentioned above.

Output is in the following format:

```javascript
{ period: { from: '1.4.2014', till: '30.4.2015' },
  direction: 'import',
  results:
   [ { code: '87120030',
       name: 'Jízdní kola, bez motoru (kromě bez kuličkových ložisek)',
       country: 'AT',
       countryName: 'Rakousko',
       weight: '28113',
       price: '19908',
       unit: 'PCE',
       count: '1900' },
     { code: '87120030',
       name: 'Jízdní kola, bez motoru (kromě bez kuličkových ložisek)',
       country: 'BD',
       countryName: 'Bangladéš',
       weight: '5127',
       price: '2185',
       unit: 'PCE',
       count: '556' },
       ....

```

## How it works
The library simply fills out the form on web page for you and parses results returned in the html table.

### Input form
![Form to be fillted out](form.png)
Form, to be filled out. Fields, that can be provided, are highlighted in green.

### Results page
![Form to be fillted out](result.png)
Result page, that is parsed in order to get JSON results.
