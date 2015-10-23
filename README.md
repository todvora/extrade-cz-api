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

### Get units
Product's field ```count``` can be defined in several different unit types. Typically pieces, kilograms or megawatt-hour. All known units can be returned by calling

```javascript
client.getUnits()
```
The call should return a object (map) *unit_code:unit_name*, for example:
```javascript
{ CTM: 'Karát',
  GRM: 'Gram',
  HLT: 'Hektolitr',
  KGN: 'Kilogram čisté váhy',
  LPA: 'Litr čistého alkoholu',
  LTR: 'Litr',
  MTK: 'Čtvereční metr',
  MTQ: 'Krychlový metr',
  MTR: 'Metr',
  MWH: 'Megawatt hodina',
  ...
```
This mapping can be used to translate product's field ```unit``` to a human readable text.

### Get statistics
```javascript
client.getStats({
   monthFrom : '04',
   yearFrom :  '2014',
   monthTill : '04',
   yearTill :  '2015',
   direction : 'd',
   products :  ['87120030', '87149110', '87149130'],
   countries : ['AT', 'DE', 'GB', 'US'],
   groupBy: 'E'
});
```
The ```direction``` param of the ```criteria``` has two possible values
- ```d``` means import
- ```v``` means export

The ```groupBy``` param of the ```criteria``` has four possible values and is not mandatory
- ```E``` default, group by defined timespan (```monthFrom```, ```yearFrom```, ```monthTill```, ```yearTill``` in criteria)
- ```A``` group by years
- ```Q``` group by quarters
- ```M``` group by months


The ```countries``` and ```products``` parameters can be obtained from the ```getXXX``` methods mentioned above.

Output is in the following format:

```javascript
{ period: { from: '1.4.2014', till: '30.4.2015' },
  direction: 'import',
  results:
   [ {
       period: '1.4.2014-30.4.2015'
       code: '87120030',
       name: 'Jízdní kola, bez motoru (kromě bez kuličkových ložisek)',
       country: 'AT',
       countryName: 'Rakousko',
       weight: '28113',
       price: '19908',
       unit: 'PCE',
       count: '1900' },
     {
       period: '1.4.2014-30.4.2015'
       code: '87120030',
       name: 'Jízdní kola, bez motoru (kromě bez kuličkových ložisek)',
       country: 'BD',
       countryName: 'Bangladéš',
       weight: '5127',
       price: '2185',
       unit: 'PCE',
       count: '556' },
       ....

```

The period in results can be eighter a timerange like '1.4.2014-30.4.2015' or identificator like
'4/2015'. The meaning of the identificator depends on ```groupBy``` option in request criteria. It can be 4th month of 2015 or 4th quarter of 2015.

## How it works
The library simply fills out the form on web page for you and parses results returned in the html table.

### Input form
![Form to be fillted out](https://github.com/todvora/extrade-cz-api/raw/master/form.png)
Form, to be filled out. Fields, that can be provided, are highlighted in green.

### Results page
![Form to be fillted out](https://github.com/todvora/extrade-cz-api/raw/master/result.png)
Result page, that is parsed in order to get JSON results.

## Change log

### 1.2.0
- Support for ```groupBy``` attribute, grouping results by months, quarters, years or the whole timespan.
- ```getUnits()``` method added.

### 1.1.5
- Initial version, basic enum and stats methods
