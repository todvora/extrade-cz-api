## Node.js module / client for the czech external trade statistics database

Parsing library (unofficial) for the following statistics database:

[https://apl.czso.cz/pll/stazo/STAZO.STAZO](https://apl.czso.cz/pll/stazo/STAZO.STAZO)

![Logo](https://apl.czso.cz/pll/stazo/ss?j=nove_logo_CS.png)

## API

All the API methods return [Q promises](https://www.npmjs.com/package/q). You can simply handle all the possible states, as follows:

```javascript
client.getCountries()
   .then(function(result){
     console.log(Object.keys(result)); // prints all the country codes
   })
   .fail(function(ex) {
     console.log(ex); // prints to the error on the stdout
   })
   .fin(function () {
     console.log('done'); // will be called in both success and failure cases
   })
   .done(); // called to be sure, that we consumed all available states
```


Get the client object:
```javascript
var client = require('externtrade-cz-api');
```

### Get list of available countries
```javascript
client.getCountries();
```
Should return object (map) from code to country name, for example:
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

### Get list of available products
```javascript
client.getProducts();
```
Should return object (map) from code to product name, for example:
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
The statistics are not always up-to-date and there is some delay. Is it possible to
obtain last available date of statistics by calling

```javascript
client.getLastDate();
```
Should return object (map) in following format:

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
The ```direction``` param of ```criteria``` has two possible values
- ```d``` means import
- ```v``` means export

The ```countries``` and ```products``` parameters can be obtained from the ```getXXX``` methods
mentioned above.

Output is in the following format:

```javascript
{ period: { from: '1.4.2014', till: '30.4.2015' },
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
