'use strict';

var request = require('request');
var Q = require('q');
var cheerio = require('cheerio');

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

var constructUrl = function(criteria) {
  return 'https://apl.czso.cz/pll/stazo/!presso.STAZO.PRIPRAV_ZOBRAZ' +
  '?mesic_od='+criteria.monthFrom+
  '&rok_od='+criteria.yearFrom+
  '&mesic_do='+criteria.monthTill+
  '&rok_do='+criteria.yearTill+
  '&kod_zbozi=' + encodeList(criteria.products) +
  '&n_kod_zbozi=' + encodeList(criteria.products) +
  '&dov_vyv=' + criteria.direction +
  '&kod_zeme=' + encodeList(criteria.countries) +
  '&n_kod_zeme=' + encodeList(criteria.countries) +
  '&seskup=E&typ_vyst=1&mena=CZK&omez=99999&tab=A&zb_zem=3&razeni1=x&smer1=+&razeni2=x&smer2=+&razeni3=x&smer3=+&nomen=18&ur_nomen=12&skup_zeme=1&vyber_zemi=1&jazyk=CS&par=D&max_obd=201504&email=&jmdot=&popdot=';
};

var getCellText = function(cell) {
  return cell.text().trim();
};

var parseRow = function($, row) {
  var cells = $(row).children('td');
  return {
    'code' : getCellText($(cells[0])),
    'name' : getCellText($(cells[1])),
    'country' : getCellText($(cells[2])),
    'countryName' : getCellText($(cells[3])),
    'weight' : getCellText($(cells[4])).replace(/ /g,''),
    'price' : getCellText($(cells[5])).replace(/ /g,''),
    'unit' : getCellText($(cells[6])),
    'count' : getCellText($(cells[7])).replace(/ /g,''),
  };
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

var parsePage = function(html) {
    var results = [];
    var $ = cheerio.load(html);
    $('table tr').slice(6).each(function() {
     results.push(parseRow($, $(this)));
    });

    var period = parseDates($);
    var direction = parseDirection($);
    return {
      'period': period,
      'direction': direction,
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
  return criteria;
};

var getStats = function(criteria) {
  return Q.fcall(validateCriteria, criteria)
    .then(constructUrl)
    .then(reqPromise)
    .then(parsePage);
};

var getCountries = function() {
  var url = 'https://apl.czso.cz/pll/stazo/STAZO.ZOBRAZ_CISELNIK?hodnota=1&nazev=Zem%C4%9B%20upraven%C3%A9%20pro%20statistiku&cislo_cis=3517&ur_nomen=0&jazyk=CS&rozlis=1920&obd_od=201504&obd_do=201504';
  return reqPromise(url)
    .then(parseEnum);
};

// could be read also from the XML on apl.czso.cz/pll/stazo/!presso.STAZO.PRIPRAV_ZOBRAZ?seskup=E&typ_vyst=1&par=O
// (contains full names, not only first N characters)
var getProducts = function() {
  var url = 'https://apl.czso.cz/pll/stazo/STAZO.ZOBRAZ_CISELNIK?hodnota=1&nazev=Kombinovan%C3%A1%20nomenklatura%288%29&cislo_cis=5585&ur_nomen=8&jazyk=CS&rozlis=1920&obd_od=201504&obd_do=201504';
  return reqPromise(url)
    .then(parseEnum);
};

var getLastDate = function() {
  return reqPromise('https://apl.czso.cz/pll/stazo/STAZO.STAZO')
  .then(parseLastDate);
};

module.exports = {
  getStats : getStats,
  getCountries : getCountries,
  getProducts : getProducts,
  getLastDate : getLastDate,
  constructUrl : constructUrl
};