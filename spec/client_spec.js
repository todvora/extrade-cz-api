var client = require('../index.js');
var nock = require('nock');
var parse = require('url-parse');

describe('Web client', function () {

 beforeEach(function() {
 nock.disableNetConnect();
  });

  it('should parse list of products from result page', function (testDone) {
    nock('https://apl.czso.cz')
       .filteringPath(function(path) {return '/test';})
       .get('/test')
      .replyWithFile(200, __dirname + '/stats.html');

    client.getStats({
          'monthFrom' : '04',
          'yearFrom' : '2014',
          'monthTill' : '04',
          'yearTill' : '2015',
          'direction' : 'd', // possible values are D(import) and V(export)
          'products' : ['87120030', '87149110', '87149130'],
          'countries' : ['AT', 'DE', 'GB', 'US']
        })
      .then(function(data){

        expect(data.results.length).toEqual(71);

        expect(data.period.from).toEqual('1.4.2014');
        expect(data.period.till).toEqual('30.4.2015');

        var one = data.results.filter(function(item){return item.country === 'DE' && item.code === '87120030';});
        expect(one).toEqual([
        { code: '87120030',
          name: 'Jízdní kola, bez motoru (kromě bez kuličkových ložisek)',
          country: 'DE',
          countryName: 'Německo',
          weight: '242814',
          price: '245717',
          unit: 'PCE',
          count: '19090' }
        ]);
      })
      .fail(function(ex) {
        console.log(ex);
        expect(true).toBe(false);
      })
      .fin(function () {
         testDone();
      })
      .done();
  });

  it('should construct corect url', function (testDone) {
    var url = client.constructUrl({
      'monthFrom' : '04',
      'yearFrom' : '2014',
      'monthTill' : '05',
      'yearTill' : '2015',
      'direction' : 'v', // possible values are d(import) and v(export)
      'products' : ['87120030', '87149110', '87149130'],
      'countries' : ['AT', 'DE', 'GB', 'US']
    });

    var parsed = parse(url, true);

    expect(parsed.query.mesic_od).toEqual('04');
    expect(parsed.query.mesic_do).toEqual('05');
    expect(parsed.query.rok_od).toEqual('2014');
    expect(parsed.query.rok_do).toEqual('2015');
    expect(parsed.query.rok_do).toEqual('2015');
    expect(parsed.query.dov_vyv).toEqual('v');
    expect(parsed.query.kod_zbozi).toEqual('87120030,87149110,87149130');
    expect(parsed.query.n_kod_zbozi).toEqual('87120030,87149110,87149130');
    expect(parsed.query.kod_zeme).toEqual('AT,DE,GB,US');

    testDone();
  });

  it('should get and parse list of countries from enum', function (testDone) {
    nock('https://apl.czso.cz')
       .filteringPath(function(path) {return '/test';})
       .get('/test')
      .replyWithFile(200, __dirname + '/countries.html');

    client.getCountries()
      .then(function(result){
        expect(Object.keys(result).length).toEqual(244);
        expect(result.AT).toEqual('Rakousko');
      })
      .fail(function(ex) {
        console.log(ex);
        expect(true).toBe(false);
      })
      .fin(function () {
         testDone();
      })
      .done();
  });

  it('should get and parse list of products from enum', function (testDone) {
    nock('https://apl.czso.cz')
       .filteringPath(function(path) {return '/test';})
       .get('/test')
      .replyWithFile(200, __dirname + '/products.html');

    client.getProducts()
      .then(function(result){
        expect(Object.keys(result).length).toEqual(9490);
        expect(result['87120030']).toEqual('Jízdní kola, bez motoru (kromě bez kuličkových ložisek)');
      })
      .fail(function(ex) {
        console.log(ex);
        expect(true).toBe(false);
      })
      .fin(function () {
         testDone();
      })
      .done();
  });

  it('should parse the last available date from homepage', function (testDone) {
    nock('https://apl.czso.cz')
       .filteringPath(function(path) {return '/test';})
       .get('/test')
      .replyWithFile(200, __dirname + '/homepage.html');

    client.getLastDate()
      .then(function(result){
        expect(result.month).toEqual('04');
        expect(result.year).toEqual('2015');
      })
      .fail(function(ex) {
        console.log(ex);
        expect(true).toBe(false);
      })
      .fin(function () {
         testDone();
      })
      .done();
  });
});