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

var constructUrl = function(criteria) {
  return 'https://apl.czso.cz/pll/stazo/!presso.STAZO.PRIPRAV_ZOBRAZ' +
  '?mesic_od='+criteria.monthFrom+
  '&rok_od='+criteria.yearFrom+
  '&mesic_do='+criteria.monthTill+
  '&rok_do='+criteria.yearTill+
  '&kod_zbozi=' + encodeURIComponent(criteria.products.join(',')) +
  '&n_kod_zbozi=' + encodeURIComponent(criteria.products.join(',')) +
  '&dov_vyv=' + criteria.direction +
  '&kod_zeme=' + encodeURIComponent(criteria.countries.join(',')) +
  '&n_kod_zeme=' + encodeURIComponent(criteria.countries.join(',')) +
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

var parsePage = function(html) {
    var results = [];
    $ = cheerio.load(html);
    $('table tr').slice(6).each(function(i, elem) {
     results.push(parseRow($, $(this)));
    });

    var period = parseDates($);
    return Q.resolve({
      'period': period,
      'results' : results
    });
};

var parseEnum = function(html) {
  // the enum page is not valid HTML and due to < and > chars it's not possible to parse it using cheerio
  regex = /<OPTION value="([A-Z0-9]+)">(.+)<\/OPTION>/g;
  var results = {};
  var match;
  while ((match = regex.exec(html))  !== null) {
    code = match[1];
    name = match[2].replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').replace(code + ' - ', '');
    results[code] = name;
  }
  return Q.resolve(results);
};

var parseLastDate = function(html) {
  var res = html.match(/napln_mes\("do","(?:.*)","(\d+)","(\d+)"\);/);
  return Q.resolve({
    'month' : res[1],
    'year' : res[2],
  });
};

var getStats = function(criteria) {
  return reqPromise(constructUrl(criteria))
    .then(function(html){return parsePage(html);});
};

var getCountries = function() {
  var url = 'https://apl.czso.cz/pll/stazo/STAZO.ZOBRAZ_CISELNIK?hodnota=1&nazev=Zem%C4%9B%20upraven%C3%A9%20pro%20statistiku&cislo_cis=3517&ur_nomen=0&jazyk=CS&rozlis=1920&obd_od=201504&obd_do=201504';
  return reqPromise(url).then(function(html){return parseEnum(html);});
};

var getProducts = function() {
  var url = 'https://apl.czso.cz/pll/stazo/STAZO.ZOBRAZ_CISELNIK?hodnota=1&nazev=Kombinovan%C3%A1%20nomenklatura%288%29&cislo_cis=5585&ur_nomen=8&jazyk=CS&rozlis=1920&obd_od=201504&obd_do=201504';
  return reqPromise(url).then(function(html){return parseEnum(html);});
};

var getLastDate = function() {
  return reqPromise('https://apl.czso.cz/pll/stazo/STAZO.STAZO')
  .then(function(html){return parseLastDate(html);});
};

module.exports = {
  getStats : getStats,
  getCountries : getCountries,
  getProducts : getProducts,
  getLastDate : getLastDate,
  constructUrl : constructUrl
};