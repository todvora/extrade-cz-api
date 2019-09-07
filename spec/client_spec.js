var client = require('../index.js');
var nock = require('nock');
var parse = require('url-parse');

describe('Web client', function () {

  beforeEach(function() {
   nock.disableNetConnect();
  });

  it('should parse list of products from result page', function (testDone) {
    nock('https://apl.czso.cz')
       .filteringPath(function() {return '/test';})
       .get('/test')
      .replyWithFile(200, __dirname + '/stats.html');
    client.getStats({
          'monthFrom' : '04',
          'yearFrom' : '2014',
          'monthTill' : '04',
          'yearTill' : '2015',
          'direction' : 'd', // possible values are d(import) and v(export)
          'products' : ['87120030', '87149110', '87149130'],
          'countries' : ['AT', 'DE', 'GB', 'US']
        })
      .then(function(data){

        expect(9).toEqual(data.results.length);

        expect(data.direction).toEqual('import');

        expect(data.groupBy).toEqual('E');

        expect('1.4.2014').toEqual(data.period.from);
        expect('30.4.2015').toEqual(data.period.till);

        var one = data.results.filter(function(item){return item.country === 'DE' && item.code === '87120030';});
        expect(one).toEqual([
        { period: '1.4.2014-30.4.2015',
          code: '87120030',
          name: 'Jízdní kola, bez motoru (kromě bez kuličkových ložisek)',
          country: 'DE',
          countryName: 'Německo',
          weight: '242954',
          price: '245766',
          unit: 'PCE',
          count: '19109' }
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

  it('should validate input criteria and report missing key', function (testDone) {
    client.getStats({
    'monthFrom' : '04',
    //'yearFrom' : '2014',
    'monthTill' : '04',
    'yearTill' : '2015',
    'direction' : 'd', // possible values are d(import) and v(export)
    'products' : ['87120030', '87149110', '87149130'],
    'countries' : ['AT', 'DE', 'GB', 'US']
    })
    .then(function(data){
      console.log(data);
      expect(true).toBe(false);
    })
    .fail(function(ex) {
     expect(ex).toEqual(new Error('Required key "yearFrom" not found in criteria'));

    })
    .fin(function () {
       testDone();
    })
    .done();
  });

  it('should validate input criteria and report invalid value', function (testDone) {
    client.getStats({
    'monthFrom' : '04',
    'yearFrom' : '2014',
    'monthTill' : '04',
    'yearTill' : '2015',
    'direction' : 'import', // should be d or v, not import or export
    'products' : ['87120030', '87149110', '87149130'],
    'countries' : ['AT', 'DE', 'GB', 'US']
    })
    .then(function(data){
      console.log(data);
      expect(true).toBe(false);
    })
    .fail(function(ex) {
     expect(ex).toEqual(new Error('Value "import" for key "direction" is invalid!'));

    })
    .fin(function () {
       testDone();
    })
    .done();
  });


  it('should construct correct url', function (testDone) {
    var url = client.constructUrl({
      'monthFrom' : '04',
      'yearFrom' : '2014',
      'monthTill' : '05',
      'yearTill' : '2015',
      'direction' : 'v', // possible values are d(import) and v(export)
      'products' : ['87120030', '87149110', '87149130'],
      'countries' : ['AT', 'DE', 'GB', 'US'],
      'groupBy' : 'Q'
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
    expect(parsed.query.n_kod_zeme).toEqual('AT,DE,GB,US');
    expect(parsed.query.seskup).toEqual('Q');

    testDone();
  });

  it('should handle both array and single value in the product and countries criteria', function (testDone) {
    var url = client.constructUrl({
      'monthFrom' : '04',
      'yearFrom' : '2014',
      'monthTill' : '05',
      'yearTill' : '2015',
      'direction' : 'v', // possible values are d(import) and v(export)
      'products' : '87149130',
      'countries' : 'AT'
    });

    var parsed = parse(url, true);

    expect(parsed.query.kod_zbozi).toEqual('87149130');
    expect(parsed.query.n_kod_zbozi).toEqual('87149130');
    expect(parsed.query.kod_zeme).toEqual('AT');
    expect(parsed.query.n_kod_zeme).toEqual('AT');

    testDone();
  });

  it('should get and parse list of countries from enum', function (testDone) {
    nock('https://apl.czso.cz')
       .filteringPath(function() {return '/test';})
       .get('/test')
      .replyWithFile(200, __dirname + '/countries.html');

    client.getCountries()
      .then(function(result){
        expect(Object.keys(result).length).toEqual(249);
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
       .filteringPath(function() {return '/test';})
       .get('/test')
      .replyWithFile(200, __dirname + '/products.html');

    client.getProducts()
      .then(function(result){
        expect(Object.keys(result).length).toEqual(10246);
        expect(result['87120030']).toEqual('Jízdní kola, bez motoru (kromě bez kuličkových ložisek)');
//        Object.keys(result).forEach(function(key){
//          expect(result[key].length).toBeLessThan(80);
//        });
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
       .filteringPath(function() {return '/test';})
       .get('/test')
      .replyWithFile(200, __dirname + '/homepage.html');

    client.getLastDate()
      .then(function(result){
        expect('10').toEqual(result.month);
        expect('2018').toEqual(result.year);
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

  it('should return all known measure units of products', function (testDone) {
    client.getUnits()
      .then(function(result){
        expect(result.MWH).toEqual('Megawatt hodina');
        expect(Object.keys(result).length).toEqual(48);
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

  it('should parse groupped products by quarter', function (testDone) {
    nock('https://apl.czso.cz')
       .filteringPath(function() {return '/test';})
       .get('/test')
      .replyWithFile(200, __dirname + '/groupped.html');

    client.getStats({
          'monthFrom' : '01',
          'yearFrom' : '2014',
          'monthTill' : '03',
          'yearTill' : '2015',
          'direction' : 'd', // possible values are d(import) and v(export)
          'groupBy': 'Q',
          'products' : ['87120030'],
          'countries' : ['AT', 'DE']
        })
      .then(function(data){
        expect(data.results.length).toEqual(10);

        var one = data.results[2];

        expect(one).toEqual(
        { period: '2/2014',
          code: '09109105',
          name: 'Kari',
          country: 'AT',
          countryName: 'Rakousko',
          weight: '3170',
          price: '423',
          unit: 'ZZZ',
          count: '' }
        );
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
