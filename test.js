var client = require('./index');

client.getStats({
   monthFrom : '1',
   yearFrom :  '2014',
   monthTill : '6',
   yearTill :  '2014',
   direction : 'v',
   products :  ['87120030', '87149110'],
   countries : ['AT', 'DE'],
   groupBy: 'Q'
})
.then(function(data){console.log(data)})
.done();