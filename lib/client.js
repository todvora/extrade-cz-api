'use strict';

var request = require('request');
var Q = require('q');
var cheerio = require('cheerio');
var path = require('path');
var fs = require('fs');

var reqPromise = function(url) {
  var deferred = Q.defer();
  request(url, function (error, response, body) {
    if (!error) {
      if(response.statusCode == 200) {
        deferred.resolve(body);
      } else {
        deferred.reject({'message': 'Error ' + response.statusCode + ': ' + body});
      }
    } else {
      deferred.reject(error);
    }
  });
  return deferred.promise;
};

var encodeList = function(value) {
  return encodeURIComponent([].concat(value).join(','));
};

var alignMonth = function(value) {
  var num = parseInt(value);
  return '' + num < 10 ? '0' + num : num;
};

var constructUrl = function(criteria) {
  return 'https://apl.czso.cz/pll/stazo/!presso.STAZO.PRIPRAV_ZOBRAZ' +
  '?mesic_od='+alignMonth(criteria.monthFrom)+
  '&rok_od='+criteria.yearFrom+
  '&mesic_do='+alignMonth(criteria.monthTill)+
  '&rok_do='+criteria.yearTill+
  '&kod_zbozi=' + encodeList(criteria.products) +
  '&n_kod_zbozi=' + encodeList(criteria.products) +
  '&dov_vyv=' + criteria.direction +
  '&kod_zeme=' + encodeList(criteria.countries) +
  '&n_kod_zeme=' + encodeList(criteria.countries) +
  '&seskup=' + criteria.groupBy +
  '&typ_vyst=1&mena=CZK&omez=99999&tab=A&zb_zem=3&razeni1=x&smer1=+&razeni2=x&smer2=+&razeni3=x&smer3=+&nomen=18&ur_nomen=12&skup_zeme=1&vyber_zemi=1&jazyk=CS&par=D&max_obd=201504&email=&jmdot=&popdot=';
};

var formatNumber = function(value) {
   var withoutSpaces = value.replace(/ /g,'');
    var parsed = parseInt(withoutSpaces);
    if(!isNaN(parsed)) {
      return '' + parsed; // TODO: should be string rather than nr?
    }
    return value;
};

var parseRow = function($, row, mapping) {
  return $(row).children('td')
    .map(function(index, cell) {
      var property = mapping[index];
      var text = $(cell).text().trim();
      var value = property.isNumeric ? formatNumber(text) : text;
      return {prop:property.prop, value:value};
    })
    .get()
    .reduce(function(acc, current){acc[current.prop] = current.value; return acc;}, {});
};

var parseDates = function($) {
  var cell = $($($('table tr')[2]).children('td')[1]).text();
  var res = cell.match(/(.*)\s+(?:\W+)\s+(.*)/);
  return {
    'from' : res[1].trim(),
    'till' : res[2].trim()
  };
};

var parseDirection = function($) {
  var cell = $($($('table tr')[1]).children('td')[1]).text();
  if(cell.indexOf('Dovoz') !== -1) {
    return 'import';
  } else {
    return 'export';
  }
};

var getColsMapping = function($, headerRow) {
  var namesMapping = {
    'Kód zboží':{prop:'code', isNumeric:false},
    'Název zboží': {prop:'name', isNumeric:false},
    'Kód země': {prop:'country', isNumeric:false},
    'Název země': {prop:'countryName', isNumeric:false},
    'Netto (kg)': {prop:'weight', isNumeric:true},
    'Stat. hodnota CZK(tis.)': {prop:'price', isNumeric:true},
    'MJ': {prop:'unit', isNumeric:false},
    'Množství v MJ': {prop:'count', isNumeric:true},
    'Období': {prop:'period', isNumeric:false},
  };

  return $(headerRow).children('td').map(function(index){
    var label = $(this).text();
    return {index:index, prop: namesMapping[label]};
  }).get()
    .reduce(function(acc, current){acc[current.index] = current.prop;return acc;}, {});
};

var parsePage = function(html, criteria) {
    var results = [];
    var $ = cheerio.load(html);
    var rows = $('table tr');

    var mapping = getColsMapping($, rows[5]);
    var period = parseDates($);
    var direction = parseDirection($);

    rows.slice(6,-2).each(function() {
     var row = parseRow($, this, mapping);
     if(typeof row.period === 'undefined') {
      row.period = period.from + '-' + period.till;
     }
     results.push(row);
    });


    return {
      'period': period,
      'direction': direction,
      'groupBy': criteria.groupBy,
      'results' : results
    };
};

var parseEnum = function(html) {
  // the enum page is not valid HTML and due to < and > chars it's not possible to parse it using cheerio
  var regex = /<OPTION value="([A-Z0-9]+)">(.+)<\/OPTION>/g;
  var results = {};
  var match;
  while ((match = regex.exec(html))  !== null) {
    var code = match[1];
    var name = match[2].replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').replace(code + ' - ', '');
    results[code] = name;
  }
  return results;
};

var parseLastDate = function(html) {
  var res = html.match(/napln_mes\("do","(?:.*)","(\d+)","(\d+)"\);/);
  return {
    'month' : res[1],
    'year' : res[2],
  };
};

var validateCriteria = function(criteria) {
  var parseInteger = function(value){return !isNaN(parseInt(value));};
  var isCorrectDirection = function(value){return value === 'd' || value == 'v';};
  var isArrayOrString = function(value){return Array.isArray(value) || typeof value === 'string';};

  var validators = {
    monthFrom: parseInteger,
    yearFrom: parseInteger,
    monthTill: parseInteger,
    yearTill: parseInteger,
    products: isArrayOrString,
    direction: isCorrectDirection,
    countries: isArrayOrString
  };

  Object.keys(validators).forEach(function(key) {
    var validator = validators[key];
    if(typeof criteria[key] === 'undefined') {
      throw new Error('Required key "'+key+'" not found in criteria');
    }
    var value = criteria[key];
    var valid = validator(value);
    if(!valid) {
      throw new Error('Value "'+value+'" for key "'+key+'" is invalid!');
    }
  });

  if(typeof criteria.groupBy === 'undefined') {
      criteria.groupBy = 'E'; // default value, group by the defined timespan
  }
  return criteria;
};

var getStats = function(criteria) {
  return Q.fcall(validateCriteria, criteria)
    .then(constructUrl)
    .then(reqPromise)
    .then(function(html){return parsePage(html, criteria);});
};

var getCountries = function() {
  var url = 'https://apl.czso.cz/pll/stazo/STAZO.ZOBRAZ_CISELNIK?hodnota=1&nazev=Zem%C4%9B%20upraven%C3%A9%20pro%20statistiku&cislo_cis=3517&ur_nomen=0&jazyk=CS&rozlis=1920&obd_od=201504&obd_do=201801';
  return reqPromise(url)
    .then(parseEnum);
};

// could be read also from the XML on apl.czso.cz/pll/stazo/!presso.STAZO.PRIPRAV_ZOBRAZ?seskup=E&typ_vyst=1&par=O
// (contains full names, not only first N characters)
var getProducts = function() {
  var url = 'https://apl.czso.cz/pll/stazo/STAZO.ZOBRAZ_CISELNIK?hodnota=1&nazev=Kombinovan%C3%A1%20nomenklatura%288%29&cislo_cis=5585&ur_nomen=8&jazyk=CS&rozlis=1920&obd_od=201504&obd_do=201801';
  return reqPromise(url)
    .then(parseEnum);
};

var getLastDate = function() {
  return reqPromise('https://apl.czso.cz/pll/stazo/STAZO.STAZO')
  .then(parseLastDate);
};

var getUnits = function() {
  return Q.nfcall(fs.readFile, path.resolve(__dirname, 'units.json'), 'utf-8')
    .then(JSON.parse);
};

module.exports = {
  getStats : getStats,
  getCountries : getCountries,
  getProducts : getProducts,
  getLastDate : getLastDate,
  constructUrl : constructUrl,
  getUnits: getUnits
};
