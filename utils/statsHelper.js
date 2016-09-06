var utils = require('./utils.js')
  , statsHelper = function statsHelper(db) {
        if(!db) throw 'Stats helper: instance of dbProxy not found';
        var statsCount = null
          , isEqual = function isEqual(key, value, item) {
                return item[key] == value;
            }
          , contains = function contains(key, value, items) {
                return items.some(isEqual.bind(null, key, value));
            }
          , groupBy = function groupBy(key, acc, item, index) {
                /*var group = acc.filter(contains.bind(null, key, item[key]));
                if (group.length > 0) {
                    group[0].push(item)
                } else {
                    acc.push([item])
                }
                return acc;*/
                var ret;
                acc[item[key]] = acc[item[key]] || [];
                acc[item[key]].push(item);
                ret = acc;
                if(statsCount == index+1) {
                    ret = Object.keys(acc).map(function(k) {
                        //var r = {};
                        //r.push(acc[k]);
                        return acc[k];
                    });
                    acc = ret;
                }
                return acc;
            }
          , orderBy = function orderBy(key, direction, a, b) {
                var x = a
                  , y = b
                  ;
                if(!b) {
                    x = direction;
                    y = a;
                    direction = 'asc';
                }
                if(direction.toLowerCase() === 'desc')
                    return y[key] - x[key];
                else
                    return x[key] - y[key];
            }
          , sum = function sum(previous, current) {
                return {
                    author: current.author
                  , lines: current.lines + previous.lines
                  , words: current.words + previous.words
                  , links: current.links + previous.links
                  , emojis: current.emojis + previous.emojis
                };
            }
          , merge = function merge(group) {
                return group.reduce(sum);
            }
          , average = function average(avName, dividend, divisor, data) {
                data[avName] = (data[dividend] / data[divisor]).toFixed(2);
                return data;
            }
          , limit = function limit(count, item, index) {
                return index < count;
          }
          , select = function select(fields, item) {
                var result = {};
                for(var i = 0, c = fields.length;i<c;i++) {
                    if(item.hasOwnProperty(fields[i])) {
                        result[fields[i]] = item[fields[i]];
                    }
                }
                return result;
            }
          , helper = {
                getStats: function getStats(context) {
                    return new Promise(function (resolve, reject) {
                        var date = utils.expressionToDate(context.period).setHours(0);
                        db
                            .getAll({
                                channel: context.channel
                              , type: 'stats'
                              , query: {date: {$gte: date} }
                            })
                            .then(function (stats) {
                                statsCount = stats.length;
                                var results = stats
                                    //.reduce(groupBy.bind(null, 'author'), [])
                                    .reduce(groupBy.bind(null, 'author'), {})
                                    .map(merge)
                                    .map(average.bind(null, 'wordsPerLine', 'words', 'lines'))
                                    .map(average.bind(null, 'linksPerLine', 'links', 'lines'))
                                    .map(average.bind(null, 'emojisPerLine', 'emojis', 'lines'))
                                    .sort(orderBy.bind(null, context.info || helper.topFields[0], 'desc'));
                                if(context.limit) {
                                    results = results.filter(limit.bind(null, context.limit))
                                }
                                if(context.field) {
                                    results = results.map(select.bind(null, ['author', context.field] ) )
                                }
                                resolve(results);
                            })
                            .catch(function (err) {
                                reject(err);
                            });
                    });
                }
              , topFields: [ 'words', 'lines', 'links', 'emojis', 'wordsPerLine', 'linksPerLine', 'emojisPerLine' ]
            }
          ;
        return helper;
    }
  ;

module.exports = statsHelper;